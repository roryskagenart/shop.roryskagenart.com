# Documentation

Four document trees, four different jobs. Start with the row that matches why you are here.

| You want… | Read | Nature |
| :--- | :--- | :--- |
| **The consolidated client brief** — estate, accounts, IP, handover, open items | [`master-brief/overview.md`](master-brief/overview.md) | Authored, client-facing |
| **How to work on this repo** — rules, traps, stack, procedures | [`agentic/README.md`](agentic/README.md) | The engineering KB |
| **What has shipped** — tags, PRs, what each release contained | [`releases/RELEASES.md`](releases/RELEASES.md) | The release ledger |
| **Why we work this way** — dated retrospectives | [`reports/README.md`](reports/README.md) | Dated, **never** a rule source |

---

## The trees

```
docs/
├── agentic/       the engineering knowledge base — rules, traps, stack, protocols, skills
├── master-brief/  the consolidated client brief — also served at /docs/brief
├── releases/      release ledger, forward-looking plans, product ledgers
└── reports/       dated process retrospectives — may be superseded
```

## Where a fact belongs

| Kind of fact | Home |
| :--- | :--- |
| A rule that must never be broken | [`/AGENTS.md`](../AGENTS.md) |
| A measured behaviour of an external system | [`agentic/stack/`](agentic/stack/) |
| A thing that bit us once | [`agentic/traps/register.md`](agentic/traps/register.md) |
| A repeatable procedure | [`agentic/skills/`](agentic/skills/) |
| What happened on a date | [`agentic/sessions/`](agentic/sessions/) |
| A conclusion about the **process** | [`reports/`](reports/README.md) |
| Client-facing project state | [`master-brief/`](master-brief/overview.md) |

**Duplication is the failure mode.** If a fact lives in two places, delete the weaker copy and link to the
stronger one — do not keep both in sync by hand.

## Conventions

- **Every document is reachable by clicking.** A doc nothing links to is a doc nobody finds.
- **Markdown is the source of truth, not TypeScript.** The Master Brief is authored in
  `master-brief/*.md` and *generated* into `lib/docs-brief.generated.ts`; never hand-edit the generated file.
- **Generated documents ship with a `--check` mode** that can actually fail
  (`npm run docs:brief:check`).
- **Links are verified.** `python docs/agentic/scripts/check-links.py` resolves every relative link and
  `#anchor` in the repo, and runs as a gate.
