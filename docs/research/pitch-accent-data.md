# Pitch accent data Michigo can use

Research for [Which pitch accent data can Michigo use?](https://github.com/iuriioapps/michigo/issues/70). Checked on 2026-11-13. This is a reading of license texts, not legal advice.

## Question

Which pitch accent data sets exist, and under which license? Which of them permit a hosted copy that Michigo downloads through its manifest, and which stay import only? What does a pitch dictionary in a Yomitan zip look like, and how does Yomitan draw its pitch diagram from it?

The standard for "hosted copy" is the one applied in [Which licenses permit a hosted copy, and what do they ask?](https://github.com/iuriioapps/michigo/issues/66).

## Short answer

Two sources have a clear license and a known origin: the accent fields of UniDic CWJ 2025.12 (BSD 3-clause option) and Wadoku (its own free-of-charge license). Both permit a hosted copy.

**UniDic 2.1.2 as Lindera ships it has no accent fields at all.** Only the newer UniDic (2025.12) carries `aType`. If Michigo picks 2025.12 as the tokenizer dictionary, word-level pitch data arrives with it and nothing extra has to be hosted.

Kanjium, the usual Yomitan pitch dictionary, states CC BY-SA 4.0, but its author declines to name the sources "due to potential copyright issues". The license text permits a hosted copy. The origin does not back it up.

The NHK accent dictionary and the other commercial dictionaries have no open license. They stay import only.

A Yomitan pitch dictionary is a zip with `term_meta_bank_N.json` files. An entry is `[term, "pitch", {reading, pitches}]`, and Yomitan attaches it to a headword only when both the term and the reading match exactly. The diagram is a small inline SVG that needs only the kana reading and the downstep position.

## Summary of the data sets

| Data set | License | Hosted copy | Notes |
| --- | --- | --- | --- |
| UniDic CWJ 2025.12, accent fields | BSD 3-clause (one of three choices) | Yes | Part of the tokenizer dictionary. Not present in UniDic 2.1.2. |
| Wadoku | Wadoku license (custom, free of charge only) | Yes, with conditions | About 410,000 term and reading pairs in a third-party Yomitan build. |
| Open JTalk `naist-jdic` | BSD 3-clause | Yes | Made for speech synthesis. Last release 2018. Quality not checked. |
| Kanjium `accents.txt` | CC BY-SA 4.0 as stated | Yes by the license text, origin undisclosed | 124,137 entries. The author will not name the sources. |
| Wiktionary | CC BY-SA 4.0 and GFDL | Yes in principle | No ready pitch build found. Accent values cite NHK and other dictionaries. |
| NHK accent dictionary (1998, 2016) | None published, all rights reserved | No, import only | Yomitan builds of it circulate without a license. |
| Daijirin, Shin Meikai and other publishers | None, all rights reserved | No, import only | Same position as NHK. |
| tdmelodic | BSD 3-clause (generator code) | Not applicable | Machine estimates for names and new words, not a checked data set. |
| OJAD | Not verified | Not verified | The site did not resolve during this research. |

## UniDic accent fields

### What the fields contain

The UniDic user manual ([UNIDIC_manual.pdf](https://clrd.ninjal.ac.jp/unidic/UNIDIC_manual.pdf), version 1.3.9, linked from the [UniDic FAQ](https://clrd.ninjal.ac.jp/unidic/faq.html)) defines three accent attributes on the pronunciation level of an entry (table 1 and sections 6.5 to 6.7).

`aType` (アクセント型, accent type) is the position of the accent kernel, counted in morae from the start of the word. The manual gives シャカイ (社会) as 1 and カタカナ (片仮名) as 3, and says 0 marks the flat (heiban) type. When several accents are possible they are listed with commas, and "the order shows the priority". Examples from the manual: ねこ has `aType="1"`, 結果 has `aType="0,1"`.

`aConType` (アクセント結合型, accent connection type) says how the word changes the accent of a compound or phrase it joins. Nouns and suffixes take `C1` to `C5`, prefixes take `P1` to `P14`, particles and auxiliaries take `F1` to `F6` with a value after `@`. Example: `C2` means the compound's accent is the mora count of the first part plus 1. A particle can hold several rules in one value, such as `動詞%F2@0,名詞%F1,形容詞%F2@-1`.

`aModType` (アクセント修飾型, accent modification type) says how a conjugated form shifts the accent of the base form. The values are `M1@n`, `M2@n` and `M4@n`. Example from the manual: 起きる has `aType="2"`, and its form 起き carries `aType="2" aModType="M4@1"`, which gives 2 minus 1.

So `aType` is the same kind of number as a Yomitan pitch `position`: a downstep position in morae, with 0 for heiban.

### Which UniDic versions have them

Lindera's schema for UniDic 2.1.2 ([lindera-unidic/metadata.json](https://github.com/lindera/lindera/blob/main/lindera-unidic/metadata.json)) lists 17 feature fields and ends at `final_mutation_form`. It has no accent field. The `dicrc` listing in the UniDic FAQ shows the same layout (`f[13]: iType` to `f[16]: fForm`).

Lindera's schema for UniDic CWJ 2025.12 ([lindera-unidic-cwj/metadata.json](https://github.com/lindera/lindera/blob/main/lindera-unidic-cwj/metadata.json)) adds `accent_type`, `accent_connection_type` and `accent_modification_type`, among others. Its README lists them as fields 28 to 30 and warns that the connection type "can contain commas".

The choice of tokenizer dictionary therefore decides this point. With 2.1.2 there is no UniDic pitch data. With 2025.12 every token carries it.

### License

UniDic 2025.12 can be hosted under its BSD 3-clause choice. This was settled in [Which licenses permit a hosted copy, and what do they ask?](https://github.com/iuriioapps/michigo/issues/66). The accent fields are part of the same files, so they add no new terms.

### Whether they are usable as pitch data

Yes for single words, with limits.

- The value belongs to a short unit (短単位). A compound such as 社会生活 is two tokens, and its accent is not stored. The manual says the tool `chaone` computes it from `aConType` rules.
- The value on a conjugated form is the accent of the base form. This suits Michigo, which makes cards for the dictionary form.
- No join on spelling and reading is needed. The token that Lindera returns already holds the value.
- The mora count for a diagram must come from the kana of the same entry. UniDic readings are katakana.
- Several values can be present (`0,1`). The first has priority.

The manual does not say where the accent values come from. The share of entries in 2025.12 that have an `aType` was not measured here.

## Wadoku

### What it is

Wadoku is a Japanese-German dictionary led by Ulrich Apel and Wadoku e.V. Its XML dump is published twice a year ([Downloads](https://www.wadoku.de/wiki/display/WAD/Downloads+und+Links); latest: 5 July 2026, 25 MB). A third-party project, [classicsc/wadoku-pitch-dictionary-for-yomitan](https://github.com/classicsc/wadoku-pitch-dictionary-for-yomitan), converts the accent data of that dump into a Yomitan pitch dictionary. Its README says it reads accent positions from `<accent>` nodes and devoiced morae from `<hatsuon>` nodes. The XML itself was not opened in this research.

The release `v20260705.01` of that project was downloaded and counted: 409,568 term and reading pairs, of which 24,181 have more than one accent. Many entries carry `devoice` positions.

### License

The downloads page says: "Alle Daten stehen unter der Wörterbuch Lizenz" (all data is under the dictionary license). That page ([Wörterbuch Lizenz](https://www.wadoku.de/wiki/pages/viewpage.action?pageId=357)) names a double license: the [Wadoku.de-Daten Lizenz](https://www.wadoku.de/wiki/display/WAD/Wadoku.de-Daten+Lizenz), version 1.0 of 10 August 2011, and the original WaDoku-Datei-Lizenz of 20 March 2001. Both are custom texts in German. Neither is a Creative Commons license.

The 2011 license permits, in section 5.2:

- Unchanged copies, distributed together with the license, for no more than the cost of the medium.
- Copies "auf WWW- und ftp-Server" for further distribution, under the same conditions.
- "Auszüge und Untergruppen der Wadoku-Daten in anderen Formaten und Codierungen" (extracts and subsets in other formats), under the same conditions.

Section 5.3 permits distribution as part of software that is itself free of charge, if the software documentation carries a full statement of the data's origin.

Section 5.7 requires written permission, renewed every year, for everything else. It names software that is sold, web servers that charge fees or show commercial ads, print or CD-ROM publication, and shareware.

### Hosted copy

Yes, with conditions. A pitch extract in Yomitan format is an "extract in another format", and a release file is a copy on a web server. Michigo is free of charge and shows no ads. What the license asks:

- The license text travels with the file.
- Michigo's documentation states the origin of the data in full.
- Nobody charges for the file.

The license does not allow commercial use without permission. Michigo's code is MIT, so a fork could be sold. The Wadoku file would have to stay a separate download under its own license, never part of the MIT code.

### One contradiction

The GitHub repository [WaDoku/WaDokuJT-Data](https://github.com/WaDoku/WaDokuJT-Data) says in its README: "This work is licensed CC-BY-SA", with a link to version 3.0. Its last commit is from 2018. The site's download page names only the custom license. This research treats the site as binding for the XML dump, because the dump comes from the site.

## Open JTalk dictionary

Open JTalk is a speech synthesis system. Its site says it is "released under the Modified BSD license" and lists version 1.11 of 25 December 2018 for both the program and its dictionary ([open-jtalk.sourceforge.net](https://open-jtalk.sourceforge.net/)).

The dictionary folder `mecab-naist-jdic` was read in a GitHub mirror ([r9y9/open_jtalk](https://github.com/r9y9/open_jtalk/tree/master/src/mecab-naist-jdic)). Its `COPYING` file holds three BSD 3-clause notices: Nara Institute of Science and Technology (2009), the UniDic Consortium (2011 to 2017) and Nagoya Institute of Technology (2008 to 2016).

The lexicon `naist-jdic.csv` (54 MB, EUC-JP) ends each line with an accent value and a connection type. A sample line ends in `テプコ,テプコ,1/3,C1`: accent position 1 in a word of 3 morae, connection type `C1`.

A hosted copy is allowed under BSD 3-clause, with the three notices. The data uses IPADIC-style word units, not UniDic's. The entries were not counted and the accuracy was not checked.

## Kanjium

### What it is

[mifunetoshiro/kanjium](https://github.com/mifunetoshiro/kanjium) holds `data/source_files/raw/accents.txt`. The README describes it as "pitch accent mora locations for 124,137 words". The file has 124,137 lines (counted). Each line is spelling, reading and accent positions, separated by tabs:

```text
１０月	じゅうがつ	4,0
ああ		0
```

The reading is empty for words written in kana. The last change to the file is from June 2024.

This is the data behind the "Kanjium Pitch Accents" dictionary that Yomichan offered ([FooSoft/yomichan README](https://github.com/FooSoft/yomichan), built by [toasted-nutbread/yomichan-pitch-accent-dictionary](https://github.com/toasted-nutbread/yomichan-pitch-accent-dictionary), MIT script). That zip was downloaded and counted: 124,137 entries.

### License as stated

The README says: "Everything\* in this package is licensed under the Creative Commons Attribution-ShareAlike 4.0 International license" and "You are free to use or modify the data however you like (for commercial or non-commercial purposes)". `LICENSE.txt` is the CC BY-SA 4.0 legal code. The README asks for this credit or similar text: "The pitch accent notation, verb particle data, phonetics, homonyms and other additions or modifications to EDICT, KANJIDIC or KRADFILE were provided by Uros O. through his free database."

GitHub's license detection reports no known license for the repository, because `LICENSE.txt` does not match its template exactly.

### The origin is not disclosed

The README names sources for the other data (EDRDG, Tatoeba, Wadoku stroke order, Waller) but none for the accents. Asked for the source, the repository owner answered ([issue "Pitch Accent source information"](https://github.com/mifunetoshiro/kanjium/issues/13), 2020): "It's not listed due to potential copyright issues, but it's from 2-3 legitimate sources. It is free, enjoy."

In a second issue the owner said the credit line refers only to the notation: "only the CSS/arrow pitch accent notation was meant in that context" ([issue "Question regarding source of pitch accent data"](https://github.com/mifunetoshiro/kanjium/issues/15)). A third user wrote that the data looks like "a copy of 大辞林 2nd or 3rd ed. and some NHK 1998 data" ([issue "pitch accent; more of a question"](https://github.com/mifunetoshiro/kanjium/issues/24)). The owner did not confirm or deny this. An open pull request corrects entries against スーパー大辞林 and "various monolingual dictionaries".

### Hosted copy

By the license text: yes, with credit to Kanjium and the license kept (CC BY-SA 4.0, same duties as the other CC BY-SA sets in the hosted-copies research).

By origin: uncertain. A CC license only covers what the licensor has the right to license. The owner's own words point to sources he will not name for copyright reasons. Whether single accent numbers are protected at all is a legal question this research cannot answer. Many projects ship Kanjium data (the Yomichan dictionary above, several Anki add-ons), and no takedown was found, but none was searched for in depth.

Michigo would host this at its own risk. The lower-risk path is to leave Kanjium as an import: the learner downloads the zip and imports it.

## NHK accent dictionary

The current edition is NHK日本語発音アクセント新辞典, edited by NHK放送文化研究所 and published by NHK出版 in May 2016 ([National Diet Library record](https://ndlsearch.ndl.go.jp/en/books/R100000002-I027287742)). The previous edition is from 1998. It is sold as a book and as paid app content ([Monokakido](https://www.monokakido.jp/en/dictionaries/nhkaccent2/)).

No open license was found for either edition. Without one, all rights are reserved.

Files with NHK data circulate anyway. The Anki add-on [javdejong/nhk-pronunciation](https://github.com/javdejong/nhk-pronunciation) ships a 14 MB `ACCDB_unicode.csv` and has no license file. The list [MarvNC/yomitan-dictionaries](https://github.com/MarvNC/yomitan-dictionaries) names a "[Pitch] NHK2016" dictionary, and that repository has no license either.

Michigo cannot host this data. It stays import only: a learner who has such a zip can import it, and Michigo does not link to one.

## Wiktionary

English Wiktionary records Japanese pitch accent in the `acc=` parameter of its `ja-pron` template ([Template:ja-pron](https://en.wiktionary.org/wiki/Template:ja-pron)): the position of the accented mora, as in Japanese dictionaries. The `acc_ref=` parameter cites the source, and the documented references are the NHK dictionary of 1998, Shin Meikai Kokugo Jiten (5th edition) and Daijirin (3rd edition).

Wiktionary text is dual-licensed under CC BY-SA 4.0 and GFDL ([Wiktionary:Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)). A hosted extract is allowed with attribution and the same license.

No ready pitch dictionary built from Wiktionary was found. Yomitan's list of recommended dictionaries has an empty `pronunciation` list for Japanese ([recommended-dictionaries.json](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/data/recommended-dictionaries.json)). The number of Japanese entries with an accent was not counted.

## Other sources

### tdmelodic

[PKSHATechnology-Research/tdmelodic](https://github.com/PKSHATechnology-Research/tdmelodic) is BSD 3-clause. Its README calls it a module that "generates a large scale accent dictionary of Japanese (Tokyo dialect) using a neural network based technique". The output is a machine estimate, aimed at names and new words for speech synthesis. It is not a checked data set for learners.

### OJAD

OJAD (Online Japanese Accent Dictionary, University of Tokyo) is a website for learners and teachers. Its host `www.gavo.t.u-tokyo.ac.jp` did not resolve during this research, so its terms were not read. No data download is known.

### Commercial dictionaries

Daijirin, Shin Meikai and similar dictionaries mark accents and are sold under normal copyright. Yomitan conversions of them exist in the community. They are import only, like NHK.

## Hosted copy or import only

Hosted copy possible:

- UniDic CWJ 2025.12 accent fields. No separate file: the data is inside the tokenizer dictionary.
- Wadoku pitch extract, as a separate download with its license text and a statement of origin.
- Open JTalk `naist-jdic`, with its three BSD notices.

Hosted copy allowed by the stated license but with an open question:

- Kanjium, because the origin of the accents is undisclosed.
- A Wiktionary extract, which someone would first have to build.

Import only:

- NHK, Daijirin, Shin Meikai and any other publisher's dictionary.
- Any Yomitan pitch zip of unknown origin that the learner brings.

## Pitch dictionary format in a Yomitan zip

### Files

A Yomitan dictionary is a zip with `index.json` and data files at the root ([making-yomitan-dictionaries.md](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/docs/making-yomitan-dictionaries.md)). Pitch data lives in `term_meta_bank_N.json` files, the same files that hold frequency data. The schema is [dictionary-term-meta-bank-v3-schema.json](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/data/schemas/dictionary-term-meta-bank-v3-schema.json).

The two sample zips (Kanjium and Wadoku) have nothing in `index.json` that marks them as pitch dictionaries. A zip is a pitch dictionary because its meta bank rows have the mode `pitch`.

### Entry shape

Each file is a JSON array. Each row is an array of exactly three items: the term text, the mode, and the data. For pitch the mode is `"pitch"` and the data is an object with `reading` and `pitches`, both required.

```json
[
  ["10月", "pitch", { "reading": "じゅうがつ", "pitches": [{ "position": 4 }, { "position": 0 }] }],
  ["!", "pitch", { "reading": "えくすくらめーしょんまーく", "pitches": [{ "position": 10, "devoice": [2, 3] }] }],
  ["かさかさ", "pitch", { "reading": "かさかさ", "pitches": [{ "position": 1, "tags": ["adv"] }, { "position": 0, "tags": ["adj-na"] }] }]
]
```

Fields of one item in `pitches`, from the schema:

| Field | Type | Meaning |
| --- | --- | --- |
| `position` | integer, 0 or more | "Mora position of the pitch accent downstep. A value of 0 indicates that the word does not have a downstep (heiban)." |
| `position` | string of `H` and `L` | Pitch level of each mora, such as `HHLL`. One extra letter at the end sets the level of a following particle. |
| `nasal` | integer or list | Positions of morae with a nasal sound. |
| `devoice` | integer or list | Positions of morae with a devoiced sound. |
| `tags` | list of strings | Usually a part of speech that the accent applies to. |

Only `position` is required. The same file format also allows the modes `freq` and `ipa`.

### How an entry keys on a word

The key is the pair of term and reading. Yomitan first fetches all meta rows whose term equals a headword's term, then keeps a pitch row only when its reading equals the headword's reading ([translator.js, `_addTermMeta`](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/js/language/translator.js)):

```js
case 'pitch':
    {
        if (data.reading !== reading) { continue; }
```

Three consequences for Michigo:

- The comparison is exact. The reading in the pitch row must be in the same kana script as the reading Michigo looks up. Kanjium readings are mostly hiragana, with katakana for loanwords (`["Π", "pitch", {"reading": "パイ", …}]`). UniDic readings are katakana. Michigo should convert both sides to one script before it compares.
- A word written in kana has its own spelling as the reading. Kanjium's source leaves the reading empty for such words, and the Yomichan build fills in the term.
- One term can have several rows, one per reading, and one row can have several accents. Dictionaries can also repeat a pair, so Michigo should merge and remove duplicates.

## How Yomitan draws the pitch diagram

### From marker to function

The Anki marker `{pitch-accent-graphs}` is a Handlebars partial that walks all pitch accents of the entry and calls the `pronunciation` helper with `format='graph'` ([default-anki-field-templates.handlebars](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/data/templates/default-anki-field-templates.handlebars)). With more than one accent the output is an `<ol>` with one `<li>` per accent. With exactly one it is the bare diagram. With none it is empty.

The helper splits the reading into morae and calls `createPronunciationGraph(morae, position)` ([anki-template-renderer.js](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/js/templates/anki-template-renderer.js), [pronunciation-generator.js](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/js/display/pronunciation-generator.js)). The inputs are only the kana reading and the position. The spelling, `nasal` and `devoice` play no part in the graph.

### Splitting into morae

`getKanaMorae` walks the reading character by character. A small kana from the set `ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ` joins the mora before it. Every other character starts a new mora, including っ, ん and ー ([japanese.js](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/js/language/ja/japanese.js)).

### High or low per mora

`isMoraPitchHigh(index, position)` uses a zero-based mora index:

- Position 0 (heiban): the first mora is low, all later ones are high.
- Position 1 (atamadaka): the first mora is high, all later ones are low.
- Position n above 1: the first mora is low, morae 2 to n are high, the rest are low.
- A string position: the mora is high when the letter at that index is `H`.

The same function is asked about the index one past the last mora. That gives the pitch of a following particle: high for heiban, low otherwise.

### Geometry

For a word of N morae:

- The SVG has `viewBox="0 0 {50 × (N + 1)} 100"` and the class `pronunciation-graph`.
- Mora i (from 0) gets a point at x = 50i + 25, and y = 25 when high or 75 when low.
- A solid path joins the N mora points in order.
- Each mora point gets a filled circle of radius 15. The mora just before a drop (high, and the next is low) gets a hollow circle of radius 15 with a filled circle of radius 5 inside.
- The particle position gets a point at x = 50N + 25, drawn as a hollow triangle that points down (`M0 13 L15 -13 L-15 -13 Z`, moved to the point).
- A dashed path joins the last mora point to the particle point.

Styles for Anki come from [pronunciation-style.json](https://github.com/yomidevs/yomitan/blob/ce1b1bffa0e8819716317f3717932a7fe91e8d52/ext/data/pronunciation-style.json) and are written inline: the SVG is `display: inline-block; vertical-align: middle; height: 1.5em`, lines have `fill: none; stroke: currentColor; stroke-width: 5`, the tail line adds `stroke-dasharray: 5 5`, and filled shapes use `fill: currentColor`. Because the color is `currentColor`, the diagram follows the text color of the card. `data-` attributes are removed before the HTML goes to Anki.

### Worked example

こころ with position 2 has three morae: low, high, low. The particle is low. The values below follow from the rules above (computed by hand, not captured from Yomitan):

```html
<svg xmlns="http://www.w3.org/2000/svg" class="pronunciation-graph" viewBox="0 0 200 100" style="display:inline-block;vertical-align:middle;height:1.5em">
  <path d="M25 75 L75 25 L125 75" style="fill:none;stroke-width:5;stroke:currentColor" />
  <path d="M125 75 L175 75" style="fill:none;stroke-width:5;stroke:currentColor;stroke-dasharray:5 5" />
  <circle cx="25" cy="75" r="15" style="stroke-width:5;fill:currentColor;stroke:currentColor" />
  <circle cx="75" cy="25" r="15" style="fill:none;stroke-width:5;stroke:currentColor" />
  <circle cx="75" cy="25" r="5" style="fill:currentColor" />
  <circle cx="125" cy="75" r="15" style="stroke-width:5;fill:currentColor;stroke:currentColor" />
  <path d="M0 13 L15 -13 L-15 -13 Z" transform="translate(175,75)" style="fill:none;stroke-width:5;stroke:currentColor" />
</svg>
```

### The other pitch markers

The same partial serves the other markers with a different format:

- `{pitch-accents}` (`text`): the reading as one `<span>` per mora, with a line over the high morae and a drop mark. This format also shows `nasal` and `devoice`.
- `{pitch-accent-positions}` (`position`): the number in brackets, such as `[2]`.
- `{pitch-accent-graphs-jj}`: a second graph style taken from Jidoujisho, with the kana under the dots.
- `{pitch-accent-categories}`: a comma list of `heiban`, `atamadaka`, `nakadaka`, `odaka`, or `kifuku` for verbs and adjectives with a downstep.

### License of the drawing code

Yomitan is GPL-3.0 ([repository](https://github.com/yomidevs/yomitan)), and the file header says so. Michigo is MIT. Michigo should write its own function from the rules above and not copy Yomitan's source. The function is small: a mora splitter, the high or low rule and a few SVG elements.

## What this means for Michigo

- The decision in [How do Anki detection and card export work?](https://github.com/iuriioapps/michigo/issues/48) holds: an imported Yomitan pitch dictionary fills the pitch markers. The format is simple and stable.
- UniDic 2025.12 would give pitch data with no import at all. This is a new argument in the choice between UniDic 2.1.2 and 2025.12.
- If both sources exist, an order of priority is needed. A learner's imported dictionary is their explicit choice, so it should probably win over UniDic.
- A hosted Wadoku pitch file is possible under its license. It needs the license text, a statement of origin, and a place outside the MIT code.
- Michigo should not host NHK data, and hosting Kanjium is a risk decision for the owner.

## Not verified

- The share of UniDic 2025.12 entries with an `aType`, and how good the values are compared with NHK. A spike with real text would answer this.
- The source of UniDic's accent values. The manual does not name it.
- The field list of UniDic 2.1.2 was taken from Lindera's schema and the FAQ, not from NINJAL's own 2.1.2 package.
- The Wadoku XML structure (`<accent>`, `<hatsuon>`) is quoted from the converter's README. The dump was not opened.
- Whether Wadoku e.V. reads its license the same way for a pitch-only extract hosted by another project. Only Wadoku can confirm.
- Which sources Kanjium's accents come from. The owner does not say.
- OJAD's terms: the site did not resolve.
- NHK's position on the circulating data files. No statement by NHK was found or searched for in depth.
- The entry count and accuracy of the Open JTalk dictionary.
- The worked SVG example was computed by hand from the source code, not captured from a running Yomitan.
