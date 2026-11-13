# Can a UniDic newer than 2.1.2 fit Michigo?

Measured on 2026-11-13 with Lindera 6.2.0 under Node 24.22.1 on macOS x64. Scripts and full tables are in `tokenizer-spike/`.

A newer UniDic runs, and it reads the texts better. It cannot be made small. UniDic 2025.12 is the latest release. With the native binding it costs 1 GB on disk and a download of about 385 MB, against 190 MB and 46 MB for 2.1.2. In WASM it needs a 2 GB heap.

## Versions

| Version | Released | Entries | Lexemes | Context IDs (right × left) |
| --- | --- | --- | --- | --- |
| 2.1.2 (Lindera prebuilt) | 2013-03 | not counted | not counted | 5,981 × 5,981 |
| 3.1.1 | 2022-09 | 879,222 | 228,315 | 15,626 × 15,388 |
| 2023.02 | 2023-03 | not counted | not counted | about 20,000 × 20,000 |
| 2025.12 | 2025-12-31 | 1,027,505 | 241,642 | 24,082 × 21,375 |

- 2025.12 is the latest written-language release. NINJAL lists nothing between 2023.02 and 2025.12.
- The release note for 2025.12 says only that entries were added and some parts of speech were revised.
- Every version has the same license choice: GPL v2, LGPL v2.1 or modified BSD.
- Lindera publishes a prebuilt dictionary only for 2.1.2. Michigo must build and host any newer one itself.

## The matrix cannot shrink

The connection matrix holds one two-byte cost for each pair of context IDs. Its size is the whole problem: 71 MB for 2.1.2, 481 MB for 3.1.1 and 1,030 MB for 2025.12.

The earlier follow-up said that Lindera compacts the 2.1.2 matrix. **That was wrong.** 5,981 × 5,981 × 2 bytes is exactly the 71 MB file. Version 2.1.2 has a small matrix because its model has few context IDs.

Two ways to shrink the newer matrix were tested (`unidic-new/compact.mjs` and `unidic-new/quant.mjs`):

| Test | 3.1.1 | 2025.12 |
| --- | --- | --- |
| Drop IDs that no entry uses, merge IDs with identical costs (no token changes) | 15,626 × 15,388, no gain | 20,915 × 17,969: 1,030 MB to 752 MB |
| Merge IDs that are identical after rounding costs to 16 | 15,521 × 15,148 | not run |
| The same with rounding to 512 (mean cost is 5,338) | 15,169 × 14,526 | not run |

NINJAL already removes duplicate IDs before release. The rows that remain are different from each other even under coarse rounding, so no cheap lossy merge exists either. The compacted 2025.12 source was used for every number below.

## Cost

| | UniDic 2.1.2 | UniDic 3.1.1 | UniDic 2025.12 |
| --- | --- | --- | --- |
| Source download from NINJAL | none (prebuilt) | 1.75 GB | 2.98 GB |
| Build time and peak RAM | none | 9 s, 9.1 GB | 113 s and 2.7 GB to compact, then 29 s and 13.3 GB |
| Built size on disk | 190 MB | 716 MB | 1,027 MB |
| Download as zip | 46 MB | 449 MB | 557 MB |
| Download as tar.zst (level 19) | not measured | 422 MB | 384 MB |
| Native: start | 21 ms | 10 ms | 16 ms |
| Native: RSS after load | 43 MB | 43 MB | 43 MB |
| Native: RSS after 37,045 lines | 356 MB | 500 MB | 536 MB |
| WASM heap | 382 MB | 1,369 MB | 1,961 MB |
| WASM peak RSS of the process | 704 MB | 2,179 MB | 3,068 MB |

- The native binding maps the dictionary from disk, so RAM stays moderate for every version.
- WASM copies the dictionary into the heap. 2025.12 loads and runs, with a 2 GB heap.
- In the built 2025.12 dictionary the matrix is 752 MB and the word details are 248 MB. The details hold 29 columns per entry. Fewer columns would cut some of the 248 MB. This was not measured.
- Speed readings varied by a factor of two between runs of the same dictionary, so no speed difference is claimed.

## Output against 2.1.2

The corpus is six subtitle sets (35,616 lines), 走れメロス, five classic songs and two Wikipedia articles. It is not the same subtitle selection as in the earlier spikes, so compare only inside this document. Full tables: `tokenizer-spike/results-unidic-311.md` and `tokenizer-spike/results-unidic-202512.md`.

