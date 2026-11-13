# Tokenizer follow-up: does the UniDic path hold?

Measured on 2026-11-12. This continues `tokenizer-spike.md` with the checks that could have ruled out Lindera with UniDic. Scripts and full tables are in `tokenizer-spike/`.

## Verdict

The path holds: Lindera with UniDic 2.1.2. No check ruled it out, and three checks changed how to use it.

- Lindera's native Node binding gives the same tokens as the WASM build, starts in about 10 ms, and maps the dictionary from disk.
- A newer UniDic is not worth it. It is 1 GB and does not lower the unknown rate.
- Michigo needs its own small passes around the tokenizer. With them, 3 of 300 judged regions are wrong, against 26 for IPADIC.

## Texts

87 subtitle files from six series (39,833 lines), a podcast transcript, one modern song, 走れメロス and two Wikipedia articles. Only the public-domain texts are in the branch.

## Packaging

A throwaway Electron 44 app was packaged with the same fuses as the desktop app (`onlyLoadAppFromAsar`, asar integrity, `npmRebuild: false`). It ran on macOS x64, macOS arm64, Linux x64 and Windows x64. The last three ran in GitHub Actions.

| Check | Result |
| --- | --- |
| `lindera-wasm` loaded from inside `app.asar`, main process | Works on all four |
| `lindera-wasm` in a utility process | Works on all four |
| Native `lindera` binding from `app.asar.unpacked`, no rebuild | Works on all four |
| Dictionary read from `extraResources` | Works on all four |
| One-file CLI bundle (tsdown, WASM inlined as bytes) | 2.43 MB, runs from an empty folder on all four |
| Same tokens on every platform | Yes. The token hash is identical on macOS x64, macOS arm64, Linux x64 and Windows x64. The first Windows run differed only because git checked the text files out with CRLF. |

The native binding is a per-platform optional dependency, so it cannot go into the one-file CLI. The WASM build can.

## Memory and startup

| Build | Startup | Memory |
| --- | --- | --- |
| WASM, UniDic 2.1.2 | 150 to 1,500 ms, by platform | WASM heap 382 MB on every platform. RSS after load 450 to 680 MB, because the file buffers stay for a while |
| Native, UniDic 2.1.2 | 5 to 75 ms | 40 to 55 MB after load. 240 to 360 MB after tokenizing all texts, as pages of the mapped file are touched |

**The WASM heap never shrinks, so only the end of the process returns the memory.** After a worker thread exits, RSS went back to 59 MB on Windows and 78 MB on Linux. On macOS it stayed near 300 MB. A utility process that exits after an import frees everything on every platform.

The native build and the WASM build produced identical tokens on all 39,833 subtitle lines, and identical hashes in CI.

## Newer UniDic

UniDic 2023.02 (written, CWJ) and its spoken variant (CSJ) were built for Lindera with `buildDictionary` from the native package.

| Dictionary | Size on disk | Build | Unknown content tokens, subtitles | Unknown, Wikipedia |
| --- | --- | --- | --- | --- |
| UniDic 2.1.2 (Lindera release) | 190 MB | Prebuilt, 46 MB download | 0.2% to 2.4% | 2.5% and 6.5% |
| UniDic 2023.02 CWJ | 987 MB | 18 s, 14 GB of RAM | 0.3% to 2.7% | 3.1% and 6.8% |
| UniDic 2023.02 CSJ | 1.0 GB | 18 s, 14 GB of RAM | 0.3% to 2.8% | 3.1% and 4.6% |

- The new dictionaries know 禰豆子, 炭治郎, スマホ and ボカロ. They cut other unknown names differently, not better (フリーレン becomes フリー + レン).
- やべぇ is still broken (やべ + ぇ), and あかん is still あ + かん.
- The connection matrix is 800 MB. The 2.1.2 matrix is 71 MB because that version has only 5,981 context IDs on each side, not because Lindera compacts it. See `tokenizer-unidic-versions.md`.
- These dictionaries are too large for the WASM heap. They were run with the native binding only.

## Grouping keys change between UniDic versions

Of 151,419 known content tokens with the same span in 2.1.2 and 2023.02, the grouping key differs for 2.2%, across 766 words.

- Some lexemes were renamed: 僕 became 僕-代名詞, まー became まあ, あー became ああ.
- Some tokens moved to another lexeme with another reading: 母 from ハハ to カア, 人 from ニン to ジン, 月 from ガツ to ツキ.

A stored key from one UniDic version does not survive a dictionary change without a mapping. UniDic counts 人 (ヒト), 人 (ニン) and 人 (ジン) as three lexemes.

## Fixes measured on UniDic 2.1.2

