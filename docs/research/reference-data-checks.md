# Reference data: checks on matching, upstream releases and hosting

Measured on 2026-11-14 for the points that [Which reference data does Michigo host and download?](https://github.com/iuriioapps/michigo/issues/65), [How do the hosted files stay current?](https://github.com/iuriioapps/michigo/issues/86) and [How does JLPT list support layer over the Word Bank?](https://github.com/iuriioapps/michigo/issues/55) left open. The scripts are in `docs/research/reference-data-checks/`. They need the tokenizer spike folder with UniDic 2025.12 and the local corpus (239,628 occurrences, 11,275 distinct words).

## Short answer

- A lookup from the word's side beats a run of the list rows through the tokenizer. It gives a Jiten rank to 98.8% of occurrences against 90.0%, and it needs no tokenizer at install.
- The tokenizer reports a bare katakana word such as ピンチ as unknown. The same word is known with any context, so a list row on its own is not a safe tokenizer input.
- An empty upstream release is a valid zip. Only an entry-count check catches it. It happened 4 times in 1,140 releases, twice in the last three days.
- The entry count of JMdict never fell between two releases that were checked. A 5% threshold is safe.
- The EDRDG licence names "at least once a month", and `raw.githubusercontent.com` caches a file for 5 minutes.

## How a list row finds its word

### Rows through the tokenizer

Each row goes to the tokenizer alone. Step 1 accepts one token whose reading equals the row reading. Step 2 tokenizes the reading and accepts it when the lexeme is written as the row spelling (皆 for みんな). Step 3 covers rows with no kanji.

| List | Rows | Step 1 | Step 2 | Step 3 | Reading differs | Several tokens | Unknown | Matched |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JLPT N5 | 684 | 458 | 18 | 119 | 10 | 79 | 0 | 87.0% |
| JLPT N4 | 640 | 463 | 7 | 99 | 7 | 64 | 0 | 88.9% |
| JLPT N3 | 1,730 | 1,400 | 31 | 162 | 55 | 82 | 0 | 92.1% |
| JLPT N2 | 1,812 | 1,377 | 20 | 245 | 13 | 157 | 0 | 90.6% |
| JLPT N1 | 3,427 | 2,633 | 98 | 250 | 228 | 215 | 3 | 87.0% |
| JLPT, all | 8,293 | 6,331 | 174 | 875 | 313 | 597 | 3 | 89.0% |
| Jiten, rank 1 to 5,000 | 4,937 | 2,749 | 40 | 934 | 52 | 1,161 | 1 | 75.4% |
| Jiten, all | 464,144 | 95,556 | 1,300 | 54,839 | 24,743 | 274,449 | 13,257 | 32.7% |

The rule decided in the JLPT ticket is step 1 plus step 3: 86.9% of the JLPT rows.

- Several tokens: お金, お母さん, 映画館 and 一日 are two or three short units. In N5 that is 79 of 684 rows.
- Reading differs: the tokenizer picks one reading for a word alone. 辛い gives カライ, 明日 gives アス, 開く gives ヒラク, so the rows つらい, あした and あく fail step 1.
- 322 lexemes are reached by rows of different levels (会う N5 and 遭う N2). The easiest-level rule decides these.
- Jiten rows are JMdict entries. More than half are expressions such as だから and んです, which are several short units.

### A bare katakana word is unknown

`ピンチ`, `プロジェクト` and `ストーム` alone come back as one unknown token. `ピンチ！`, `ピンチだ` and `「ピンチ」` come back as the known noun. In the corpus, split at spaces as the pipeline does, this affects one occurrence. It makes list rows unsafe as tokenizer input, because a row is always a bare word.

### Lookup from the word

No tokenizer runs on the list. A word looks for its row in four steps, and the first hit wins.

| Step | JLPT: words | JLPT: occurrences | Jiten: words | Jiten: occurrences |
| --- | --- | --- | --- | --- |
| 1: a Spelling and its reading equal the row | 33.2% | 29.9% | 74.0% | 43.5% |
| 2: the lexeme form and lexeme reading equal the row | 35.7% | 35.8% | 79.3% | 50.0% |
| 3: a kana Spelling equals the row reading, and the row spelling is the lexeme form | 35.7% | 35.9% | 79.4% | 50.0% |
| 4: a kana Spelling equals a row with no kanji | 39.0% | 45.1% | 95.7% | 98.8% |

The percentages are cumulative. For comparison, rows through the tokenizer reach 37.6% of words for JLPT and 91.8% of words (90.0% of occurrences) for Jiten.

- The JLPT ceiling is low because the list has no particles and no auxiliaries: だ, の, は, に and て lead the words without a level.
- The words without a Jiten rank are names and sounds (フリーレン, 前原, うう), plus kanji whose reading in the text differs from the Jiten row (母 inside お母さん).
- Step 3 adds almost nothing on this corpus, because step 2 already covers みんな through its lexeme 皆.

## Upstream releases of jmdict-yomitan

Sizes of `JMdict_english.zip`, `JMnedict.zip` and `KANJIDIC_english.zip` in all 1,140 releases from 2023-09-25 to 2026-11-14, from the GitHub API.

| Date       | JMdict_english.zip | Content                                               |
| ---------- | ------------------ | ----------------------------------------------------- |
| 2025-05-28 | 2,308 bytes        | empty                                                 |
| 2026-09-02 | 2,303 bytes        | empty                                                 |
| 2026-11-12 | 2,303 bytes        | empty                                                 |
| 2026-11-14 | 2,303 bytes        | `index.json` and `tag_bank_1.json` only, no term bank |
| 2026-11-13 | 15,628,711 bytes   | 527,778 rows, 231,612 entries                         |

- An empty release is a valid zip with a valid `index.json`. A parse check passes it.
- The next release after each empty one was complete.
- The largest drop in size between two complete releases is 3.8%, on 2024-07-24. It hit all three files and was a change of compression: the JMdict entry count went from 214,841 to 214,848.
- From 2024-07-24 to 2026-11-13 JMdict grew by 16,764 entries, about 600 per month.

## Contents and sizes of the files

| File | Zip | Unpacked | Largest file | Files |
| --- | --- | --- | --- | --- |
| JMdict English | 15.6 MB | 171.4 MB | 4.3 MB | `index.json`, 1 `tag_bank`, 53 `term_bank` |
| JMnedict | 11.4 MB | 45.4 MB | 1.0 MB | `index.json`, 1 `tag_bank`, 67 `term_bank` |
| KANJIDIC English | 0.7 MB | 3.1 MB | 3.0 MB | `index.json`, 1 `tag_bank`, 2 `kanji_bank` |
| Jiten global list | 8.0 MB | 56.4 MB | 56.4 MB | `index.json`, 1 `term_meta_bank` |

- The highest ratio of unpacked to packed size is 11.
- JMdict glosses are structured content with the tags `ul`, `li`, `span`, `table`, `tr`, `th`, `td` and `a`, beside plain strings.
- The Jiten zip gives the rank of a kana word to its kanji variants too: の, 乃 and 之 all have rank 1.
- The Jiten CSV has 464,144 rows and 456,571 distinct words. 6,631 words have rows for several readings (辛い: つらい 2,013, づらい 19,378, からい 26,512). The `Form` column is the reading.
- `GET /api/frequency-list/index` returns the `revision` of the global list (`Jiten 26-11-13`) in 370 bytes, outside the download rate limit.

## Hosting facts

- EDRDG licence: "there must be a procedure for regular updating of the data from the most recent versions available. For example, WWW-based dictionary servers should update their dictionary versions at least once a month." Source: https://www.edrdg.org/edrdg/licence.html
- A file on `raw.githubusercontent.com` answers with `cache-control: max-age=300` and an `etag`. GitHub documents no rate limit for it, so none could be checked.

## Not answered

- Whether Jiten accepts a hosted copy of all 13 lists. Only the maintainer can say. It matters only if Michigo adds a mirror.
- The rate limit of `raw.githubusercontent.com`. It is not documented.
