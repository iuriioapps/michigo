# Review one batch of Grammar Pattern entries

You review one batch of the Michigo Grammar Pattern research data. Another agent wrote it. Quality matters most: act as a strict native-speaker editor and a Japanese grammar teacher together.

Work directory (run every command from it): `/Users/iuriio/Projects/michigo-browser/.claude/worktrees/grammar-patterns/docs/research/grammar-patterns`

## Read first

Read `BRIEF.md`, `BRIEF-DETAIL.md` and `BRIEF-REVIEW.md` in the work directory. Follow `BRIEF-REVIEW.md`. The rules below add to it.

## Work in steps that survive a restart

You may run out of context before you finish. A fresh agent with the same prompt then continues from the files on disk, so keep the disk state correct after every step.

1. Run `grep -n '"id":' details/<batch>.json` to get the start line of each entry.
2. If `logs/<batch>.json` exists, read it. Skip every entry whose id it already has. Continue with the next entry in file order.
3. For each entry: read only that entry with the Read tool (offset and limit from step 1). Do not read the whole file at once.
4. Fix the entry in place with small Edit calls. Keep the file's existing formatting (one example object per line).
5. Then append the entry's log object `{"id", "verdict", "changes"}` to `logs/<batch>.json`. Create the file as a JSON array on the first entry. The file must be a valid JSON array after every write.
6. Go to the next entry.

## Check against the real tokenizer

The detail step had no tokenizer, so its `detection` notes are guesses. You have the real one (UniDic 2025.12 through Lindera). Set this once per shell command:

```text
export LINDERA=/private/tmp/claude-501/-Users-iuriio-Projects-michigo-browser/b2936cab-a9f3-49ad-ad5b-d5e085a0e43a/scratchpad/tok UNIDIC=/private/tmp/claude-501/-Users-iuriio-Projects-michigo-browser/b2936cab-a9f3-49ad-ad5b-d5e085a0e43a/scratchpad/unidic
```

- At the start, run `node tools/tokenize.mjs --misaligned <batch>` once. It lists every example whose `match` starts or ends inside a token. Fix each such `match` so it covers whole tokens (or the sentence, when the pattern itself is not a token sequence there), and keep it unique in the sentence.
- For each entry, run `node tools/tokenize.mjs <id>` before you judge `detection`. Each token prints as surface(語彙素 品詞 活用型 活用形); the tokens of the match are in [ ]. Make `detection` state the real token sequence, lexemes and forms of the pattern, and the real tokens of the near misses that the guards must reject. Remove a `?` from a lexeme that the output confirms; correct a claim that the output contradicts.
- Check a variant that no example shows with `node tools/tokenize.mjs --text <sentence>`.
- The tokenizer is ground truth for token claims only. A wrong token split of a whole sentence (an unknown name, a misread kana word) is not a reason to change a natural sentence, but mention it in `detection` when a matcher would miss the pattern because of it.

## Other entries

To check an id in `subsumes` or `confusables`, grep `final-ids.json`. To see another entry, grep `details/*.json` for its id and read only that entry. Edit only `details/<batch>.json` and `logs/<batch>.json`, unless your batch notes give you another entry.

## Finish

Run the validator and fix every problem:

```text
node tools/validate.mjs --known final-ids.json details/<batch>.json
```

Also run `node -e 'JSON.parse(require("fs").readFileSync("logs/<batch>.json","utf8"))'` and check that the log has one object per entry of the batch.

Do not commit. Do not touch other files.

## Reply

Under 200 words: entries ok, fixed and rejected; each rejected id with its one-line reason; the 3 most common kinds of error; the validator's last line. End with the exact line `DONE <batch>, validator: 0 problems` only when every entry is logged and the validator reports 0 problems. Otherwise end with `PARTIAL <batch>: <n> of <total> logged`.
