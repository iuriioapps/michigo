# Tokenizer and lemmatizer options

Research for issue #33. Facts checked on 2026-11-11 against npm registry metadata, GitHub repository metadata and the projects' own READMEs and source. No candidate was run locally, so every claim about output on the hard cases comes from documentation or source code and is marked as such.

## Question

Which tokenizer and lemmatizer options can run inside Electron main (Node 24) and the bundled CLI, and how do they compare on lemma and reading quality, dictionary size, startup time, license, maintenance and packaging?

## Constraints from Michigo

The engine and the dictionary are separate choices. Most engines below can load more than one dictionary, and the dictionary decides most of the lemma quality.

The packaging rules in `CLAUDE.md` decide what "fits":

- The CLI ships as one bundled file with no install-time dependencies. A native `.node` addon cannot be inlined into that file. WASM bytes can be.
- The desktop app keeps `dependencies` empty. A native module is the stated exception and would go in `dependencies`.
- `apps/desktop/electron-builder.yml` sets `onlyLoadAppFromAsar` and `npmRebuild: false`. Native code cannot read files inside `app.asar`; Electron's docs say a raw descriptor passed to native code "fails with `EBADF`". A native addon and any dictionary it opens by path must be unpacked (`asarUnpack` or `extraResources`).
- Every option needs a dictionary of 10 MB to 140 MB. None of them fits in the JS bundle comfortably, so the dictionary is a shipped or downloaded data file in every case.
- Michigo is MIT licensed (`LICENSE`). A GPL dependency would change the license of the shipped app.

## Options at a glance

| Option | Engine packaging | Dictionaries | Latest release | License (engine) |
| --- | --- | --- | --- | --- |
| kuromoji.js | Pure JS | IPADIC 2.7.0 (2007), bundled | 0.1.2, 2018-03-19 | Apache-2.0 |
| @patdx/kuromoji (fork) | Pure JS, ESM, TS types | IPADIC 2.7.0, bundled | 1.0.4, 2024-11-21 | Apache-2.0 |
| Lindera, Node binding (`lindera`) | Native, napi-rs prebuilt per platform | IPADIC, IPADIC-NEologd, UniDic, SudachiDict | 6.2.0, 2026-09-26 | MIT |
| Lindera, WASM (`lindera-wasm`) | WASM, wasm-pack `web` target | Same as above, loaded from bytes | 6.2.0, 2026-09-26 | MIT |
| Sudachi via `sudachi-wasm333` | WASM, community fork of sudachi.rs | SudachiDict small bundled, others by path | 1.0.4, 2026-04-14 | Apache-2.0 |
| Kagome via `kagome-wasm` | WASM, TypeScript port | IPADIC 2.7.0, UniDic 2.1.2 | 0.0.5, 2026-07-13 | MIT |
| Yomitan-style deinflection | Pure JS rules plus a word list | Needs a lexicon (JMdict or similar) | Yomitan 26.11.2.0, 2026-11-03 | GPL-3.0 |

