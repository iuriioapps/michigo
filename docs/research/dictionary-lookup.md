# Dictionary lookup: checks on the match rule, longer entries and inflection labels

Measured on 2026-11-15 for [How does Michigo find Dictionary entries for a word and choose the gloss?](https://github.com/iuriioapps/michigo/issues/68). The scripts are in `docs/research/dictionary-lookup/`. They need the tokenizer spike folder with UniDic 2025.12, the local corpus (239,628 occurrences, 11,275 distinct words) and the unpacked Yomitan zips of JMdict English and JMnedict of 2026-11-13.

## Short answer

- Four steps from the word's side find a JMdict entry for 94.0% of words and 98.1% of occurrences. With JMnedict as a second Dictionary: 97.1% and 98.9%.
- A fifth step by reading alone, used only when no Dictionary has an entry, brings this to 97.9% and 99.4%. It is loose: 58 of its 95 words get several headwords.
- The same spelling has another reading in JMdict for 34.8% of the occurrences written with kanji. In a judged sample of 150 of them, the tokenizer's reading is wrong in 5.
- The `score` field of a row orders readings, and the `sequence` field is the JMdict entry ID.
- A run of up to 4 tokens covers 99.6% of the longer entries in the corpus.
- UniDic gives a conjugation form for every token. A fixed table labels 98.5% of the conjugated verbs and adjectives.

## The JMdict file

- 527,778 rows and 231,612 entries. A row is one spelling with one reading of one entry.
- 201,942 entries have a term with kanji. Only 22,291 of them (11.0%) also have a row for the kana spelling. The term かける has no row, and 掛ける has 26.
- 9,608 entries with kanji have a "usually kana" sense. 6,138 of them (63.9%) have a kana row.
- 20,875 rows have an empty reading.
- The `sequence` field is the JMdict entry ID: 1198180 is 会う, 逢う, 遭う and 遇う, all read あう. 8,279 of the 8,293 rows of the JLPT list find their entry by this ID.

### The score field

The field has 761 distinct values, from -10,100,301 to 1,999,800. 11.0% of the rows are above zero.

| Spelling | Readings by score                                                  |
| -------- | ------------------------------------------------------------------ |
| 人       | じん 999800, ひと 999800, にん 999800, と -200                     |
| 日       | ひ 1999800, にち 999800, か -200, んち -200, ち -10200             |
| 生       | なま 999800, き -200, せい -200, いく -200, ふ -200, しょう -10200 |
| 辛い     | からい 1999800, つらい 999800, づらい -200, ずらい -5010200        |

The score separates a common reading from a rare one. It does not choose between two common readings.

## How a word finds its entries

The first four steps are the steps of the JLPT and frequency lookup, with the last one opened to any reading. The first step that finds something wins.

| Step | Rule                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| 1    | A Spelling and its own reading equal a row                                    |
| 2    | The lexeme form and the lexeme reading equal a row                            |
| 3    | A kana Spelling equals the reading of a row whose spelling is the lexeme form |
| 4    | A Spelling equals the spelling of a row, with any reading or none             |
| 5    | A kana Spelling equals the reading of a row                                   |

### Steps 1 to 4

| Dictionaries | Step 1 | Step 2 | Step 3 | Step 4 | Words with an entry | Content words | Occurrences |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JMdict | 10,060 | 477 | 1 | 64 | 94.0% | 94.2% | 98.1% |
| JMdict, then JMnedict | 10,263 | 500 | 1 | 179 | 97.1% | 97.3% | 98.9% |
| JMnedict alone | 924 | 112 | 0 | 2,008 | 27.0% | 25.7% | 33.9% |

- Step 2 carries the kana words: the text has かける, and the lexeme form 掛ける has the row.
- Step 4 in JMdict finds the words where the tokenizer chose a reading that JMdict does not list for the spelling: 母 as カア (inside お母さん), 父 as トウ, 祭 as サイ, 国 as コク.
- Step 4 in JMnedict finds family names, because 75% of its rows have no reading: 前原, 天海, 馬渕, 向坂. JMnedict alone also matches common words by spelling (の, わたし, 年, 人), so a name entry is no proof that a word is a name.
- Of the 10,602 words that JMdict matches, 10,083 find one entry, 399 find two, 116 find three to five and 4 find more (じゃあ 9, に 7, なん 7, あれ 6).

### Words with no entry after step 4

With JMdict alone 673 words have no entry. Two groups:

- Names and sounds that no Dictionary has: フリーレン, シュタルク, ロキ, うおお, ヘヘヘヘ.
- Kana words whose lexeme form is not the JMdict spelling: だけ (lexeme form だけ, JMdict 丈), など (等), わし (儂), おかげ (lexeme form 御陰, JMdict お陰), おなか (御腹, お腹), つく (lexeme form 吐く, twelve spellings in JMdict), めでたい (目出度い).

### Step 5, by reading alone

Step 5 runs only for a word that has no entry in any Dictionary after step 4.

| Dictionaries | Step 5 adds | Words with an entry | Occurrences | One headword | 2 to 5 | 6 or more | Still no entry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JMdict | 150 | 95.4% | 98.8% | 51 | 78 | 21 | 523 |
| JMdict, then JMnedict | 95 | 97.9% | 99.4% | 37 | 47 | 11 | 237 |
| JMnedict alone | 177 | 28.6% | 50.3% | 171 | 6 | 0 | 8,054 |

- It finds だけ (4 headwords), など (2), わし (5), おかげ (2), おなか (2), めでたい (3) and くれぐれ (1).
- It is loose: つく gets 18 headwords and ひ gets 28.
- It must not run per Dictionary. In JMnedict alone it matches は, て, する and です as names, because JMnedict has names in kana with those readings.

### By text

JMdict, then JMnedict.

| Text           | Occurrences | Entry after steps 1 to 4 | Step 5 adds | No entry |
| -------------- | ----------- | ------------------------ | ----------- | -------- |
| lyrics-classic | 279         | 98.6%                    | 0.4%        | 1.1%     |
| prose          | 5,292       | 97.8%                    | 0.5%        | 1.7%     |
| subs-1         | 61,243      | 98.7%                    | 0.5%        | 0.8%     |
| subs-2         | 19,080      | 98.8%                    | 0.5%        | 0.7%     |
| subs-3         | 27,278      | 99.1%                    | 0.5%        | 0.4%     |
| subs-4         | 27,847      | 99.2%                    | 0.5%        | 0.3%     |
| subs-5         | 31,411      | 99.2%                    | 0.6%        | 0.2%     |
| subs-6         | 8,586       | 99.3%                    | 0.5%        | 0.2%     |
| wiki-danmachi  | 45,167      | 98.8%                    | 0.3%        | 0.9%     |
| wiki-miku      | 13,445      | 99.1%                    | 0.5%        | 0.4%     |

The result holds across subtitles, prose, lyrics and encyclopedia text.

## Other readings of the same spelling

- Of the 8,432 words with a kanji Spelling that steps 1 to 3 match, 1,525 (18.1%) have the same spelling under another reading in JMdict. They hold 31.8% of the occurrences of those words.
- Counted per occurrence: 75,492 occurrences are written with kanji, and 26,274 of them (34.8%) have another reading in JMdict.
- The most frequent: 居る (イル, also オル), 事 (コト, ジ), 私 (ワタシ, ワシ), 年 (ネン, トシ), 様 (サマ, ヨウ), 人 (ヒト, ジン, ニン), 月 (ガツ, ゲツ, ツキ), 日 (ニチ, ヒ, カ).

### Judged sample

150 of these occurrences, drawn with a fixed seed and judged by hand in their sentence. The tokenizer's reading is wrong in 5 (3.3%):

| Text                       | Tokenizer    | Correct                   |
| -------------------------- | ------------ | ------------------------- |
| 魔法は大陸中に普及する     | 中 as チュウ | ジュウ                    |
| 本編7巻で                  | 巻 as マキ   | カン                      |
| 後に、シャルザードは       | 後 as アト   | ノチ                      |
| ヴェルフと命、             | 命 as イノチ | ミコト (a character name) |
| みんなのこと何も分からない | 何 as ナン   | ナニ                      |

One more is a matter of taste: 言う at the start of a sentence comes back as ユウ, which JMdict lists beside イウ. In every wrong case the correct reading is among the other readings that JMdict has for the spelling. The sample is the last section of the output of `check2.cjs`.

## Longer entries

A run of adjacent tokens inside one phrase whose text is a JMdict term. The last token counts as written, and also in its dictionary form.

| Tokens | Hits as written | More hits with the last token in dictionary form | Distinct entries | Examples |
| --- | --- | --- | --- | --- |
| 2 | 29,225 | 3,009 | 3,080 | 今も, ても, 来た, にも, でも, お里, 黍団子 |
| 3 | 4,166 | 1,115 | 1,198 | 花が咲く, ついて行く, について, 人一倍, 竹馬の友 |
| 4 | 621 | 68 | 214 | いつの日か, 気にしない, 声を限りに, かも知れない |
| 5 | 118 | 14 | 62 | いつの間にか, 風上にも置けない, 手に取るように |
| 6 | 13 | 0 | 9 | 一筋縄ではいかない, 他の追随を許さない |
| 7 | 3 | 1 | 2 | 何の役にも立たない |
| 8 | 2 | 1 | 3 | 何事もなかったかのように |

- Runs of 2 to 4 tokens hold 38,204 of the 38,356 hits (99.6%).
- 11% of the hits need the dictionary form of the last token (気がした finds 気がする).
- Many hits of 2 tokens are pairs of particles and auxiliaries that JMdict lists as expressions: ても, にも, でも, たの.
- The rows of the JLPT list by number of tokens: 7,675 of one, 498 of two, 89 of three, 27 of four and 4 of five or six.

## Inflection labels

UniDic 2025.12 gives each token a conjugation type and a conjugation form, and an ending is a token of its own:

```text
気がした   し    動詞 サ行変格 連用形-一般, lexeme 為る
           た    助動詞 助動詞-タ 終止形-一般
しなかった し    動詞 未然形-一般
           なかっ 助動詞 助動詞-ナイ 連用形-促音便
           た    助動詞 助動詞-タ
食べれば   食べれ 動詞 下一段-バ行 仮定形-一般
           ば    助詞 接続助詞
```

### The table

| Label                | Rule                                                                |
| -------------------- | ------------------------------------------------------------------- |
| past                 | followed by the auxiliary た                                        |
| たら-form            | followed by the auxiliary た in 仮定形                              |
| negative             | followed by the auxiliary ない or ぬ; an adjective followed by 無い |
| て-form              | followed by the particle て                                         |
| progressive          | followed by the auxiliary てる, or by て and 居る                   |
| ば-form              | 仮定形 followed by the particle ば                                  |
| たり-form            | followed by the particle たり                                       |
| polite               | followed by the auxiliary ます                                      |
| passive or potential | followed by the auxiliary れる or られる                            |
| causative            | followed by the auxiliary せる or させる                            |
| たい-form            | followed by the auxiliary たい                                      |
| imperative           | 命令形                                                              |
| volitional           | 意志推量形                                                          |
| stem                 | a verb in 連用形 with no label above                                |
| く-form              | an adjective in 連用形 with no label above                          |

A label chains: the rule runs again on the ending. しなかった is "negative, past", and されていた is "passive or potential, progressive, past".

### Coverage

Verb and adjective tokens that are not in 終止形 or 連体形: 23,885.

| Text           | Tokens | Table without the last two rows | With "stem" | With "く-form" |
| -------------- | ------ | ------------------------------- | ----------- | -------------- |
| lyrics-classic | 35     | 77.1%                           | 97.1%       | 97.1%          |
| prose          | 800    | 82.9%                           | 95.4%       | 99.3%          |
| subs-1         | 6,000  | 89.7%                           | 96.0%       | 98.5%          |
| subs-2         | 1,859  | 90.3%                           | 95.8%       | 98.7%          |
| subs-3         | 2,869  | 88.6%                           | 94.4%       | 97.7%          |
| subs-4         | 2,892  | 88.3%                           | 95.0%       | 98.4%          |
| subs-5         | 3,126  | 83.8%                           | 94.8%       | 97.8%          |
| subs-6         | 911    | 92.0%                           | 97.4%       | 98.8%          |
| wiki-danmachi  | 4,368  | 69.7%                           | 97.0%       | 99.2%          |
| wiki-miku      | 1,025  | 83.5%                           | 97.4%       | 99.2%          |
| All            | 23,885 | 84.6%                           | 95.8%       | 98.5%          |

- The most frequent chains: past 4,804, て-form 4,740, negative 1,820, progressive 1,515, passive or potential 780, imperative 707, polite 643, "progressive, past" 578.
- Without a label: an adjective stem before さ (強さ, 79), before そう (楽しそう, 59), before 過ぎる (ヤバすぎる, 38) and before がる (怖がる, 20); 已然形 (いえ, 23). The stem cases are derivation, not inflection.
- A "stem" label also lands on a verb before ちゃう, そう and ながら. Those constructions are Grammar Patterns.

## Not answered

- How well the lookup works with a Dictionary that is not built from JMdict. No other Dictionary was at hand.
- The judged sample comes from one corpus of anime subtitles, one short story and two encyclopedia articles. A text with many rare kanji readings can differ.
