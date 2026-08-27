import type { Store } from "./types.ts";

/**
 * In-memory Store. Shaped like the deployed single-table DynamoDB store
 * (pk + sk, prefix query, conditional put) so features written against it
 * run unchanged on AWS.
 */
export class MemoryStore implements Store {
  // pk -> (sk -> item), sk map kept sorted on read.
  private tables = new Map<string, Map<string, Record<string, unknown>>>();

  private partition(pk: string): Map<string, Record<string, unknown>> {
    let p = this.tables.get(pk);
    if (!p) {
      p = new Map();
      this.tables.set(pk, p);
    }
    return p;
  }

  async put(
    pk: string,
    sk: string,
    item: Record<string, unknown>,
  ): Promise<void> {
    this.partition(pk).set(sk, { ...item });
  }

  async putIfAbsent(
    pk: string,
    sk: string,
    item: Record<string, unknown>,
  ): Promise<boolean> {
    const p = this.partition(pk);
    if (p.has(sk)) return false;
    p.set(sk, { ...item });
    return true;
  }

  async get(
    pk: string,
    sk: string,
  ): Promise<Record<string, unknown> | undefined> {
    const item = this.tables.get(pk)?.get(sk);
    return item ? { ...item } : undefined;
  }

  async query(
    pk: string,
    skPrefix: string,
  ): Promise<Record<string, unknown>[]> {
    const p = this.tables.get(pk);
    if (!p) return [];
    return [...p.entries()]
      .filter(([sk]) => sk.startsWith(skPrefix))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, item]) => ({ ...item }));
  }

  async delete(pk: string, sk: string): Promise<void> {
    this.tables.get(pk)?.delete(sk);
  }
}
