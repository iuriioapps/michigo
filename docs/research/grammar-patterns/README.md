# Grammar Pattern research

Research data for the v1 Grammar Patterns, decided in [How many Grammar Patterns does v1 ship?](https://github.com/iuriioapps/michigo/issues/120). An AI model wrote every sentence and English line. Nothing is copied from a website, list or book. The implementation turns these entries into pattern files and tests in `packages/grammar`.

## Stages

| Stage | Input | Output | Brief |
| --- | --- | --- | --- |
| Inventory | Public grammar lists (names and levels only) | `inventory/inventory-n5.json` to `inventory-n1.json` | `BRIEF.md` |
| Merge | The five inventories | `final-inventory.json`, `final-ids.json`, `merge-log.md` | `tools/merge.mjs` |
| Detail | `batches/bNN.json` | `details/bNN.json` | `BRIEF.md`, `BRIEF-DETAIL.md` |
| Review | `details/bNN.json` | fixes in place, `logs/bNN.json` | `BRIEF-REVIEW.md` |

The merge keeps constructions and the particles that carry a meaning of their own. It drops bare conjugation forms, plain words and basic particles, as the ticket decided. That leaves 801 candidates: 45 at N5, 134 at N4, 202 at N3, 174 at N2 and 246 at N1. The level only chooses the scope, and the learner never sees it.

## Status

The status of each batch is in the issue that owns it.

| Batches | Level | Issue |
| --- | --- | --- |
| b01 to b02 | N5 | [Review the N5 and N4 Grammar Pattern entries](https://github.com/iuriioapps/michigo/issues/128) |
| b03 to b08 | N4 | [Review the N5 and N4 Grammar Pattern entries](https://github.com/iuriioapps/michigo/issues/128) |
| b09 to b17 | N3 | [Write and review the N3 Grammar Pattern entries](https://github.com/iuriioapps/michigo/issues/129) |
| b18 to b24 | N2 | [Write and review the N2 Grammar Pattern entries](https://github.com/iuriioapps/michigo/issues/130) |
| b25 to b34 | N1 | [Write and review the N1 Grammar Pattern entries](https://github.com/iuriioapps/michigo/issues/131) |

## How to run a batch

Run each step as one agent per batch, from the repo root on this branch.

### Detail

Give the agent `BRIEF.md`, `BRIEF-DETAIL.md`, `batches/bNN.json` and `final-ids.json`. It writes `details/bNN.json` in the input order and runs the validator until it reports 0 problems:

```text
node docs/research/grammar-patterns/tools/validate.mjs --known docs/research/grammar-patterns/final-ids.json docs/research/grammar-patterns/details/bNN.json
```

### Review

A different agent from the one that wrote the batch reviews it with `BRIEF-REVIEW.md`. It fixes entries in place and writes `logs/bNN.json`. One reviewer can take two batches, to save tokens.

### Commit

Commit the details and logs for each batch on this branch, then tick the batch in its issue. The branch is never merged.

## Limits

- No UniDic 2025.12 build was available, so the `detection` hints come from the model's knowledge of UniDic. A lexeme marked `?` is a guess. The implementation checks every matcher against the real tokenizer.
- Some sites could not be read (tanos.co.uk is down, JapaneseTest4You blocks automated access, Marumori needs a login for some pages), so some level votes rest on archived copies or on fewer sources. Each inventory entry's `sources` shows which ones.
- The order inside each inventory (most common first) is the model's estimate, not a count from real text.
