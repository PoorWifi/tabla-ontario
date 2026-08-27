import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Store } from "./types.ts";

/**
 * DynamoDB single-table Store. Same interface as MemoryStore, so feature
 * code runs unchanged. The AWS SDK v3 is provided by the Lambda nodejs
 * runtime - it is a devDependency here (for typecheck) and marked external
 * in the esbuild bundle, keeping the artifact tiny.
 *
 * Mapping:
 *   putIfAbsent -> ConditionExpression attribute_not_exists(pk)
 *   query       -> KeyConditionExpression begins_with(sk, :prefix)
 */
export class DynamoDbStore implements Store {
  private doc: DynamoDBDocumentClient;
  private table: string;

  constructor(tableName: string, client?: DynamoDBClient) {
    this.table = tableName;
    this.doc = DynamoDBDocumentClient.from(client ?? new DynamoDBClient({}));
  }

  async put(
    pk: string,
    sk: string,
    item: Record<string, unknown>,
  ): Promise<void> {
    await this.doc.send(
      new PutCommand({ TableName: this.table, Item: { ...item, pk, sk } }),
    );
  }

  async putIfAbsent(
    pk: string,
    sk: string,
    item: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.table,
          Item: { ...item, pk, sk },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
      return true;
    } catch (err) {
      if (
        err instanceof Error &&
        err.name === "ConditionalCheckFailedException"
      ) {
        return false;
      }
      throw err;
    }
  }

  async get(
    pk: string,
    sk: string,
  ): Promise<Record<string, unknown> | undefined> {
    const out = await this.doc.send(
      new GetCommand({ TableName: this.table, Key: { pk, sk } }),
    );
    return out.Item ? strip(out.Item) : undefined;
  }

  async query(
    pk: string,
    skPrefix: string,
  ): Promise<Record<string, unknown>[]> {
    const items: Record<string, unknown>[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const out = await this.doc.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :p)",
          ExpressionAttributeValues: { ":pk": pk, ":p": skPrefix },
          ExclusiveStartKey: startKey,
        }),
      );
      for (const item of out.Items ?? []) items.push(strip(item));
      startKey = out.LastEvaluatedKey;
    } while (startKey);
    return items;
  }

  async delete(pk: string, sk: string): Promise<void> {
    await this.doc.send(
      new DeleteCommand({ TableName: this.table, Key: { pk, sk } }),
    );
  }
}

/** Keys live in the table schema, not in the item the caller stored. */
function strip(item: Record<string, unknown>): Record<string, unknown> {
  const { pk: _pk, sk: _sk, ...rest } = item;
  return rest;
}
