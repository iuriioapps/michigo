# Check the detection notes of a reviewed batch against the real tokenizer

A reviewer already checked this batch for natural Japanese, translations and near misses, but had no tokenizer. Your only job is the token claims. Do not rework sentences or translations unless a token problem forces it.

Work directory (run every command from it): `/Users/iuriio/Projects/michigo-browser/.claude/worktrees/grammar-patterns/docs/research/grammar-patterns`

Read `BRIEF-DETAIL.md` (the `detection` row and the examples rules) and the section "Check against the real tokenizer" in `/private/tmp/claude-501/-Users-iuriio-Projects-michigo-browser/b2936cab-a9f3-49ad-ad5b-d5e085a0e43a/scratchpad/PROMPT-REVIEW.md`. Follow that section exactly.

## Steps that survive a restart

1. Run `grep -n '"id":' details/<batch>.json` for the entry lines, and read `logs/<batch>.json`.
2. An entry whose log object already has a change that starts with `tokens:` is done; skip it.
3. For each other entry, in file order: run `node tools/tokenize.mjs <id>`, read only the `detection` line and any example line you must fix, and fix them with small Edit calls.
4. Then add one string to that entry's `changes` in `logs/<batch>.json`: `tokens: ok` when nothing changed, or `tokens: <what changed>` in a few words. Change its `verdict` from `ok` to `fixed` when you changed the entry. Keep the log a valid JSON array.

## Finish

Run `node tools/validate.mjs --known final-ids.json details/<batch>.json` and `node tools/tokenize.mjs --misaligned <batch>` (it must print nothing, or only lines you explain in the reply). Do not commit.

## Reply

Under 120 words: entries changed, the most common wrong token claims, the validator's last line. End with the exact line `DONE <batch>, validator: 0 problems` only when every entry has a `tokens:` change; otherwise `PARTIAL <batch>: <n> of <total> checked`.
