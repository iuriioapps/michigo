# Domain docs

How the engineering skills consume this repo's domain documentation when they explore the codebase.

## Before exploring, read these

- `GLOSSARY.md` at the repo root.
- `docs/adr/`: read the ADRs that touch the area you are about to work in.

If these files do not exist, **proceed silently**. Do not flag their absence, and do not suggest creating them upfront. The `/domain-modeling` skill creates them when a term or a decision is resolved.

## File structure

This repo is single-context: one glossary and one ADR directory cover all apps and packages.

```text
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-example-decision.md
│   └── 0002-another-decision.md
├── apps/
└── packages/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as `GLOSSARY.md` defines it. Do not drift to synonyms that the glossary explicitly avoids.

If the concept you need is not in the glossary yet, that is a signal. Either you are inventing language the project does not use (reconsider), or there is a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, say so explicitly instead of silently overriding it:

> _Contradicts ADR-0007 (example decision), but worth reopening because…_
