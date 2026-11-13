# How often is the UniDic 2025.12 accent field correct?

Measured on 2026-11-13 for [How often is the UniDic 2025.12 accent field correct?](https://github.com/iuriioapps/michigo/issues/73). Background: [Which pitch accent data can Michigo use?](https://github.com/iuriioapps/michigo/issues/70).

## Summary

Where UniDic 2025.12 and the Kanjium accent file both have a value, they share at least one value for **99.5% of Spelling and reading pairs and 97.3% of tokens**. The first value is equal for 96.4% of pairs and 93.8% of tokens.

- Against a Wadoku-derived file the figures are lower: 97.7% of pairs and 90.5% of tokens share a value. Most of that gap is errors in that file, not in UniDic (see "Second opinion").
- Both references contradict UniDic for 15 pairs (90 tokens).
- 47.1% of tokens have no UniDic accent value. Almost all of them are particles, auxiliaries, suffixes and prefixes. Among the rest, ない is the one frequent gap.
- A reference entry exists for 73.9% of pairs (Kanjium), 70.1% (Wadoku file) and 84.6% (either).

## What was measured

### Corpus and tokenizer

- Ten local texts: six subtitle files, one prose text, one lyric, two wiki articles. About 1.37 MB. The texts are not in the repo.
- UniDic 2025.12 through the native Lindera binding, mode `normal`, one line at a time.
- 251,456 tokens after punctuation (補助記号) and whitespace (空白) are left out.
- 5,179 of them (2.1%) have no Spelling or no kana reading (unknown words) and are left out.
- That leaves 246,277 tokens in 12,395 pairs of Spelling plus kana reading.

### Unit

The unit is a pair of Spelling (`orthographic_base_form`) and kana reading (`kana_base`, converted to hiragana). This is the key of a Yomitan pitch row, and the accent value belongs to the Spelling. A "pair" below is one such key. A "token" figure weights each pair by how often it occurs.

### References

| Reference | Source | Entries read | Notes |
| --- | --- | --- | --- |
| Kanjium | `accents.txt` from `mifunetoshiro/kanjium` | 124,134 keys | Origin undisclosed. A kana term has an empty reading field. |
| Wadoku-derived file | `wadoku_pitchdb.csv` from `IllDepence/anki_add_pitch` | 193,519 keys | A third-party conversion of Wadoku, not the Wadoku XML itself. Its age is not known. |

Both downloads were reachable. Both were only parsed as text.

### Agreement measures

- "Any overlap": at least one UniDic value is among the reference values.
- "First equal": the first UniDic value equals the first reference value.
- Both are counted only for pairs where UniDic and the reference each have a value.

## Tokens with no UniDic accent value

115,938 of 246,277 tokens (47.1%) and 566 of 12,395 pairs (4.6%) have `*` in the accent field.

| Part of speech | Pairs | Tokens | Pairs with no value | Tokens with no value | Share of tokens |
| --- | --- | --- | --- | --- | --- |
| Particle (助詞) | 106 | 76,401 | 106 | 76,401 | 100.0% |
| Noun (名詞) | 8,232 | 67,541 | 55 | 930 | 1.4% |
| Verb (動詞) | 2,173 | 31,656 | 3 | 3 | 0.0% |
| Auxiliary (助動詞) | 40 | 26,702 | 39 | 26,694 | 100.0% |
| Pronoun (代名詞) | 78 | 7,618 | 0 | 0 | 0.0% |
| I-adjective (形容詞) | 277 | 7,163 | 2 | 3,472 | 48.5% |
| Adverb (副詞) | 447 | 6,846 | 16 | 32 | 0.5% |
| Suffix (接尾辞) | 251 | 6,676 | 222 | 6,373 | 95.5% |
| Interjection (感動詞) | 267 | 5,313 | 46 | 171 | 3.2% |
| Na-adjective (形状詞) | 337 | 3,681 | 2 | 132 | 3.6% |
| Symbol (記号) | 63 | 2,456 | 0 | 0 | 0.0% |
| Adnominal (連体詞) | 31 | 1,749 | 0 | 0 | 0.0% |
| Prefix (接頭辞) | 75 | 1,706 | 74 | 1,695 | 99.4% |
| Conjunction (接続詞) | 18 | 769 | 1 | 35 | 4.6% |

- Particles, auxiliaries, suffixes and prefixes hold 111,163 of the 115,938 tokens with no value. UniDic describes their accent through `accent_connection_type`, which was not measured.
- Outside those four classes, 4,775 tokens have no value. ない as an i-adjective is 3,471 of them.
- Other examples with no value: names from the corpus written in katakana, もん, 方 read かた, 師, 用, けれど.

## Coverage of the references

| Measure | Kanjium | Wadoku file | Either |
| --- | --- | --- | --- |
| Pairs with a reference entry (of 12,395) | 9,154 (73.9%) | 8,695 (70.1%) | 10,484 (84.6%) |
| Tokens with a reference entry (of 246,277) | 117,527 (47.7%) | 144,625 (58.7%) | 179,183 (72.8%) |
| Pairs where UniDic and the reference both have a value | 8,969 | 8,541 | 10,242 |
| Tokens where both have a value | 81,239 | 108,136 | 118,316 |
| Share of the 11,829 pairs with a UniDic value | 75.8% | 72.2% | 86.6% |
| Share of the 130,339 tokens with a UniDic value | 62.3% | 83.0% | 90.8% |

Kanjium covers fewer tokens because it lists some frequent words only under a kanji Spelling. する is under 為る, and the corpus writes it in kana.

## Agreement

| Measure | Kanjium | Wadoku file |
| --- | --- | --- |
| Any overlap, pairs | 8,922 of 8,969 (99.5%) | 8,348 of 8,541 (97.7%) |
| Any overlap, tokens | 79,065 of 81,239 (97.3%) | 97,894 of 108,136 (90.5%) |
| First equal, pairs | 8,642 of 8,969 (96.4%) | 8,028 of 8,541 (94.0%) |
| First equal, tokens | 76,192 of 81,239 (93.8%) | 89,682 of 108,136 (82.9%) |

### Second opinion

When one reference contradicts UniDic, the other reference often has the same pair. This shows which side is the odd one out.

| Case | Pairs | Tokens |
| --- | --- | --- |
| Kanjium contradicts UniDic, Wadoku file has the pair | 27 | 2,106 |
| Of those, Wadoku file agrees with UniDic | 12 | 2,016 |
| Wadoku file contradicts UniDic, Kanjium has the pair | 118 | 2,937 |
| Of those, Kanjium agrees with UniDic | 103 | 2,847 |
| Both references contradict UniDic | 15 | 90 |

The case counts cover only pairs that both references list.

## Agreement by part of speech

### Against Kanjium

| Part of speech | Pairs covered | Tokens covered | Pairs compared | Tokens compared | Any overlap, pairs | Any overlap, tokens | First equal, pairs | First equal, tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Particle (助詞) | 21.7% | 41.6% | 0 | 0 | n/a | n/a | n/a | n/a |
| Noun (名詞) | 80.8% | 74.1% | 6,639 | 49,737 | 99.5% | 99.5% | 96.9% | 97.3% |
| Verb (動詞) | 73.0% | 46.9% | 1,587 | 14,855 | 99.9% | 100.0% | 94.9% | 97.6% |
| Auxiliary (助動詞) | 7.5% | 0.1% | 1 | 8 | 100.0% | 100.0% | 100.0% | 100.0% |
| Pronoun (代名詞) | 29.5% | 70.5% | 23 | 5,370 | 87.0% | 70.1% | 78.3% | 56.1% |
| I-adjective (形容詞) | 69.0% | 28.9% | 191 | 2,069 | 100.0% | 100.0% | 99.0% | 98.8% |
| Adverb (副詞) | 38.9% | 40.1% | 174 | 2,747 | 98.3% | 98.6% | 89.7% | 77.7% |
| Suffix (接尾辞) | 46.2% | 44.9% | 9 | 221 | 55.6% | 97.3% | 55.6% | 97.3% |
| Interjection (感動詞) | 16.5% | 47.1% | 44 | 2,501 | 95.5% | 88.6% | 88.6% | 87.5% |
| Na-adjective (形状詞) | 81.3% | 82.5% | 274 | 3,037 | 99.6% | 100.0% | 98.9% | 98.5% |
| Symbol (記号) | 19.0% | 17.7% | 12 | 434 | 100.0% | 100.0% | 100.0% | 100.0% |
| Adnominal (連体詞) | 48.4% | 14.9% | 15 | 260 | 100.0% | 100.0% | 100.0% | 100.0% |
| Prefix (接頭辞) | 49.3% | 77.4% | 0 | 0 | n/a | n/a | n/a | n/a |
| Conjunction (接続詞) | 5.6% | 4.6% | 0 | 0 | n/a | n/a | n/a | n/a |

### Against the Wadoku file

| Part of speech | Pairs covered | Tokens covered | Pairs compared | Tokens compared | Any overlap, pairs | Any overlap, tokens | First equal, pairs | First equal, tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Particle (助詞) | 26.4% | 30.4% | 0 | 0 | n/a | n/a | n/a | n/a |
| Noun (名詞) | 73.6% | 81.3% | 6,044 | 54,716 | 99.1% | 99.1% | 95.8% | 96.7% |
| Verb (動詞) | 70.6% | 91.4% | 1,535 | 28,948 | 93.4% | 68.7% | 88.3% | 54.9% |
| Auxiliary (助動詞) | 30.0% | 18.9% | 1 | 8 | 100.0% | 100.0% | 0.0% | 0.0% |
| Pronoun (代名詞) | 66.7% | 66.1% | 52 | 5,038 | 92.3% | 97.8% | 86.5% | 97.1% |
| I-adjective (形容詞) | 81.9% | 98.7% | 226 | 3,599 | 98.2% | 98.6% | 96.5% | 97.8% |
| Adverb (副詞) | 63.8% | 87.7% | 283 | 5,997 | 96.8% | 98.8% | 88.7% | 67.6% |
| Suffix (接尾辞) | 36.3% | 57.4% | 14 | 256 | 42.9% | 37.1% | 42.9% | 37.1% |
| Interjection (感動詞) | 22.5% | 64.1% | 58 | 3,354 | 89.7% | 92.7% | 79.3% | 88.6% |
| Na-adjective (形状詞) | 81.3% | 86.4% | 274 | 3,181 | 98.9% | 98.9% | 95.6% | 97.2% |
| Symbol (記号) | 28.6% | 33.2% | 18 | 815 | 100.0% | 100.0% | 100.0% | 100.0% |
| Adnominal (連体詞) | 71.0% | 95.9% | 22 | 1,678 | 100.0% | 100.0% | 95.5% | 53.8% |
| Prefix (接頭辞) | 26.7% | 51.9% | 1 | 11 | 100.0% | 100.0% | 0.0% | 0.0% |
| Conjunction (接続詞) | 77.8% | 74.1% | 13 | 535 | 100.0% | 100.0% | 92.3% | 99.3% |

## Kinds of disagreement

A disagreement is a pair where both sides have a value and none is shared. "Heiban" is accent 0. "Odaka" is an accent on the last mora.

| Kind | Kanjium pairs | Kanjium tokens | Wadoku file pairs | Wadoku file tokens |
| --- | --- | --- | --- | --- |
| UniDic heiban, reference accented (not odaka) | 12 | 1,714 | 31 | 6,154 |
| UniDic heiban, reference odaka | 3 | 9 | 104 | 3,418 |
| UniDic accented, reference heiban | 18 | 384 | 26 | 202 |
| UniDic odaka, reference heiban | 4 | 54 | 9 | 176 |
| Both accented, one mora apart | 8 | 10 | 16 | 226 |
| Both accented, further apart | 2 | 3 | 7 | 66 |
| Total | 47 | 2,174 | 193 | 10,242 |

### Heiban verbs marked odaka in the Wadoku file

This is the largest group by pairs: 104 pairs, 3,418 tokens. UniDic gives 0 and the Wadoku file gives the mora count. Examples: 言う, 知る, 聞く, 使う, 変わる, 終わる. Kanjium gives 0 for these, as UniDic does. する is a related case: UniDic 0, Wadoku file 2 and 1, 5,773 tokens. These look like errors of the file or of its conversion, not of UniDic. Whether the Wadoku XML itself has them was not checked.

### A kana Spelling that is two words in the reference

Kanjium gives 1 for the kana entries これ and それ and 0 for 此れ and 其れ. UniDic gives 0 for the pronouns. The two pairs are 1,598 of the 2,174 tokens that disagree with Kanjium. The Wadoku file agrees with UniDic on both. The kana entry in Kanjium is probably the interjection, which the key of Spelling plus reading cannot tell apart from the pronoun.

### UniDic accented, reference heiban

Examples: ああ (UniDic 1, Kanjium 0), 中国 and 韓国 (UniDic 1, Kanjium 0), 桜 and 湊 as names (UniDic 1, both references 0), きっと (UniDic 1, Wadoku file 0). Some are names that share a Spelling with a common noun. UniDic reports the accent of the name.

### Suffixes that the references list as nouns

UniDic gives 1 for the suffixes 下ろし, 交じり, 紛い and 外れ. The references list the nouns, with 3, 2 or 0. Few suffixes have a UniDic value at all, so this group is small (4 pairs against Kanjium).

### Loanwords and short words

Examples: サイト (UniDic 0, both references 1), ブラウザ (0 against 2), ロゴ (0 against 1), プラザ (1 against 2), タトゥー (2 against 1), 雫 (0 against 3), いや as an interjection (UniDic 1, Wadoku file 2). These are single real differences between sources. No pattern was found.

### Order of values

For 280 pairs against Kanjium (2,873 tokens) the sources share a value but list a different one first. This is the gap between "any overlap" and "first equal". It is largest for adverbs (first equal for 77.7% of tokens against Kanjium). Kanjium tags some values by part of speech, such as noun and adverb. The script ignores the tags and reads the values in file order.

## Limits

- The two references are not ground truth. Kanjium does not name its sources, and the Wadoku file is a third-party conversion with visible errors. Agreement shows consistency between sources, not correctness.
- Neither NHK nor any other publisher dictionary was used.
- Only words in ten texts were measured: 12,395 pairs, mostly from anime subtitles and two wiki articles. The whole UniDic lexicon was not compared.
- About 13% of the pairs with a UniDic value have no entry in either reference. Their accuracy is unknown. Names and rare words are over-represented there.
- For 155 pairs (1.3%) the tokenizer reported more than one accent value across tokens, mostly because one Spelling and reading belongs to two parts of speech. The script takes the most frequent value for the pair. 2,726 tokens (1.1%) carry another value.
- A pair is assigned the part of speech of its first token.
- Not measured: `accent_connection_type` and `accent_modification_type`, the accent of conjugated forms, the accent of compounds made of several tokens, and the accent of particles and auxiliaries.
- Not measured: whether the tokenizer picked the right reading in context. A wrong reading gives a wrong key and counts as "no reference entry" or as a comparison with another word.

## How to reproduce

The script is `docs/research/unidic-accent-accuracy/measure.cjs`. It needs a folder with the native `lindera` binding in `node_modules`, the built dictionary in `unidic-new/202512-out` and the texts in `texts/`. It prints JSON and writes nothing.

```sh
node docs/research/unidic-accent-accuracy/measure.cjs <spike-dir> <accents.txt> <wadoku_pitchdb.csv>
```

Add `--examples` to list the most frequent single words of each kind of disagreement.

Reference files:

```text
https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt
https://raw.githubusercontent.com/IllDepence/anki_add_pitch/master/wadoku_pitchdb.csv
```
