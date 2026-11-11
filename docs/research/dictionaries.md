# Dictionaries Michigo can ship or import

Research for issue #34. Checked on 2026-11-11 against primary sources. File sizes and counts come from the EDRDG files downloaded that day.

## Question

Which Japanese dictionaries can Michigo ship with the app, and which formats should it import when the user brings their own? This note reports options and evidence. It does not pick a default.

## Short answer

The only open, actively maintained Japanese dictionaries with stable entry IDs are the EDRDG files: JMdict (words), JMnedict (names) and KANJIDIC2 (kanji). All three are CC BY-SA 4.0. Everything else that is open (Jitendex, jmdict-simplified, jmdict-yomitan) is a repackaging of those files under the same license. Wiktionary is the one independent open source, with a different license and no stable IDs. For bring-your-own, the Yomitan zip format is the de facto standard, and it already carries JMdict sequence numbers when built from JMdict.

## Shippable dictionaries

| Dictionary | Content | License | Format | Size (gzip) | Entries | Stable ID |
| --- | --- | --- | --- | --- | --- | --- |
| JMdict / JMdict_e | Words, Japanese to English (JMdict_e) or many languages (JMdict) | CC BY-SA 4.0 | XML with DTD | 10.6 MB (JMdict_e) | 219,051 | `ent_seq` |
| JMnedict | Proper names (people, places, companies, works) | CC BY-SA 4.0 | XML with DTD | 12.4 MB | 743,690 | `ent_seq` |
| KANJIDIC2 | Kanji readings, meanings, grades, stroke counts | CC BY-SA 4.0, some fields third party | XML with DTD | 1.5 MB | 13,108 | The character itself |
| jmdict-simplified | JSON builds of the three above | CC BY-SA 4.0 (data), MIT (npm packages) | JSON | Varies | Same | Same as source |
| jmdict-yomitan | Yomitan builds of the three above, several languages | CC BY-SA 4.0 (data), MIT (code) | Yomitan zip | Varies | Same | JMdict `ent_seq` as sequence |
| Jitendex | Reformatted JMdict with extra notes | CC BY-SA 4.0 (data), AGPL-3.0 (build code) | Yomitan zip, MDict | Varies | Same | Not documented |
| Wiktionary via kaikki.org | Japanese entries from English Wiktionary | CC BY-SA 4.0 or GFDL | JSONL | 62 MB (ja extract) | Not stated | None |

### JMdict