| Text | Unknown, 2.1.2 | Unknown, 3.1.1 | Unknown, 2025.12 |
| --- | --- | --- | --- |
| subs-1 | 1.2% | 1.6% | 1.6% |
| subs-2 | 0.8% | 1.3% | 1.4% |
| subs-3 | 0.2% | 0.3% | 0.3% |
| subs-4 | 0.5% | 0.7% | 0.6% |
| subs-5 | 0.4% | 0.5% | 0.4% |
| subs-6 | 2.4% | 2.6% | 2.5% |
| wiki-miku | 6.5% | 4.6% | 6.2% |
| wiki-danmachi | 2.5% | 2.6% | 2.8% |

- The unknown rate does not fall. The newer versions report digit runs and some names as one unknown token where 2.1.2 cuts them into known pieces.
- 2025.12 fixes hard cases that 2.1.2 breaks: やべぇ is one token with the lexeme やばい, and フリーレン is one token 384 times.
- あかん is still wrong in 2025.12 (明く + ず). 封魔鉱 is still three kanji. Half-width katakana is still unknown.
- 2025.12 cuts 4.5% to 11.4% of subtitle lines differently from 2.1.2 before Michigo's passes.

## Judged sample

After Michigo's passes, 2.1.2 and 2025.12 still cut 908 of 37,045 lines differently, in 1,024 regions. A seeded sample of 150 of those regions was judged by reading: `tokenizer-spike/judged-sample-202512.md`.

| Version | Wrong, subtitles (100) | Wrong, Wikipedia (35) | Wrong, prose (15) | Wrong, all (150) |
| --- | --- | --- | --- | --- |
| UniDic 2.1.2 | 27 | 9 | 7 | 43 |
| UniDic 2025.12 | 13 | 3 | 2 | 18 |

- 2.1.2 fails mostly on spoken forms: なんで as だ + の, いえ as two fillers, おいおい as 追い追い, たまえ as た + 前.
- 2025.12 fails mostly by joining too much or cutting a compound at the wrong place: 服役者 as 服 + 役者, 悪魔族 as 悪 + 魔族, 美人だし with 出し.
- Scaled to the corpus, the difference is about 170 fewer wrong regions in 37,045 lines. Both versions agree on 97.5% of lines.
- The verdicts are one reader's judgment. This sample is not the 300-region sample of the earlier follow-up, which needed texts and candidates that this run did not have.

## Lexeme keys between versions

Of 136,999 known content tokens with the same span in 2.1.2 and 2025.12, the lexeme key differs for 3.94%, across 728 words. For 3.1.1 it is 1.68%.

- The largest change is 私: 私-代名詞 (ワタクシ) in 2.1.2, 私 (ワタシ) in 2025.12, 1,046 times.
- Loanwords gain a source word: ダンジョン becomes ダンジョン-dungeon.
- Family words move to the spoken reading: 母 from ハハ to カア, 父 from チチ to トウ.

A Word Bank that starts on one version needs a key mapping to move to another. Starting on the version that v1 keeps avoids that migration.

## Build on a runner and tokens on three platforms

Measured later on 2026-11-13 with the throwaway workflow `.github/workflows/unidic-build-spike.yml` on standard GitHub runners.

- The build works on `ubuntu-latest` (16 GB of RAM). The whole job takes 8.5 minutes: 100 s to download from NINJAL, 111 s and 2.3 GB to compact, 13 s and a peak of 13.3 GB to build, and about 4 minutes to pack with `zstd -19`.
- **The margin is thin: 13.3 GB of 15 GB usable.** A larger release of UniDic or a smaller runner breaks the build.
- Disk is no limit. The runner had 87 GB free, and the job used 7 GB, because it extracts only `lex.csv`, `unk.def`, `char.def` and `matrix.bin`.
- The build is reproducible. All nine files have the same SHA-256 on the runner (Linux) and on the local macOS x64 build.
- The archive is 383,781,941 bytes as `tar.zst`.
- The tokens are the same on every platform. The native binding gives the token hash `e3329e359bff0335` on Linux x64, Windows x64, macOS arm64 and macOS x64 for `prose` and `lyrics-classic`.
- RSS after load is 41 to 55 MB, and the load takes 7 to 46 ms.

## Not measured

- An uncompacted 2025.12 build, to prove that compaction changes no token. The compaction keeps every cost by construction.
- 3.1.1 in the judged sample.
- A packaged Electron app with the 2025.12 dictionary. The earlier follow-up proved the binding in a packaged app with 2.1.2.
- The spoken-language variant (CSJ) of 2025.12.
- A dictionary with fewer detail columns.
