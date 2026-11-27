# Write one batch of Grammar Pattern entries

You write the full entries for one batch of the Michigo Grammar Pattern research data. An independent reviewer checks your work later, but quality matters most: write as a careful native speaker and a Japanese grammar teacher.

Work directory (run every command from it): `/Users/iuriio/Projects/michigo-browser/.claude/worktrees/grammar-patterns/docs/research/grammar-patterns`

## Read first

- `BRIEF.md` and `BRIEF-DETAIL.md`: every rule there applies.
- `batches/<batch>.json`: your input, in order.
- `prototype-ids.tsv`: ids that must not be renamed.
- The first entry of `details/b01.json` (about 60 lines, read with offset and limit): a reviewed model of the format and the quality bar.
- Do not read `final-ids.json` whole. Check an id with `grep -c '"<id>"' final-ids.json`. To see an entry of another batch, grep `details/*.json` for its id and read only that entry.

## Work in steps that survive a restart

You may run out of context before you finish. A fresh agent with the same prompt then continues from the file on disk, so keep it correct after every step.

1. If `details/<batch>.json` exists, run `grep -n '"id":' details/<batch>.json` to see which ids it has. Write only the missing ids, in input order.
2. Write entries in chunks of about 4. Create the file with the Write tool for the first chunk. Append each next chunk with one Edit call that replaces the final `]` of the file. The file must be a valid JSON array after every write.
3. Keep the format of `details/b01.json`: pretty-printed with 2 spaces, one example or counterexample object per line.
4. Do not reread what you wrote, except the lines an error points to.

## Use the real tokenizer

You have the real tokenizer (UniDic 2025.12 through Lindera). Write `detection` from its output, not from memory. Set this in each shell command:

```text
export LINDERA=/private/tmp/claude-501/-Users-iuriio-Projects-michigo-browser/b2936cab-a9f3-49ad-ad5b-d5e085a0e43a/scratchpad/tok UNIDIC=/private/tmp/claude-501/-Users-iuriio-Projects-michigo-browser/b2936cab-a9f3-49ad-ad5b-d5e085a0e43a/scratchpad/unidic
```

- After you write a chunk, run `node tools/tokenize.mjs <id> <id>...` for its ids. Each token prints as surface(語彙素 品詞 活用型 活用形); the tokens of the match are in [ ]. A line that starts with `!` has a `match` that begins or ends inside a token: fix the `match` to cover whole tokens.
- Then make each `detection` state the real token sequence, the lexemes and forms of the fixed words, and the real tokens of the near misses the guards must reject. Mark a lexeme with `?` only when you could not check it.
- Check other forms with `node tools/tokenize.mjs --text <sentence>...`.
- Facts already found: でしょう, ましょう and a plain volitional (行こう) are one token in 意志推量形; てる is its own 助動詞 token (lexeme てる), not て + いる; ちゃう is its own lexeme; みたい after a noun is 形状詞-助動詞語幹; the negative ない after が is the adjective 無い; てない is てる (未然形) + ない; ちゃ and じゃ are 接続助詞 tokens with lexeme て; なきゃ is one ない token (仮定形-融合); いけない is 行く (下一段, 未然形) + ない; sentence-initial だから, だけど and ですが are だ/です + から/けど/が, not 接続詞; ので is の + で; けれども is けれど + も; いつも is いつ + も and 何か is 何 + か; 帰る has the lexeme 返る; ちゃう, じゃう, ちまう, てく, てた and とく are each their own 助動詞 lexeme (not 仕舞う, 行く, 居る, 置く); のに is の + に; でも is で + も; hearsay そう is 名詞 そう-伝聞; ばかり has the lexeme ばかり; いただけ and もらえ keep the lexemes 頂く and 貰う (only the 下一段 type marks the potential). Lexemes are often not what you expect, so check each one.

## Mistakes the reviewers found in earlier batches

Avoid these. The reviewers fixed them often in N5 and N4:

- Missing common variants: casual contractions (てる, ちゃう, なきゃ, とく, ましょ), the negative and the polite forms, and a common form with a particle dropped (なくていい). Every variant gets an example.
- An example that is not the pattern in that reading (どこか "somehow" given as "somewhere"). Read each sentence once for any other reading.
- Stiff or textbook Japanese, a wrong kanji or okurigana (始めは for 初めは), or a sentence about the speaker that a native would not say.
- English that adds what the Japanese does not say ("said", "a bit"), or gets a fact wrong.
- A counterexample that shares no surface or tokens with the pattern, so no matcher would confuse it, or a garbled `why`.
- A detection guard so strict that it rejects real forms of the pattern (a guard against ください + ます also rejected くださいませんか).
- A variant that is another id's form (せいか in `sei-de` is `sei-ka`; っていうか in `to-iu-yori` is `to-iu-ka`; bare とは is `to-wa`), so one sentence counts for two ids. Grep `final-ids.json` before you list a variant.
- An id in `confusables` or a `why` that is wrong or unrelated (`shidai` where `shidai-de` was meant). Grep `final-ids.json` for every id you cite, and cite only ids a learner could really mix up.
- A variant that is a different lexeme (に合った is 合う, not the pattern's word).
- Token claims from memory instead of the tokenizer: compounds that are really several tokens, wrong lexemes, `?` left on lexemes that one command would confirm.

## Finish

Run the validator and fix every problem:

```text
node tools/validate.mjs --known final-ids.json details/<batch>.json
```

Do not commit. Do not touch other files.

## Reply

Under 150 words: the number of entries; each `meaning` or `variants` you changed from the inventory, in a few words; any entry you think should be rejected in review, with the reason; the validator's last line. End with the exact line `DONE <batch>, validator: 0 problems` only when every input id is written and the validator reports 0 problems. Otherwise end with `PARTIAL <batch>: <n> of <total> written`.
