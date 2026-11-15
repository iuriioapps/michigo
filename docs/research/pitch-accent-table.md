# Pitch accent: an accent table from the UniDic lexicon

Measured on 2026-11-15 for [How does pitch accent show in the UI and on Anki cards?](https://github.com/iuriioapps/michigo/issues/71). The scripts are in `docs/research/pitch-accent-table/`. They need the UniDic 2025.12 source (`lex.csv`), the tokenizer spike folder with the local corpus, the unpacked JMdict Yomitan zip of 2026-11-13 and the Kanjium accent file.

## Short answer

- The tokenizer gives an accent value only for the reading that it chose. A table taken from the UniDic lexicon gives a value to any Headword by its spelling and reading.
- The table has 369,017 lines for 355,285 pairs of spelling and reading. It is 12.3 MB as text, 2.9 MB with zstd and 3.6 MB as a zip.
- It has a value for 81.3% of the JMdict Headwords with a score above zero and for 52.2% of the "Other readings" Headwords of the corpus.
- Against Kanjium the table is as good as the value of the token: a shared value for 99.7% of the corpus pairs, the first value equal for 96.3%.
- The build takes 7 seconds and gives the same file on every run and platform.

## Why a table

The accent value reaches Michigo with a token. The word popup also shows Headwords that no token stands for: the other readings of a spelling, and the Headword that the learner picks when the tokenizer chose the wrong reading. Without a table those have a pitch value only from a pitch dictionary that the learner imports.

## The table

One line per dictionary-form spelling, kana reading and lexeme:

```text
君	キミ	8820	0
君	キミ	120142	1
君	キミ	78451	1
皆	ミナ	36678	2,0
皆	ミンナ	36678	3,0
食べる	タベル	22630	2
```

- The lexicon has 1,027,505 rows. A conjugated form is a row of its own, and the table keeps one line per lexeme and pair: the row with the lowest cost.
- Inside one pair the lexeme with the lowest cost comes first.
- 374,447 pairs exist, and 92.7% of them have an accent value.
- 4,130 pairs (1.2%) have different values from different lexemes: 君 read キミ is 0 as a pronoun and 1 as a noun, 雪 read ユキ is 2 as a noun and 1 as a name. These pairs are frequent: 19.5% of the corpus tokens with a value sit on such a pair. So the lexeme ID is in the table, and the value of the word's own lexeme comes first.
- For 4 of 11,735 corpus pairs the line of the word's lexeme differs from the value of the token, because the token came from a conjugation row with another value.

### Whether the lexeme column is needed

A lookup by spelling and reading alone, with the values of all lexemes merged in order of cost, gives the token's own main value for 98.8% of the 125,514 corpus tokens with a value. The other 1.2% sit on 100 pairs where another lexeme comes first: くる (own 1, merged 2,1) 460 tokens, あ 289, え 95, ひと 68, 雪 read ユキ 18. With the lexeme column the main value is the token's own for all of them.

## Coverage

| Group                                               | Headwords | With a value in the table |
| --------------------------------------------------- | --------- | ------------------------- |
| Corpus pairs (the reading that the tokenizer chose) | 12,293    | 97.6%                     |
| Other readings of the corpus Spellings in JMdict    | 2,226     | 52.2%                     |
| JMdict Headwords with a score above zero            | 30,732    | 81.3%                     |
| All JMdict Headwords                                | 306,274   | 32.7%                     |

The value of the token alone covers 95.5% of the corpus pairs. JMdict as a whole holds many expressions and rare spellings that are not one UniDic short unit.

## Agreement with Kanjium

Only Headwords that both sides have.

| Group                                         | Compared | Share a value | First value equal |
| --------------------------------------------- | -------- | ------------- | ----------------- |
| Corpus pairs, value of the token              | 8,944    | 99.4%         | 96.3%             |
| Corpus pairs, table with the own lexeme first | 9,078    | 99.7%         | 96.3%             |
| Other readings of the corpus Spellings        | 965      | 98.2%         | 94.1%             |
| JMdict Headwords with a score above zero      | 23,986   | 99.7%         | 96.4%             |
| All JMdict Headwords                          | 71,708   | 99.0%         | 95.9%             |

Other readings with no shared value are mostly rare readings: 一 read ヒ, 二 read フ, 頃 read ゴロ, 本 read モト, 殻 read ガラ.

## Build

`build-accent-table.cjs` reads `lex.csv` and needs no package. A throwaway workflow ran it on GitHub runners ([run](https://github.com/iuriioapps/michigo/actions/runs/43735618845)).

| Platform            | Time | Peak memory | SHA-256 of the table |
| ------------------- | ---- | ----------- | -------------------- |
| macOS arm64, local  | 7 s  | 366 MB      | `f18d11a1…5713fffb`  |
| Linux x64, runner   | 5 s  | 357 MB      | `f18d11a1…5713fffb`  |
| Windows x64, runner | 6 s  | 341 MB      | `f18d11a1…5713fffb`  |

The file is the same on all three: 369,017 lines, 12,291,826 bytes, and 2,910,148 bytes with `zstd -19`. The workflow that builds the Tokenizer dictionary already downloads `lex.csv`, so the table is one more step there.

## Delivery

The table can sit inside the Tokenizer dictionary archive or be a download of its own. The app accepts the Tokenizer dictionary by one hash over the whole archive (384 MB), so a fix to a table inside it costs a full download. As its own file, a fix costs 3.6 MB.

## Not answered

- Kanjium is not ground truth, as the accuracy research already says.
- The accent of a conjugated form and of a compound. The table holds dictionary forms of short units only.
