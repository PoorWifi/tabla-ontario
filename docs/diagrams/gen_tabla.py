#!/usr/bin/env python3
"""tabla AWS diagrams.

    python3 gen_tabla.py   # write .excalidraw + validate + render SVG + viewer

Two scenes for the workshop deck, aimed at people who know some AWS and
want to see real services doing real work:

  tabla-01-runtime   what a phone tap touches
  tabla-02-pipeline  how code ships and gets reviewed (the OIDC story)
"""
from __future__ import annotations

import pathlib
import sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))

from scene import (AMBER, AMBER_FILL, DEEP, DEEP_FILL, GREY, GREY_FILL, INK,
                   RED, SANS, TEAL, TEAL_FILL, Scene, render, validate)

SVG = HERE / "svg"


def scene_runtime() -> Scene:
    s = Scene("tabla-01-runtime")
    s.title(
        60, 30,
        "tabla at runtime: three AWS services, no servers",
        "Everything the room touches. Idle cost is ~$0 - every service here "
        "bills per request.",
    )

    # -- the room ----------------------------------------------------------
    room = s.box(60, 170, 190, 150, stroke=TEAL, fill=TEAL_FILL)
    s.text(75, 184, "THE ROOM", size=18, family=SANS, colour=TEAL)
    s.box(75, 216, 160, 40, "30 phones", stroke=TEAL, fill="#ffffff", size=13)
    s.box(75, 264, 160, 40, "1 projector", stroke=TEAL, fill="#ffffff", size=13)

    # -- function URL ------------------------------------------------------
    furl = s.box(330, 190, 230, 110, stroke=DEEP, fill=DEEP_FILL)
    s.text(345, 204, "Lambda Function URL", size=16, family=SANS, colour=DEEP)
    s.text(345, 234, "HTTPS endpoint built into the\n"
                     "function - no API Gateway,\nno extra charge", size=12,
           colour=GREY)

    # -- lambda ------------------------------------------------------------
    lam = s.box(640, 170, 260, 150, stroke=AMBER, fill=AMBER_FILL)
    s.text(655, 184, "AWS Lambda", size=18, family=SANS, colour=AMBER)
    s.text(655, 214, "nodejs22.x on arm64 · 512 MB", size=12, colour=GREY)
    s.box(655, 240, 230, 32, "spine router + all features",
          stroke=AMBER, fill="#ffffff", size=12)
    s.text(655, 282, "one 11 KB bundle - the whole app", size=11, colour=GREY)

    # -- dynamodb ----------------------------------------------------------
    ddb = s.box(980, 170, 260, 150, stroke=DEEP, fill=DEEP_FILL)
    s.text(995, 184, "Amazon DynamoDB", size=18, family=SANS, colour=DEEP)
    s.text(995, 214, "ONE table, on-demand billing", size=12, colour=GREY)
    s.box(995, 240, 230, 32, "pk SESSION#<id>", stroke=DEEP,
          fill="#ffffff", size=12)
    s.box(995, 280, 230, 32, "sk <TYPE>#<discriminator>", stroke=DEEP,
          fill="#ffffff", size=12)

    # -- logs --------------------------------------------------------------
    logs = s.box(640, 380, 260, 70, "Amazon CloudWatch Logs\n7-day retention",
                 stroke=GREY, fill=GREY_FILL, size=13)

    s.arrow([s.right_of(room), s.left_of(furl)], start=room, end=furl,
            stroke=TEAL, both=True)
    s.text(258, 214, "GET + taps", size=10, colour=GREY)
    s.arrow([s.right_of(furl), s.left_of(lam)], start=furl, end=lam,
            stroke=DEEP)
    s.arrow([s.right_of(lam), s.left_of(ddb)], start=lam, end=ddb,
            stroke=AMBER, both=True)
    s.text(912, 210, "4 verbs", size=11, colour=GREY)
    s.arrow([s.below(lam), (770, 380)], stroke=GREY, dashed=True, width=1)
    return s