Options that do not fit are listed under [Ruled out](#ruled-out).

## kuromoji.js and its forks

### Facts

- Pure JS port of the Java Kuromoji. Ships `mecab-ipadic-2.7.0-20070801` (stated in `NOTICE.md`).
- Dictionary is 12 gzipped `.dat.gz` files, about 17.8 MB total (sum of `dict/` sizes in the repo). The npm package unpacks to 41 MB.
- Token fields: `surface_form`, `pos` and details, `basic_form`, `reading`, `pronunciation`.
- Build is async (`kuromoji.builder({ dicPath }).build(cb)`); the whole dictionary is decompressed into memory at startup.
- Upstream `takuyaa/kuromoji.js` last release 2018, last push 2023-11. The `@patdx/kuromoji` fork (4 stars) adds ESM, Promises and TypeScript and drops the runtime dependencies; last release 2024-11.

### What the dictionary implies for lemmas

IPADIC's `basic_form` is the base form of the surface spelling, so すごい and 凄い stay two different lemmas. IPADIC has not changed since 2007, so later vocabulary and colloquial spellings are unknown words. No input normalization is built in. The README documents no user dictionary support.

## Lindera

### Facts

- Rust MeCab-style engine, very active (last push 2026-11-11, 707 stars). One release line covers Rust, Node, WASM, Python, Ruby and PHP.
- Node binding `lindera` is napi-rs: the npm package is 65 KB and pulls a prebuilt `optionalDependency` per platform (darwin x64/arm64, linux x64/arm64 gnu, win32 x64/arm64). Its README lists Node `^20.17.0 || ^22.13.0 || >= 23.5.0`.
- `lindera-wasm` is 1.9 MB unpacked with no dictionary inside. The README shows `loadDictionaryFromBytes(...)` taking the dictionary's files as bytes; the OPFS download helper is browser-only.
- Prebuilt dictionaries on the v6.2.0 release (zip size): IPADIC 10.5 MB, UniDic 46.4 MB, SudachiDict 131.5 MB, IPADIC-NEologd 140.7 MB.
- Character filters include `unicode_normalize` (NFKC) and Japanese iteration mark handling. Token filters include base form, reading form and `japanese_compound_word`. User dictionaries are supported (simple 3-column CSV or full format).

### Lindera with UniDic

Lindera's UniDic is `unidic-mecab-2.1.2` (NOTICE.txt), BSD 3-clause. Fields include 語彙素読み (lemma reading), 語彙素 (lexeme), 書字形基本形 (orthographic base form) and 発音形 (pronunciation). NINJAL's glossary defines 語彙素 as the level that groups all forms of one word regardless of spelling, with the example 語彙素 (オオキイ, 大きい) covering both 大きい and おおきい. So the 語彙素 field is the one that would unify すごい and 凄い. The same glossary says the colloquial おっきい is its own 語形 (オッキイ), because its pronunciation differs; whether it shares the 語彙素 is implied but not stated.

UniDic 2.1.2 is old. NINJAL's current releases are ver.2025.12 (all variants) and CWJ v2023.3. The newer CWJ builds are much larger: Vibrato's README cites UniDic-CWJ 3.1.1 at 459 MiB, and `unidic-py` (UniDic 3.1.0) says it takes 770 MB on disk.

### Lindera with SudachiDict

Lindera ships SudachiDict 20260723 (small + core + notcore) compiled to its own format. The schema includes 読み (reading), 正規化表記 (normalized form) and 辞書形ID (dictionary form as a word ID, not a string). The README states it reproduces SudachiDict's vocabulary and lattice "but not the Sudachi engine plugins (katakana/numeric joining, input normalization, A/B/C split modes)".

## Sudachi

### Facts about the official project

- `WorksApplications/sudachi.rs` is Apache-2.0 and active, but it has no official JS or WASM binding. Its v0.7.0 (2026-09-18) changed the binary dictionary format ("You CANNOT use old (V0) format dictionary binary"), and the README warns "Release v0.7.* is unstable".
- SudachiDict is Apache-2.0 and includes UniDic and part of NEologd. Release 20261015 zips: small 42.5 MB, core 76.9 MB, full 137.4 MB. Its README says the binary format "is changed to V1 from v202610" and V0 builds will stop in the future.
- Sudachi's documented normalization (Java README): okurigana 打込む to 打ち込む, script かつ丼 to カツ丼, variants 附属 to 付属, misspellings シュミレーション to シミュレーション, contracted forms ちゃあ to ては.
- Default plugins (`resources/sudachi.json`): DefaultInputTextPlugin (lowercase then NFKC), ProlongedSoundMarkPlugin (collapses ー, -, 〜 runs), IgnoreYomiganaPlugin, JoinNumericPlugin, JoinKatakanaOovPlugin.
- Split modes: A 選挙/管理/委員/会, B 選挙/管理/委員会, C 選挙管理委員会.

### The only Node-capable build

`sudachi-wasm333` is a single-maintainer fork (5 stars) that vendors sudachi.rs and builds it with wasm-pack. The npm package unpacks to 125 MB because it bundles the small dictionary; the README says the gzipped script alone is over 50 MB. Other dictionaries load by path through `initialize_node(fs.readFile)`. Its last release (2026-04) predates sudachi.rs v0.7.0, so it reads V0 dictionaries only. From that and the SudachiDict note above, it most likely cannot load SudachiDict 20261015 or later (inferred, not tested).

## Kagome via kagome-wasm

Kagome (Go, MIT, active, 987 stars) embeds IPADIC 2.7.0 and UniDic 2.1.2 and has a browser WASM demo. The npm package `kagome-wasm` calls itself a TypeScript port of Kagome; it lists no repository, unpacks to 61.7 MB and is at version 0.0.5. Its provenance could not be traced to the Kagome authors.

## Yomitan-style deinflection

Yomitan is not a morphological analyzer. It deinflects the text at a position with suffix rules and checks each candidate against a dictionary, longest match first. Its rules in `ext/js/language/ja/japanese-transforms.js` explicitly cover several hard cases:

- Colloquial adjective sound changes, documented as "すごい → すげぇ", "やばい → やべぇ".
- The とく contraction: `suffixInflection('とく', 'て', ...)` next to the ておく rule.
- Kansai-ben: `suffixInflection('へん', 'ない', ...)`, せえへん, へんかった, and -て, -た, -たら, -たり forms.

Its preprocessors (`japanese-text-preprocessors.js`) convert half-width to full-width (ﾖﾐﾁｬﾝ to ヨミチャン) and collapse emphatic sequences (すっっごーーい to すごい).

The code is GPL-3.0. Copying it into MIT Michigo is not possible without relicensing. Reimplementing the idea from scratch is possible. It needs a lexicon with kanji and kana headwords, and it does not give a full sentence segmentation, so it would sit on top of a tokenizer rather than replace one.

## Hard cases

None of these were run. The table records what the documentation and source establish, and "unknown" where they say nothing.

| Case | kuromoji (IPADIC) | Lindera + UniDic | Sudachi engine | Lindera + SudachiDict | Yomitan rules |
| --- | --- | --- | --- | --- | --- |
| 封魔鉱 (rare compound) | Unknown; no user dict documented | Unknown; user dict or `japanese_compound_word` can join | Unknown; user dict supported, katakana-only OOV join | Unknown; user dict supported | Depends on lexicon |
| すげぇ, あっぶね | Unknown, likely OOV | Unknown | Prolonged-sound collapse documented; ぇ forms unknown | Unknown; no input plugins | すげぇ rule documented; あっぶね unknown |
| とく for ておく | Unknown | Unknown | Contracted-form normalization documented (ちゃあ to ては); とく unknown | Unknown | Rule documented |
| やけど, へん, ほんま | Unknown | Unknown | Unknown | Unknown | へん rules documented; やけど, ほんま depend on lexicon |
| Half-width katakana | No normalization | NFKC char filter available | NFKC built in | NFKC char filter available (Lindera) | Preprocessor documented |
| すごい and 凄い | Two lemmas (basic_form follows surface) | 語彙素 field groups spellings | Normalized form is designed for this; this pair unknown | Normalized form column present | Depends on lexicon |

Two facts hold across every option. Rare kanji compounds like 封魔鉱 are a dictionary gap, and the documented fixes are user dictionaries or a compound-joining filter, not the engine. NFKC normalization changes string length, so any option that normalizes must map token offsets back to the original text.

## Startup time

No project publishes startup numbers for Node or WASM. Each one loads the whole dictionary into memory, so dictionary size is the best available proxy: IPADIC around 10 to 18 MB, UniDic 2.1.2 around 46 MB, SudachiDict 42 to 137 MB. Measure before deciding.

## Packaging in Electron and the CLI

| Option | Desktop main | Bundled CLI |
| --- | --- | --- |
| kuromoji / fork | Bundles as JS; dictionary files unpacked or in `extraResources` | Bundles; dictionary shipped beside it or downloaded |
| Lindera native | Goes in `dependencies`; `.node` and dictionary must be unpacked; Node-API needs no Electron rebuild | Breaks the "no install-time dependencies" rule (per-platform optional deps) |
| Lindera WASM | Bundles; dictionary read with `fs` and passed as bytes | Bundles; same dictionary story |
| sudachi-wasm333 | 125 MB package; small dictionary inside the WASM | Same; very large single file |
| kagome-wasm | Bundles; provenance unclear | Same |

## Ruled out

- MeCab itself (`taku910/mecab`, no releases) and wrappers like `@enjoyjs/node-mecab` (last release 2022) shell out to or link a system MeCab, which cannot be bundled.
- `mecab-wasm` (last release 2021-10, license NOASSERTION).
- The original `sudachi` npm package (hata6502/sudachi-wasm, last release 2021-08), replaced by the fork above.
- Vibrato (Apache-2.0 or MIT, active) has a WASM demo but no published JS or Node binding; only a Python wrapper.
- SudachiPy and fugashi are Python only.

## Not verified

- Output on every hard case. Running the packages was blocked in this session. A fixture test with the six cases against each candidate is the next step.
- Startup time and memory for every option.
- Whether `lindera-wasm`'s `web` target initializes under Node 24 with bytes passed in, and whether Lindera's `unicode_normalize` filter keeps original offsets.
- Whether `sudachi-wasm333` exposes the normalized form and fails on V1 dictionaries.
- Whether newer UniDic CWJ builds can be compiled for Lindera at a usable size.

## Recommendation

This is a recommendation, not a decision. The evidence leaves two serious families: Lindera (the only active engine with first-party Node and WASM builds, MIT, and a choice of UniDic or SudachiDict) and the Sudachi engine (best documented normalization, but its only JS build is a lagging single-maintainer fork). kuromoji is viable but frozen on a 2007 dictionary that cannot unify すごい and 凄い. Yomitan's rules cover the colloquial and Kansai cases best on paper but are GPL and are a lookup layer, not a tokenizer.

A cheap next step is a spike that runs `lindera-wasm` with UniDic and with SudachiDict, plus `@patdx/kuromoji` as a baseline, over the six hard cases, and records lemma, reading and load time.

## Sources

- npm registry metadata for each package: `https://registry.npmjs.org/<name>` (versions, dates, unpacked sizes, READMEs).
- GitHub repository metadata via the GitHub API (stars, last push, license, latest release).
- kuromoji.js: <https://github.com/takuyaa/kuromoji.js> (`NOTICE.md`, `dict/`); <https://github.com/patdx/kuromoji.js>
- Lindera: <https://github.com/lindera/lindera>, `lindera-unidic/README.md`, `lindera-unidic/NOTICE.txt`, `lindera-sudachidict/README.md`, release v6.2.0 assets.
- sudachi.rs: <https://github.com/WorksApplications/sudachi.rs>, `CHANGELOG.md`, `resources/sudachi.json`
- Sudachi (Java) README, normalization and split modes: <https://github.com/WorksApplications/Sudachi>
- SudachiDict: <https://github.com/WorksApplications/SudachiDict>, release v20261015 assets.
- sudachi-wasm333: <https://github.com/Benjas333/sudachi-wasm333>
- Kagome: <https://github.com/ikawaha/kagome>
- Vibrato: <https://github.com/daac-tools/vibrato>
- UniDic: <https://clrd.ninjal.ac.jp/unidic/>, glossary <https://clrd.ninjal.ac.jp/unidic/glossary.html>; unidic-py <https://github.com/polm/unidic-py>
- Yomitan: <https://github.com/yomidevs/yomitan>, `ext/js/language/ja/japanese-transforms.js`, `japanese-text-preprocessors.js`
- Electron ASAR limitations: <https://www.electronjs.org/docs/latest/tutorial/asar-archives>