JMdict is the EDRDG word dictionary. The source database is edited almost daily and the XML file is regenerated daily ([JMdict project page](https://www.edrdg.org/jmdict/j_jmdict.html)). `JMdict_e` holds only English glosses. The full `JMdict` file adds glosses in other languages. The XML is UTF-8 and validated by a DTD at the top of the file ([DTD](https://www.edrdg.org/jmdict/jmdict_dtd_h.html)).

### JMnedict

JMnedict is the names dictionary, the XML successor of ENAMDICT. Each entry has a name type such as surname, place, given name, company or work ([ENAMDICT/JMnedict doc](https://www.edrdg.org/enamdict/enamdict_doc.html)). It has been maintained in an online database since 2016. Its glosses are English only.

### KANJIDIC2

KANJIDIC2 is the kanji dictionary. Its key is the kanji character. Some fields (SKIP codes, Pinyin, Four Corner codes, Korean readings) are third-party material with their own copyright, and SKIP codes carry their own Creative Commons license ([EDRDG licence](https://www.edrdg.org/edrdg/licence.html)).

### Repackaged builds

jmdict-simplified converts the EDRDG XML to JSON and releases every Monday ([repo](https://github.com/scriptin/jmdict-simplified)). jmdict-yomitan builds Yomitan zips daily from JMdict with Yomitan Import, in English plus Dutch, French, German, Hungarian, Russian, Slovenian, Spanish and Swedish ([repo](https://github.com/yomidevs/jmdict-yomitan)). Jitendex is a reformatted JMdict, published monthly for Yomitan and MDict ([site](https://jitendex.org/), [repo](https://github.com/stephenmk/Jitendex)). None of them adds new lexical data under a different license, so shipping one of them carries the same duties as shipping JMdict.

### Wiktionary

kaikki.org publishes the wiktextract extraction of Wiktionary as JSONL, updated at least weekly, with a 62 MB gzip Japanese extract ([kaikki raw data](https://kaikki.org/dictionary/rawdata.html)). Wikimedia text is dual-licensed CC BY-SA 4.0 and GFDL. Reusers credit authors by linking to the source page, a stable copy, or a list of authors ([Wikimedia Terms of Use, sections 7.1 and 7.7](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use)). Entries have no stable numeric ID; they are keyed by page title.

## EDRDG license duties

All EDRDG files are under CC BY-SA 4.0 with extra conditions in the [EDRDG licence statement](https://www.edrdg.org/edrdg/licence.html). These apply to every shippable option above except Wiktionary.

### Attribution in the app

Software must acknowledge the use and source of the files in its documentation, publicity material and website. It must include or link to the documentation and license files. For apps, the acknowledgement goes on a separate screen reached from a menu; a mention on the launch screen is not enough. The EDRDG suggests linking to the [JMdict-EDICT project page](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) and the KANJIDIC project page.

### Regular updates

**The licence requires software that uses the files to have a procedure for regular updates.** It states that failing to keep versions up to date violates the licence. Web servers must update at least monthly. No interval is given for desktop apps. A dictionary frozen into an app release with no update path does not meet this condition.

### ShareAlike scope

Altered or derived versions of the data may only be distributed under the same or a compatible license. The licence states that software using the files does not have to be open source. Commercial use and selling bundled software are allowed. Users must not claim copyright over material from the files.

### Example sentences

The JMdict variants with examples include sentences from the Tanaka Corpus, maintained in Tatoeba. Tatoeba sentences default to CC BY 2.0 FR, with some under CC0 ([Tatoeba terms](https://tatoeba.org/en/terms_of_use)). That is a second attribution duty if Michigo ships examples.

## Entry identifiers

### JMdict and JMnedict ent_seq

The DTD defines `ent_seq` as "a unique numeric sequence number for each entry" ([DTD](https://www.edrdg.org/jmdict/jmdict_dtd_h.html)). There is no published stability policy. On the mailing list, Jim Breen said "the intention is that they stay the same, but the nature of the entry might change", and that deletions "are happening all the time" ([2011 thread](https://www.edrdg.org/jmdict_edict_list/2011/msg00009.html)). A developer counted 2,192 entries deleted between a 2015 file and early 2020, and noted that merges are no longer recorded in the file ([2020 thread](https://www.edrdg.org/jmdict_edict_list/2020/msg00003.html)).

So an `ent_seq` is not reassigned to a different word, but it can disappear when an entry is deleted or merged. Anything keyed by `ent_seq` (known words, Anki links) needs a path for IDs that vanish.

### Shared number space

In the 2026-11-11 files, JMdict `ent_seq` runs from 1000000 to 9999999 and JMnedict from 5000000 to 9999990. 7,305 numbers appear in both files. A sample (5000011, ２ちゃんねる) is the same entry in both, so the overlap is shared entries rather than collisions. A combined index still needs the source file in its key, or a rule for these duplicates.

### KANJIDIC2

The kanji character is the identifier. It does not change between releases.

### Other formats

Yomitan term entries carry an integer sequence; Yomitan Import sets it to the JMdict `ent_seq` and marks the dictionary as sequenced ([yomitan-import jmdict.go](https://github.com/yomidevs/yomitan-import/blob/master/jmdict.go)). Other Yomitan dictionaries may use any numbers or none. StarDict has no per-entry ID; entries are referenced by position in the sorted index ([StarDict format](https://github.com/huzheng001/stardict-3/blob/master/dict/doc/StarDictFileFormat)). Wiktionary has page titles only.

## Bring-your-own formats

### Yomitan zip

Yomitan is the browser pop-up dictionary that succeeded Yomichan. A dictionary is a zip with `index.json` and numbered JSON banks at the root: `term_bank_N.json`, `term_meta_bank_N.json` (frequency, pitch), `kanji_bank_N.json`, `kanji_meta_bank_N.json` and `tag_bank_N.json` ([format guide](https://github.com/yomidevs/yomitan/blob/master/docs/making-yomitan-dictionaries.md)). JSON schemas for every file live in [`ext/data/schemas`](https://github.com/yomidevs/yomitan/tree/master/ext/data/schemas).

`index.json` requires `title`, `revision` and `format` (1, 2 or 3). Optional fields include `sequenced`, `attribution`, `sourceLanguage`, `targetLanguage`, `frequencyMode`, and `isUpdatable` with `indexUrl` and `downloadUrl` for update checks ([index schema](https://github.com/yomidevs/yomitan/blob/master/ext/data/schemas/dictionary-index-schema.json)).

A v3 term is an array: expression, reading, definition tags, deinflection rules, score, glosses, sequence, term tags ([term bank schema](https://github.com/yomidevs/yomitan/blob/master/ext/data/schemas/dictionary-term-bank-v3-schema.json)). Glosses may be plain strings or structured content.

The format matters because the Yomitan community distributes almost every Japanese dictionary in it: the EDRDG builds, Jitendex, frequency lists (BCCWJ, JPDB) and user-converted commercial dictionaries ([Yomitan dictionaries list](https://yomitan.wiki/dictionaries/)). The `isUpdatable` fields also give a ready mechanism for the EDRDG update duty.

### EPWING

EPWING is the Japanese CD-ROM dictionary format used by commercial dictionaries such as Daijirin, Daijisen, Kojien and Kenkyusha. Most are proprietary ([Yomitan dictionaries list](https://yomitan.wiki/dictionaries/)). Yomitan Import converts JMdict, JMnedict, KANJIDIC2, Rikai SQLite and a fixed list of EPWING titles to Yomitan zips ([yomitan-import](https://github.com/yomidevs/yomitan-import)). Users who own EPWING dictionaries usually already have them as Yomitan zips.

### StarDict

StarDict is a file set: `.ifo` metadata, sorted `.idx` headword index, `.dict` or `.dict.dz` data and optional `.syn` synonyms ([format doc](https://github.com/huzheng001/stardict-3/blob/master/dict/doc/StarDictFileFormat)). It is openly documented but has no entry IDs and no reading field separate from the headword.

### MDict

MDict (`.mdx`, `.mdd`) has no official specification. The only description is reverse-engineered and warns it may be incomplete; files can be encrypted with Salsa20/8 keyed to a user ID ([writemdict format notes](https://github.com/zhansliu/writemdict/blob/master/fileformat.md)). Jitendex is published in it, but so is in Yomitan format.

## Open points

- The EDRDG licence gives no update interval for desktop apps. Asking the EDRDG directly would settle what "regular" means for Michigo.
- No source documents whether Jitendex keeps JMdict `ent_seq` as its Yomitan sequence. Inspecting a release zip would answer it.
- kaikki.org states no entry count for the Japanese extract.

## Recommendation

This section is a recommendation, not a finding. If Michigo ships a dictionary, the evidence leaves the EDRDG files as the only open option with stable IDs; whether to ship words, names, kanji or all three is a product choice. Key Michigo data on `ent_seq` plus source, and plan for deleted IDs. Treat the Yomitan zip as the first import format, because it covers the EDRDG data, Jitendex, frequency lists and converted EPWING dictionaries in one parser. StarDict and MDict can wait until a user asks.