Each fix is a pass before or after the tokenizer. The dictionary is not changed. Details are in `tokenizer-spike/results-fixes.md`.

### A word needs a letter or a digit

UniDic reports `！　`, `➡` and `…｡` as unknown nouns. Requiring one letter or digit in the surface cuts unknown content tokens in the subtitles from between 1.3% and 7.3% to between 0.2% and 2.4%.

### Half-width katakana only

One subtitle set writes ﾁｮｺﾐﾝﾄ and ﾊﾞｶ in half-width katakana. Normalizing only those clusters, with an index table back to the original, drops that set from 2.1% unknown to 0.5%. Full NFKC gives almost the same number and also changes punctuation.

### Join Latin and digit runs

Joining adjacent single Latin letters and digits removes 1,458 tokens in one Wikipedia article and gives 2025, Lv and Yes back as one token each.

### Join katakana runs

UniDic cuts an unknown katakana word into dictionary words. Joining adjacent katakana tokens when one piece is unknown or at most two characters long changes 1,486 of 42,021 lines. It restores フリーレン 324 times, フレイヤ 129 times and フェルン 121 times. The wider rule (join every katakana run) also turns ランク + アップ into one word, so the narrow rule is the safer one.

### User dictionary

A user dictionary of 10,000 entries compiles in 68 ms from a 376 KB CSV. With 348 real unknown words in it, unknown content tokens fall from 2,763 to 1,057. A simple entry carries only a part of speech and a reading, so Michigo must keep the grouping key for such an entry itself.

### Supplementary colloquial entries

Twelve entries (やべぇ, あっぶね, あかん, つえぇ and others) fix the hard cases. Over 42,021 lines they fired 5 times. Two hits were wrong cuts (あっぶね + え, ヤベ + ッ), because the text used a variant that was not in the list. A list of fixed spellings is fragile here. A rule for the long-vowel endings (ねえ, ねぇ, ねー) would cover more.

### Split a line at spaces

Lyrics and subtitles put spaces between phrases. 13,080 lines contain one. Tokenizing each phrase separately changes 1,973 of them.

In 20 sampled changes, separate phrases were better in 9, the whole line was better in 3, and 8 made no difference. Whole lines gave 急 + 豪華 for 急ごうか and 姉 for ねえ. Separate phrases gave だ for the particle で at the end of a phrase.

### N-best for kana-only words

For 20 kana-only test words with one clear meaning, the first path was right 8 times and the right lexeme was within the top three paths 14 times. あめがふる gives 飴, and ふくをきる gives 切る. **Kana-only homophones cannot be resolved reliably, so the kanji in the grouping key must not be shown as fact for a word written in kana.**

## Judged sample

300 regions where UniDic, IPADIC and Sudachi cut a line differently were drawn with a fixed seed and judged by reading each one. The list with every verdict is `tokenizer-spike/judged-sample.md`. A cut is wrong when it puts a word into the list that is not in the text.

| Candidate | Wrong, raw | Wrong after the fixes above |
| --- | --- | --- |
| Lindera + UniDic 2.1.2 | 17, plus 49 split or unknown | 3 |
| Lindera + IPADIC | 27 | 26 |
| `sudachi-wasm333` | 5 | 5 |

Fourteen of the 17 raw UniDic errors are unknown katakana names cut into dictionary words. The narrow katakana join fixes all fourteen. The three that remain are 鬼舞辻 (a name in kanji), くだらなく read as 下る + ない, and 佳き. The verdicts are one reader's judgment and need a spot check.

## Lindera filters

Character filters and token filters work in the native binding. Offsets still point at the original text, and an invalid filter name raises an error. In `lindera-wasm` 6.2.0 with a dictionary loaded from bytes they do nothing and raise no error. No issue about this was found in the Lindera tracker.

### Lindera's compound-word filter

Tested through the native binding with `tokenizer-spike/compound.cjs`. The filter needs the full four-part tag (`名詞,普通名詞,一般,*`). A two-part tag joins nothing except numerals.

- With `名詞,数詞` it joins digits: 2·0·2·5 becomes 2025.
- With the common-noun, place-name and noun-suffix tags it joins 封魔鉱, 冒険者, 日本人, 大学生 and 自転車.
- In the same run it left 魔法 + 使い and フリー + レン apart, and it does not join Latin letters.

It joins every run of the listed tags, so it turns UniDic's short units into long ones across the whole text. It is not available in the WASM build, so the CLI could not use it.

## Still open

- English words in lyrics stay unknown (17.6% of content tokens in the modern song). They need a rule, not a dictionary.
- No candidate links とく to ておく. That stays with Grammar Patterns.
- 鬼舞辻-style kanji names need the Names Word List.
