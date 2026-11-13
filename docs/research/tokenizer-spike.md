# Tokenizer spike: what the candidates output

Measured on 2026-11-12 with Node 24.22.1 on macOS x64 (Intel). This replaces the "unknown" cells in `docs/research/tokenizer.md` with output from real runs. The full tables are in `tokenizer-spike/results.md`. The script is `tokenizer-spike/spike.mjs`.

## Candidates

| Name in the tables | Engine | Dictionary |
| --- | --- | --- |
| lindera-unidic | `lindera-wasm` 6.2.0 | UniDic 2.1.2 (Lindera build) |
| lindera-sudachidict | `lindera-wasm` 6.2.0 | SudachiDict 20260723 (Lindera build) |
| lindera-ipadic | `lindera-wasm` 6.2.0 | IPADIC 2.7.0 |
| kuromoji | `@patdx/kuromoji` 1.0.4 | IPADIC 2.7.0 |
| sudachi-wasm | `sudachi-wasm333` 1.0.4 | The SudachiDict bundled in the package |

All five install and start under Node 24. `lindera-wasm` starts with `init({ module_or_path: bytes })` and `loadDictionaryFromBytes`, with no browser API.

## Texts

| Text | Source | Size |
| --- | --- | --- |
| subtitles | One anime episode, `.srt`, speaker labels and furigana removed | 343 lines |
| transcript | A podcast transcript (spoken Japanese with fillers) | 694 lines |
| lyrics | One modern pop song with English lines | 66 lines |
| lyrics-classic | Five public-domain children's songs in literary Japanese | 43 lines |
| prose | 走れメロス (Aozora Bunko, 1940) | 75 paragraphs |
| wiki-miku | Japanese Wikipedia, 初音ミク | 497 lines |
| wiki-danmachi | Japanese Wikipedia, ダンジョンに出会いを求めるのは間違っているだろうか | 814 lines |

The texts are not in the branch. `prep.mjs` shows how each one was cleaned.

## Startup, memory and dictionary data

