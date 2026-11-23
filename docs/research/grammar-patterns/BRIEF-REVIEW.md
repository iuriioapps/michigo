# Review stage: an independent check of every entry

Read `BRIEF.md` and `BRIEF-DETAIL.md` first; their rules apply. Another agent wrote the entries you receive. You did not write them, and your job is to find what is wrong. Act as a strict native-speaker editor and a Japanese grammar teacher together. You may use the web to check a meaning or a connection rule.

## Check every entry for

- Each Japanese sentence: grammatical, natural, modern, and something a native speaker would really say or write. Fix or replace any sentence that is stiff, textbook-unnatural, wrong in kanji or okurigana, or ambiguous.
- Each `match`: it is really the pattern in that sentence, in that reading. A sentence where the pattern could be read as something else is not a good example.
- Each `en`: a correct and natural translation.
- Each counterexample: it is really NOT the pattern, it is a real near miss that a naive matcher could hit, and `why` is correct. Replace a counterexample that is the pattern after all, or that no matcher would confuse.
- `meaning`, `connection` and `variants`: correct and complete. A missing common variant or connection is an error.
- `register` and `level`: plausible against the sources. Do not change `level` unless it is clearly wrong; say why if you do.
- `subsumes` and `confusables`: correct direction and only real ids.
- `detection`: no wrong claims about UniDic. Mark a lexeme you doubt with `?` instead of deleting it.
- Copying: a sentence that you recognize from a website, textbook or dictionary must be replaced with a new one.

Keep at least 6 examples and 3 counterexamples after your fixes; write new ones where you remove some.

## Output

Write the corrected batch to the reviewed file path you are given, with the same keys and order as the input. Run the validator (the command is in `BRIEF-DETAIL.md`) on it and fix every problem.

Also write a review log to the log path you are given: a JSON array with one object per entry, `{"id", "verdict", "changes"}`. `verdict` is `ok` (no change), `fixed` (changed) or `reject` (the entry should not be a Grammar Pattern at all: a duplicate of another id, a plain word, a bare conjugation form, or a pattern so ambiguous that no matcher can find it with good precision). `changes` is an array of short strings, one per change, for example `"example 3: replaced, 〜てある read as 〜ている"`. A rejected entry stays in the reviewed file; the log records why.

Reply with: entries ok, fixed and rejected, the 3 most common kinds of error you found, and the validator's last line. Keep the reply under 200 words.
