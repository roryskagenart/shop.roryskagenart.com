#!/usr/bin/env python3
"""Normalize migrated SKILL.md frontmatter to a tool-agnostic shape.

The skills under `docs/agentic/skills/` were migrated out of an agent-specific
runtime. That runtime's frontmatter carries keys other runners ignore
(`agent_created`, `visibility`, `display_name`, `description_zh`, `description_en`).
This rewrites each file's frontmatter to the portable subset plus provenance.

Portable keys kept: `name`, `description`, `version`.
Added: `x-origin`, plus **one** provenance date — `x-created` for a skill
authored in this repo, `x-migrated` for one ported in from a runtime.

An existing `x-migrated` is **preserved**, so re-running over the whole tree is
idempotent and the 2026-10-02 bulk migration keeps its real date. A file that
has no `x-migrated` yet gets `--migrated`, which defaults to that same date —
pass the actual date when porting a skill that is not part of the bulk
migration, so the provenance line is not a false claim.

⚠️ A file carrying `x-created` is repo-authored. It stays on `x-created` and is
never given an `x-migrated`, because that would be both false and destructive of
the real creation date. Preserving it is what makes this script safe to run over
the whole tree — without that, a repo-wide run rewrites the provenance of every
skill that was written here rather than ported in.

Idempotent: running it twice produces the same bytes.

Usage:
    python normalize-skill-frontmatter.py [skills_root] [--migrated YYYY-MM-DD]
"""

from __future__ import annotations

import pathlib
import re
import sys

MIGRATED = "2026-10-02"
ORIGIN = "workbuddy-ai/skills"
KEEP = ("name", "description", "version")
FIELD = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s?(.*)$")


def unquote(value: str) -> str:
    """Undo one layer of quote wrapping — single **or** double — including escapes.

    Without this the render step wraps an already-quoted value a second time
    and the file is no longer idempotent. Single quotes matter: a description
    written as `'...'` is invalid YAML the moment it contains an apostrophe
    (`this shop's subset`), and leaving it alone would keep the file
    un-normalisable forever.
    """
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        quote = value[0]
        inner = value[1:-1]
        return inner.replace(f"\\{quote}", quote).replace("\\\\", "\\")
    return value


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        raise ValueError("no leading frontmatter block")
    end = text.index("\n---", 3)
    raw = text[4:end]
    body = text[end + 4 :].lstrip("\n")
    fields: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = FIELD.match(line)
        if m:
            fields[m.group(1)] = unquote(m.group(2).strip())
    return fields, body


def render(fields: dict[str, str], body: str, migrated: str) -> str:
    lines = ["---"]
    for key in KEEP:
        value = fields.get(key)
        if value is None:
            raise ValueError(f"missing required key {key!r}")
        if key == "description":
            # Descriptions are long and contain colons/commas; keep them quoted
            # and on one line so every YAML parser reads them the same way.
            escaped = value.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'{key}: "{escaped}"')
        else:
            lines.append(f"{key}: {value}")
    lines.append(f"x-origin: {fields.get('x-origin', ORIGIN)}")
    if "x-created" in fields:
        # Authored in this repo rather than ported in. Record when it was
        # created, and do NOT also claim a migration date: `x-migrated` on a
        # repo-authored skill is a false provenance claim, and emitting it
        # silently destroys the real `x-created`.
        lines.append(f"x-created: {fields['x-created']}")
    else:
        # Preserve a recorded date. Rewriting it would relabel the bulk
        # migration every time a new skill is added to the tree.
        lines.append(f"x-migrated: {fields.get('x-migrated', migrated)}")
    lines.append("---")
    return "\n".join(lines) + "\n\n" + body.rstrip("\n") + "\n"


def main() -> int:
    argv = sys.argv[1:]
    migrated = MIGRATED
    positional: list[str] = []
    i = 0
    while i < len(argv):
        if argv[i] == "--migrated":
            if i + 1 >= len(argv):
                print("--migrated needs a YYYY-MM-DD value", file=sys.stderr)
                return 2
            migrated = argv[i + 1]
            i += 2
            continue
        positional.append(argv[i])
        i += 1

    root = pathlib.Path(positional[0] if positional else "docs/agentic/skills")
    targets = sorted(root.glob("*/SKILL.md"))
    if not targets:
        print(f"no SKILL.md found under {root}", file=sys.stderr)
        return 1
    for path in targets:
        original = path.read_text(encoding="utf-8")
        fields, body = parse_frontmatter(original)
        updated = render(fields, body, migrated)
        if updated == original:
            print(f"unchanged  {path}")
            continue
        path.write_text(updated, encoding="utf-8")
        print(f"normalized {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