def scene_pipeline() -> Scene:
    s = Scene("tabla-02-pipeline")
    s.title(
        60, 30,
        "the pipeline: nobody in the room holds an AWS key",
        "Two GitHub-to-AWS paths, both keyless via OIDC. AWS trusts the "
        "repo's immutable ID -\nnot its name, and not a stored secret.",
    )

    # -- github side -------------------------------------------------------
    repo = s.box(60, 190, 240, 130, stroke=INK, fill="#ffffff")
    s.text(75, 204, "GitHub repo", size=17, family=SANS, colour=INK)
    s.text(75, 234, "aws-hacktivity/tabla-<event>\n"
                    "branch protection: gate, hygiene,\n"
                    "AI Verdict, human review", size=11, colour=GREY)

    # -- ship path (top) ---------------------------------------------------
    ship = s.box(400, 130, 250, 100, stroke=DEEP, fill=DEEP_FILL)
    s.text(415, 144, "GitHub Actions: deploy", size=15, family=SANS,
           colour=DEEP)
    s.text(415, 172, "fires on merge to main only", size=12, colour=GREY)

    deploy_role = s.box(740, 130, 250, 100, stroke=DEEP, fill=DEEP_FILL)
    s.text(755, 144, "IAM role: tabla-github-deploy", size=14, family=SANS,
           colour=DEEP)
    s.text(755, 172, "scoped to the tabla stacks +\nthe SAM transform",
           size=12, colour=GREY)

    sam = s.box(1080, 130, 250, 100, stroke=AMBER, fill=AMBER_FILL)
    s.text(1095, 144, "AWS SAM / CloudFormation", size=14, family=SANS,
           colour=AMBER)
    s.text(1095, 172, "deploys Lambda + DynamoDB\n(the runtime diagram)",
           size=12, colour=GREY)

    # -- review path (bottom) ----------------------------------------------
    review = s.box(400, 330, 250, 100, stroke=RED, fill="#ffe8e8")
    s.text(415, 344, "GitHub Actions: AI review", size=15, family=SANS,
           colour=RED)
    s.text(415, 372, "fires on every pull request", size=12, colour=GREY)

    review_role = s.box(740, 330, 250, 100, stroke=RED, fill="#ffe8e8")
    s.text(755, 344, "IAM role: tabla-github-review", size=14, family=SANS,
           colour=RED)
    s.text(755, 372, "can invoke Bedrock models -\nand nothing else",
           size=12, colour=GREY)

    bedrock = s.box(1080, 310, 250, 140, stroke=RED, fill="#ffe8e8")
    s.text(1095, 324, "Amazon Bedrock", size=17, family=SANS, colour=RED)
    s.box(1095, 354, 220, 32, "Claude Opus 5 - code lane",
          stroke=RED, fill="#ffffff", size=12)
    s.box(1095, 394, 220, 32, "GPT 5.6 Terra - context lane",
          stroke=RED, fill="#ffffff", size=12)

    s.arrow([(300, 220), (400, 180)], stroke=DEEP)
    s.text(305, 172, "merge", size=12, colour=DEEP)
    s.arrow([(300, 290), (400, 380)], stroke=RED)
    s.text(305, 352, "pull request", size=12, colour=RED)

    s.arrow([s.right_of(ship), s.left_of(deploy_role)], start=ship,
            end=deploy_role, stroke=DEEP)
    s.text(662, 158, "OIDC", size=12, family=SANS, colour=DEEP)
    s.arrow([s.right_of(deploy_role), s.left_of(sam)], start=deploy_role,
            end=sam, stroke=DEEP)

    s.arrow([s.right_of(review), s.left_of(review_role)], start=review,
            end=review_role, stroke=RED)
    s.text(662, 358, "OIDC", size=12, family=SANS, colour=RED)
    s.arrow([s.right_of(review_role), s.left_of(bedrock)], start=review_role,
            end=bedrock, stroke=RED)
    return s


def main() -> int:
    ok = True
    svgs: list[tuple[str, str]] = []
    for build in (scene_runtime, scene_pipeline):
        s = build()
        doc = s.doc()
        problems = validate(doc)
        for p in problems:
            print(f"  {s.name}: {p}")
        ok = ok and not problems
        s.save(HERE)
        svg, w, h = render(doc)
        SVG.mkdir(exist_ok=True)
        (SVG / f"{s.name}.svg").write_text(svg)
        svgs.append((s.name, svg))
        print(f"{s.name}: {len(doc['elements'])} elements, svg {w}x{h}")

    body = "\n".join(
        f"<h2>{name}</h2>\n{svg}" for name, svg in svgs)
    (HERE / "index.html").write_text(
        "<!doctype html><meta charset='utf-8'><title>tabla AWS diagrams"
        "</title><style>body{font-family:system-ui;max-width:1400px;"
        "margin:2rem auto;padding:0 1rem}"
        "svg{width:100%;height:auto;background:#fff;border:1px solid "
        "#e5e5e5;border-radius:8px}</style>\n" + body + "\n")
    print("viewer: index.html")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
