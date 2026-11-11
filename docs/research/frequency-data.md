# Japanese word frequency data for Michigo

Research for issue #35. Sources were read on 2026-11-11. This doc reports options and evidence. It does not pick a default list; the last section is a recommendation only.

## The question

Which Japanese word frequency lists can Michigo ship inside the app, and which can it only let the user import? For each list: corpus, size, how it keys words, how it treats spelling variants, and license.

## Summary table

| List | Corpus | Size | Key | License | Ship? |
| --- | --- | --- | --- | --- | --- |
| Jiten (jiten.moe) | Anime, drama, film, novels, VN, manga, games, YouTube | 18,821 titles, about 3.99 billion characters | JMdict entry, one row per kana and kanji form | CC BY-SA 4.0 | Yes, with attribution and share-alike |
| JMdict priority tags | Mainichi Shimbun word list, 1998 vocabulary book | First 24,000 words (nf01 to nf48) | JMdict entry, per kanji or reading element | CC BY-SA 4.0 | Yes, already bundled with JMdict |
| wordfreq (ja) | Wikipedia, OpenSubtitles 2018, OSCAR web, Twitter, Reddit | "Large" list (words down to 1 per 100 million) | MeCab IPADIC surface form | Data CC BY-SA 4.0, code Apache 2.0 | Yes, but frozen at 2021 and keyed by surface form |
| BCCWJ vocabulary list | Balanced written Japanese: books, magazines, newspapers, Yahoo! Chiebukuro, blogs, law, Diet | 104.6 million SUW tokens, 185,136 SUW entries | UniDic lemma + lemma reading + POS | Free for research and education, no redistribution, commercial use on request | No. Import only |
| CSJ vocabulary list | Spontaneous spoken Japanese | Not verified | UniDic SUW | Reported as CC BY-NC-SA 3.0, not verified | No for a commercial build. Import only |
| NWJC vocabulary list | Web crawl 2012 to 2015 | About 25.8 billion SUW tokens in the 2014-4Q data | UniDic SUW | Not found | Unknown. Import only |
| jpdb frequency | Anime, drama, light novels, VN, web novels | Not published | JMdict entry, kana frequency separate | No license. Data was scraped, and jpdb's terms ban scraping | No. Import only |
| CC100 frequency (Yomitan) | CC-100 Japanese web text | About 160,000 words after filtering | Term and reading | No license found for the list | No. Import only |
| Innocent corpus, Narou, VN, Netflix and other community lists | Novels, web novels, VN, subtitles | Varies | Term, often without reading | No license found | No. Import only |
| FrequencyWords (ja) | OpenSubtitles 2018 | 402 KB list | Broken tokens (see below) | Content CC BY-SA 4.0 | Licensed, but not usable |
| Leeds internet-jp | Japanese web corpus | Not verified | Not verified | CC BY 2.5 per Wiktionary, not verified | Possible, unverified |

## Shippable lists

### Jiten