| Candidate | Startup ms | RSS after load MB | Tokens per second | Download | Unpacked | Dictionary license |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 421 | 653 | 56,000 | 46 MB zip | 190 MB | BSD 3-clause (one of UniDic's three licenses) |
| lindera-sudachidict | 1,105 | 1,783 | 56,000 | 132 MB zip | 565 MB | Apache-2.0, with UniDic matrix files |
| lindera-ipadic | 183 | 214 | 70,000 | 11 MB zip | 45 MB | NAIST IPADIC license (permissive, notice required) |
| kuromoji | 383 | 443 | 131,000 | 17 MB gzipped, inside the npm package | 17 MB | NAIST IPADIC license |
| sudachi-wasm | 301 | 454 | 84,000 | 131 MB npm package | 123 MB | Apache-2.0 |

**Lindera keeps the whole dictionary in WASM memory, so RSS is about three times the unpacked size.** UniDic costs about 650 MB of RAM and SudachiDict about 1.8 GB. Memory is one RSS reading per process after a forced GC.

## Identity without a dictionary

| Candidate | Lemma | Reading | Field that groups spellings |
| --- | --- | --- | --- |
| lindera-unidic | 書字形基本形 (base form in the spelling used) | Surface pronunciation and lemma reading | 語彙素 plus 語彙素読み |
| lindera-sudachidict | None as a string. Only a dictionary form ID | Surface reading only | Normalized form |
| lindera-ipadic | Base form in the spelling used | Surface reading | None |
| kuromoji | Base form in the spelling used | Surface reading | None |
| sudachi-wasm | Dictionary form | Surface reading | Normalized form |

UniDic is the only candidate that gives both the lemma as written and a separate grouping key with its reading. UniDic and both Sudachi candidates use almost the same grouping keys (為る, 居る, 凄い), because SudachiDict derives from UniDic.

## Hard cases

| Case | UniDic, SudachiDict, sudachi-wasm | IPADIC, kuromoji |
| --- | --- | --- |
| 封魔鉱 | 封 / 魔 / 鉱 | 封 / 魔 / 鉱 |
| すげぇ, うるせぇ | One token, key 凄い and 煩い | Broken: すげ + ぇな, うる + せ + ぇよ |
| やべぇ | Broken: や + べ + ぇ | Broken |
| あっぶね | あっ + ぶね, key 船 (wrong) | あっ + ぶ + ね (wrong) |
| 言っとく, 買っといて | とく is its own token. Nothing links it to ておく | Same |
| ちゃった, てる, なきゃ | ちゃう, てる, ない | Same |
| やけど, へん | や + けど (key けれど), へん | や + けど, へん |
| ほんま | Key 本真 | ほんま |
| あかん | UniDic and SudachiDict: あ + かん, key 彼 (wrong). sudachi-wasm: あか + ん | あかん (correct) |
| Half-width katakana | Unknown in Lindera. sudachi-wasm normalizes it | Unknown |
| すごい, 凄い, スゴイ | One key, 凄い | Three lemmas. スゴイ is unknown |
| できる and 出来る, わかる and 分かる, 子ども and 子供, きれい and 綺麗 and キレイ | One key each | Separate lemmas |

A one-line Lindera user dictionary (`封魔鉱,名詞,フウマコウ`) makes 封魔鉱 one token with all three Lindera dictionaries. Read `dictionary.metadata` before the builder takes the dictionary, or the call fails with a null pointer.

## What the grouping key merges on real text

The key does more than unify spellings. Each of these changes what "a word" means for coverage:

- Potential verbs fold into the base verb: 勝てる into 勝つ, 言える into 言う, いける into 行く.
- Different kanji with one reading fold together: 斬る into 切る, 撮る into 取る, 歳 into 年.
- Colloquial forms fold in: みんな into 皆, あんまり into 余り, すっごい into 凄い, ねえ into 無い.
- Digits fold into kanji numerals in UniDic: 1 into 一.
- sudachi-wasm also folds English into katakana: future into フューチャー, Media into メディア.
- Kana words get a kanji key that a learner rarely sees: かなり is 可成, ここ is 此処, ありがとう is 有り難う.
- Kana-only text produces wrong keys: のろい (slow) becomes 呪い, and かめよ (turtle) becomes 噛む.

On the transcript, UniDic merges 29 keys that have two or more spellings, and sudachi-wasm merges 31. IPADIC and kuromoji merge none.

## Unknown words

Unknown content tokens as a share of content tokens:

| Text | lindera-unidic | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- | --- |
| subtitles | 1.6% | 16.4% | 4.4% | 3.8% | 1.7% |
| transcript | 0.1% | 0.7% | 4.4% | 4.4% | 1.5% |
| prose | 0.3% | 0.6% | 4.2% | 3.9% | 1.2% |
| wiki-miku | 8.5% | 13.1% | 24.2% | 24.2% | 10.3% |
| wiki-danmachi | 2.9% | 5.0% | 14.1% | 14.1% | 5.2% |

IPADIC does not know ポッドキャスト, コラボ, ダンジョン or クリエイター, and it reports every number as unknown. On colloquial speech it produces junk tokens such as ゃいけないことがすごく. Lindera with SudachiDict reports full-width punctuation as unknown nouns unless the text is NFKC-normalized first. sudachi-wasm marks numbers as unknown by design.

## Segmentation

Share of characters in regions where at least one candidate cuts differently: subtitles 13%, transcript 17%, prose 9%, modern lyrics 27%, classic lyrics 22%, wiki-miku 28%, wiki-danmachi 20%.

- IPADIC and kuromoji agree with each other almost everywhere (0 to 37 regions per text).
- UniDic uses short units: 日本 + 人, 自転 + 車, 冒険 + 者, お + 母 + さん, と + か, って + いう. IPADIC keeps these whole.
- UniDic splits Latin text and digits into single characters: Y / e / s, 2 / 0 / 2 / 5, L / v. The other candidates keep them whole. This dominates the modern lyrics result.
- Lindera with SudachiDict returns the longest unit and cannot split it, because Lindera drops Sudachi's split modes. The full title ダンジョンに出会いを求めるのは間違っているだろうか is one token 39 times, and 初音ミク is one token 254 times.
- IPADIC splits だろう into だろ + う and ましょう into ましょ + う.

## Offsets and normalization

- With no normalization, Lindera and sudachi-wasm offsets slice back to the surface on every line. Lindera reports UTF-8 byte offsets, so the caller converts them to UTF-16.
- kuromoji reports a wrong `word_position` after an unknown token that ends in 、. This happened on 2 lines of the Wikipedia texts.
- Lindera's character filters and token filters have no effect in `lindera-wasm` 6.2.0 when the dictionary comes from bytes. `unicode_normalize`, `mapping` and `japanese_compound_word` changed nothing, and an invalid filter name raised no error.
- sudachi-wasm normalizes inside the engine and keeps original offsets. Where NFKC expands a character it emits zero-width tokens: … becomes three tokens, two of them empty.
- NFKC applied in JavaScript before tokenizing, with a per-cluster index table, maps every token back to the original text for all five candidates. The table needs clusters, because ｶﾞ is two code points.
- Full NFKC is not free. It fixes half-width katakana, and it drops Lindera SudachiDict unknowns in the subtitles from 186 to 6. It also turns … into three periods and raises IPADIC unknowns from 45 to 213.

## Not measured

- A newer UniDic (CWJ 2023 or later) built for Lindera. UniDic 2.1.2 already misses ボカロ, YouTube and Discord.
- Lindera's `japanese_compound_word` filter, because filters are inert in the WASM build.
- Lindera's native Node binding, which may map the dictionary from disk and use less memory.
- Windows and Linux.
- Whether `sudachi-wasm333` loads SudachiDict core or full, and which edition it bundles. Its modes A and C gave the same output on 選挙管理委員会.
- Only one subtitle file and one modern song were run.