Jiten is an open-source site (Apache 2.0 code) that parses Japanese media with Sudachi.rs and publishes frequency lists. The frequencies page states "All frequency lists are licensed under CC BY-SA 4.0" ([jiten.moe/frequency-dictionaries](https://jiten.moe/frequency-dictionaries), [jiten.moe/other](https://jiten.moe/other)).

The corpus is entertainment media: 3,863 anime, 3,750 movies, 3,375 novels, 3,120 dramas, 2,807 visual novels, 1,279 manga, 406 games, 57 YouTube channels, 112 non-fiction and 37 web novel titles. There is a global list and one list per media type. Both come as Yomitan zips and as plain CSV. The site grows, so the counts change over time.

Keying is the strongest of any list here. Words are JMdict entries (`WordId`), and frequency is stored per form (`WordId` plus `ReadingIndex`). The CSV header is `Word,Form,Rank`. Each kana form gets a row `(kana, kana, rank)` and each kanji form gets a row `(kanji, main kana reading, rank)`, so spelling variants of one entry get separate ranks ([YomitanHelper.cs](https://github.com/Sirush/Jiten/blob/master/Jiten.Core/YomitanHelper.cs)).

Share-alike applies to the list and to anything adapted from it. Shipping it means attribution in the app and keeping any modified copy under CC BY-SA 4.0. It does not force the app code open. JMdict-derived data in Jiten carries the EDRDG terms too.

### JMdict priority tags

JMdict carries frequency codes on each kanji element (`ke_pri`) and reading element (`re_pri`) ([JMdict DTD](https://www.edrdg.org/jmdict/jmdict_dtd_h.html)):

- `news1` and `news2`: the first and second 12,000 words in Alexandre Girardi's word frequency file from the Mainichi Shimbun.
- `ichi1` and `ichi2`: words in the "Ichimango goi bunruishuu" (1998).
- `spec1`, `spec2`: a small number of words detected as common but missing from the other lists.
- `gai1`, `gai2`: common loanwords, from the same newspaper file.
- `nfxx`: the 500-word band in the newspaper file, `nf01` for the first 500 and so on up to `nf48`.

The DTD says both elements are tagged "because on occasions a priority is only associated with a particular kanji/reading pair." This is coarse (bands of 500, newspaper text only, nothing past 24,000) and old. It is free to ship: JMdict is CC BY-SA 4.0 ([EDRDG licence](https://www.edrdg.org/edrdg/licence.html)). EDRDG also asks apps to show the attribution on a separate screen and to update the dictionary regularly.

### wordfreq

wordfreq covers Japanese with a "large" list built from Wikipedia, OpenSubtitles 2018, OSCAR web text, Twitter and Reddit. Code is Apache 2.0. The data "may be redistributed under a Creative Commons Attribution-ShareAlike 4.0 license", with extra attribution for some sources such as OpenSubtitles ([README](https://github.com/rspeer/wordfreq/blob/master/README.md)).

The project is sunset. The data is a snapshot "up through 2021" and will not be updated, because LLM output now pollutes the web and Twitter and Reddit closed their data ([SUNSET.md](https://github.com/rspeer/wordfreq/blob/master/SUNSET.md)).

Japanese tokens are MeCab IPADIC surface forms. `mecab_tokenize` keeps only the first column of MeCab output after NFKC normalization ([mecab.py](https://github.com/rspeer/wordfreq/blob/master/wordfreq/mecab.py)). So `食べた` counts as `食べ` and `た`, not as the lemma `食べる`, and readings are not recorded. Michigo would have to tokenize with the same IPADIC rules to look words up, and could not tell `辛い` (からい) from `辛い` (つらい).

## Import-only lists

### BCCWJ

NINJAL's BCCWJ vocabulary list ver. 1.0 is the best-documented written corpus list ([download page](https://clrd.ninjal.ac.jp/bccwj/freq-list.html), [manual](https://clrd.ninjal.ac.jp/bccwj/data-files/frequency-list/BCCWJ_frequencylist_manual_ver1_0.pdf)).

- Corpus: 104,612,423 SUW tokens across books, magazines, newspapers, white papers, textbooks, PR newsletters, bestsellers, Yahoo! Chiebukuro, Yahoo! Blogs, verse, law and Diet minutes.
- Size: the SUW file has 185,136 entries. The LUW file has 2,434,619.
- Key: SUW entries are the tuple of lemma (語彙素), lemma reading (語彙素読み), POS, lemma subclass and word type. Spelling variants fold into one lemma, so `子供` and `子ども` share a row.
- Columns: rank, frequency and per-million frequency for the whole corpus and for each register. That allows a per-register list, for example only blogs or only books.
- Errors: the manual states about 2% misanalysis.

The terms in section 6 of the manual rule out shipping: free for research and education, "再配布は不可" (no redistribution), and "商業使用（営利目的での利用）は要相談" (commercial use needs consultation). NINJAL holds the compilation copyright. Michigo can only let the user download it and import it.

### CSJ and NWJC

NINJAL also publishes lists for the Corpus of Spontaneous Japanese (`CSJ_frequencylist_suw_ver201803.tsv`) and the NINJAL Web Japanese Corpus (`NWJC_frequencylist_suw_ver2022_02.tsv`). Both are mirrored in a [community Yomitan conversion](https://github.com/Maltesaa/CSJ_and_NWJC_yomitan_freq_dict) that states no license.

NWJC was crawled from 2012-4Q to 2015-2Q, and the 2014-4Q data alone has 25,836,947,421 SUW tokens. Access to the full corpus needs joint research or a company contract ([NWJC page](https://masayu-a.github.io/NWJC/)). No license for the vocabulary list was found.

A search result says the CSJ list manual is CC BY-NC-SA 3.0. The manual's server returned 503, so this is unverified. Non-commercial terms would bar shipping in a paid app.

### jpdb

jpdb.io has a large immersion corpus (anime, drama, light novels, visual novels, web novels). It never published a list. The community lists were scraped: [MarvNC's](https://github.com/MarvNC/jpdb-freq-list) in May 2022 and Kuuube's v2.x, updated May 2024 ([Kuuube](https://github.com/Kuuuube/yomitan-dictionaries)). jpdb's terms list "accessing the website in an automated manner, e.g. scraping" as abuse and ask users to "contact us beforehand" for unintended uses ([terms](https://jpdb.io/terms-of-use)). No license grants reuse of the data.

The lists key by JMdict term and show kana-written frequency separately. Coverage stops at JMdict, and some readings are missing; MarvNC notes 経緯 only has いきさつ.

### Community Yomitan lists

The [MarvNC index](https://github.com/MarvNC/yomitan-dictionaries#term-frequency) lists many more: CC100 web text (about 160,000 words after filtering 900,000 raw), Innocent corpus (5,000+ novels, no reading distinction), Narou web novels, VN, Netflix, anime and J-drama, YouTube (40,000 transcribed videos), Aozora Bunko jukugo, CEJC conversation and JLPT tags. None of the pages read for this doc states a license. Most are derived from copyrighted works by anonymous authors. Treat all of them as import only.

## Lists that do not work

### FrequencyWords

[FrequencyWords](https://github.com/hermitdave/FrequencyWords) is MIT code and CC BY-SA 4.0 content built from OpenSubtitles. The Japanese file `content/2018/ja/ja_full.txt` is 402,792 bytes. Its top rows are `、`, `。`, `何`, `あ`, `あなた`, `言`, `行`, `分か`. Punctuation is counted, and verbs are cut to their kanji stem (`言`, `分か`). The tokens do not match any dictionary form, so the list cannot rank words.

### Leeds internet-jp

Serge Sharoff's Leeds lists are listed on [Wiktionary](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Japanese) as CC BY 2.5. `corpus.leeds.ac.uk` refused connections, so the corpus size, keying and license are unverified.

## Import format

Most community lists ship as Yomitan frequency dictionaries, so one importer covers them. A term meta bank entry is `[term, "freq", data]`. `data` is either a bare frequency or `{ reading, frequency }`. A frequency is a number, a string, or `{ value, displayValue? }` ([term meta schema](https://github.com/yomidevs/yomitan/blob/master/ext/data/schemas/dictionary-term-meta-bank-v3-schema.json)). `index.json` has `frequencyMode` set to `occurrence-based` or `rank-based`, and an `attribution` string ([index schema](https://github.com/yomidevs/yomitan/blob/master/ext/data/schemas/dictionary-index-schema.json)). Lists without a reading cannot separate homographs.

BCCWJ is a TSV with 80 columns, not a Yomitan zip. Importing the official file directly needs its own parser, keyed on `lemma` and `lForm`.

## How keys line up

The lists use three incompatible keys:

- JMdict entry and form (Jiten, JMdict tags, jpdb): matches a dictionary lookup directly.
- UniDic lemma and reading (BCCWJ, CSJ, NWJC): matches a UniDic tokenizer such as Sudachi or MeCab with UniDic. Variants are already merged.
- Surface token (wordfreq, FrequencyWords): matches only the exact tokenizer that built it.

Whichever tokenizer Michigo picks decides which lists line up without a mapping step.

## Recommendation

This is a recommendation, not a finding. Jiten is the only list that is current, large, licensed for redistribution, and keyed per JMdict form. JMdict tags come free with JMdict as a coarse fallback. BCCWJ is the best written-language list, but only as a user import. A Yomitan frequency importer would cover most other community lists. Whether Jiten's entertainment-heavy corpus suits the learner's texts is a product question this research does not settle.

## Open points

- CSJ list license: the manual returned 503. A search result says CC BY-NC-SA 3.0.
- NWJC vocabulary list license: not found.
- Leeds list: site unreachable. License known only from Wiktionary.
- Jiten CC BY-SA terms for lists built from copyrighted media: taken from the site's own statement. No legal review was done.
