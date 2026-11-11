# JLPT vocabulary and grammar lists Michigo can ship

Research for issue #36. Checked on 2026-11-11. This is not legal advice.

## Question

Which JLPT vocabulary lists and grammar pattern lists (N5 to N1) can Michigo ship? For each list: origin, quality, size per level, data format, license and redistribution terms. For grammar, also whether the list gives machine-usable patterns or only prose.

## Short answer

Every open JLPT vocabulary list traces back to one source: Jonathan Waller's lists on tanos.co.uk, licensed CC BY. Michigo can ship them with attribution. The cleanest packaging is a derivative that already maps each word to a JMdict entry ID (CC BY-SA 4.0).

For grammar, the open lists are prose labels or prose explanations. Only one open dataset found gives machine-usable token patterns (Kaidoku, MIT), and it covers N5 to N3 only, is weeks old and targets IPADIC part-of-speech tags.

## Background: there is no official list

The pre-2010 JLPT published "Test Content Specifications" (出題基準) with vocabulary, kanji and grammar lists. The current test does not. The official FAQ ([jlpt.jp FAQ, entry "Why is 'Test Content Specifications' no longer available after the 2010 revision of the JLPT?"](https://www.jlpt.jp/e/faq/#anchor28)) says the organizers "decided that publishing 'Test Content Specifications' containing a list of vocabulary, kanji and grammar items was not necessarily appropriate". It points to the "Summary of Linguistic Competence Required for Each Level" and sample questions instead.

So every N5 to N1 list is an unofficial estimate. Several of the sources below say so in their own docs.

## Vocabulary lists

### Waller (tanos.co.uk), the root source

Origin: compiled by Jonathan Waller around 2010 for the new five-level test. His site maps the new levels to the old ones ([tanos.co.uk/jlpt/aboutjlpt](https://www.tanos.co.uk/jlpt/aboutjlpt/), via a Wayback Machine capture because the domain did not resolve from here): N5 equals old level 4, N4 equals old level 3, N3 sits halfway between old 3 and 2, N2 equals old 2, N1 equals old 1. The Wikibooks copy of his grammar list says it "was compiled by Jonathan Waller" ([Wikibooks JLPT Guide N5 Grammar](https://en.wikibooks.org/wiki/JLPT_Guide/JLPT_N5_Grammar)).

License: the "Use my data!" page ([tanos.co.uk/jlpt/sharing](https://www.tanos.co.uk/jlpt/sharing/), Wayback capture) says: "Everything on this site (that I'm not selling), is licenced under Creative Commons "BY". Basically this means... use anything here however you like (commercial or non-commercial), but credit my site." The page names no CC version.

Formats: per level, `.doc`, `.pdf`, `.anki` and `.mem` files, plus an HTML table (kanji, hiragana, English) ([tanos.co.uk/jlpt/skills/vocab](https://www.tanos.co.uk/jlpt/skills/vocab/), Wayback capture). No CSV or JSON from Waller himself.

Quality: no updates since the early 2010s. Some spellings are rare forms, for example 明い for 明るい on the N5 page. The maintainer of yomitan-jlpt-vocab reports that "more than one word from Waller's N1 list appeared in vocabulary section of the N2 exam in December 2021" ([yomitan-jlpt-vocab README](https://github.com/stephenmk/yomitan-jlpt-vocab)). Despite that, it is the de facto standard: Jisho states "JLPT data comes from Jonathan Waller's JLPT Resources page" ([jisho.org/about](https://jisho.org/about)).

Availability risk: tanos.co.uk did not resolve in DNS during this research. All tanos pages above were read through Wayback Machine captures from 2020 and 2025. Michigo should vendor a snapshot rather than fetch at build time.

### yomitan-jlpt-vocab (Waller plus JMdict IDs)

Origin: [stephenmk/yomitan-jlpt-vocab](https://github.com/stephenmk/yomitan-jlpt-vocab). Takes Waller's lists and adds a JMdict entry ID to each word. The author checked spellings against JMdict and replaced rare ones (歯磨 to 歯磨き, 逆上る to 遡る, 火燵 to 炬燵).

License: CC BY-SA 4.0 (`LICENSE.txt`), with Waller credited under CC BY.

Format: `original_data/n1.csv` to `n5.csv` with columns `jmdict_seq,kana,kanji,waller_definition`, plus a Yomitan dictionary build.

Size per level (data rows in the CSVs):

| Level | Words |
| ----- | ----- |
| N5    | 684   |
| N4    | 640   |
| N3    | 1,730 |
| N2    | 1,812 |
| N1    | 3,427 |

Quality: the author says the lists are "essentially an educated guess" and that he made "no attempt to curate them further" beyond the spelling fixes.

The JMdict ID column matters for Michigo: it lets a tokenizer that resolves words to JMdict entries look up the level directly, without matching on surface strings.

### OpenJLPT (Waller plus JMdict, KANJIDIC2, Tatoeba)

Origin: [evanclan/OpenJLPT](https://github.com/evanclan/OpenJLPT), created 2026-07-01, about 70 stars. Word and kanji levels "come from Jonathan Waller's lists". Adds JMdict IDs, part of speech, Tatoeba examples. A scheduled job rebuilds from upstream monthly.

License: CC BY-SA 4.0 for dataset and code. `NOTICE.md` lists each upstream source and its license, and states the required attribution line.

Format: JSON, CSV and SQLite.

Size per level (README): N5 674, N4 630, N3 1,659, N2 1,778, N1 3,070 words (7,811 total). "Each word appears once, at the easiest level that lists it", so totals are lower than the raw Waller lists.

### Other Waller conversions

| Repo | Format | Repo license | Note |
| --- | --- | --- | --- |
| [jamsinclair/open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) | CSV per level, Anki decks | MIT | Data from chyyran/jlpt-anki-decks, "based on decks from tanos.co.uk" |
| [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) | CSV per level and combined | MIT | Fork of open-anki-jlpt-decks |
| [Bluskyo/JLPT_Vocabulary](https://github.com/Bluskyo/JLPT_Vocabulary) | JSON and CSV | MIT | Parsed from Waller's files; credits Waller CC BY |

A repo-level MIT label does not remove the CC BY attribution owed to Waller for the data. None of these adds JMdict IDs.

### KANJIDIC2 JLPT field (not usable)

KANJIDIC2 has a `jlpt` field, but it refers to the old four-level test. OpenJLPT's `NOTICE.md` notes this and does not use it for level assignment. It is kanji only, not vocabulary.

## Grammar lists

### Waller grammar lists

License: CC BY, same site-wide statement as the vocabulary.

Format: per-level HTML index, `.doc` and `.pdf` ([tanos.co.uk/jlpt/skills/grammar](https://www.tanos.co.uk/jlpt/skills/grammar/), Wayback capture). Each item links to example sentences on the site.

Size per level (unique grammar IDs on the 2020 Wayback captures of the per-level index pages):

| Level | Points |
| ----- | ------ |
| N5    | 40     |
| N4    | 50     |
| N3    | 63     |
| N2    | 63     |
| N1    | 71     |

Machine usability: none. Items are short labels such as `～のなかで～がいちばん～`, `stem +たいです` and `～く/ ～になる`. They mix placeholders, English and polite endings, so they cannot be matched against text without hand-writing a rule per item.

The [Wikibooks JLPT Guide](https://en.wikibooks.org/wiki/JLPT_Guide) republishes these lists (CC BY-SA 4.0) with added prose. The N5 page lists the same 40 points in the same order.

### hanabira.org grammar JSON

Origin: [tristcoil/hanabira.org-japanese-content](https://github.com/tristcoil/hanabira.org-japanese-content), the content repo of the hanabira.org learning site. Grammar is in-house content; the README does not name a JLPT source for the levels.

License: README says CC BY 4.0, and "When using this content, you must provide attribution and include a link to https://hanabira.org." GitHub reports the license as `NOASSERTION` (no recognized license file).

Format: `grammar_json/grammar_ja_N5_full_alphabetical_0001.json` and so on. Fields: `title`, `short_explanation`, `long_explanation`, `formation`, `examples` (`jp`, `romaji`, `en`).

Size per level (array lengths): N5 136, N4 124, N3 132, N2 191, N1 245 (828 total).

Machine usability: prose only. `formation` reads like `Noun + が + いちばん + Adjective/Verb`.

### OpenJLPT grammar

License: CC BY-SA 4.0. Authored for the project; levels "follow the consensus of common JLPT preparation materials". The README does not say who wrote the entries or how.

Format: `data/json/grammar/n5.json` to `n1.json`. Fields: `id`, `pattern`, `romaji`, `level`, `meaning`, `formation`, `examples` (`ja`, `furigana`, `en`), `tags`, `notes`. Stable `id` slugs (for example `wa`, `ga-subject`) are useful as keys.

Size per level (README): N5 81, N4 98, N3 101, N2 123, N1 123 (526 total).

Machine usability: prose. `pattern` is a display label (`〜は`) and `formation` is prose (`Noun + は`).

### japanese-language-data grammar

Origin: [jkindrix/japanese-language-data](https://github.com/jkindrix/japanese-language-data), created 2026-04, last push 2026-04-14. 595 grammar points in `data/grammar/grammar.json`, with patterns, examples, formality and JLPT level.

License: CC BY-SA 4.0 per the README (GitHub reports `NOASSERTION`).

Quality: the README states "Every grammar entry remains `review_status: draft`" and that the grammar is "explicitly not reviewed by native-speaker linguists". I did not inspect the pattern field format.

### Kaidoku rules (machine-usable, N5 to N3)

Origin: [froxily/kaidoku](https://github.com/froxily/kaidoku), created 2026-10-24, zero stars, one author. A Java service that runs "341 hand-written JSON grammar rules over the token stream" from Kuromoji (IPADIC).

License: MIT, covering the rule files in `src/main/resources/patterns/`.

Size: 341 rules (36 N5, 118 N4, 187 N3). Checklist is the Wikibooks JLPT Guide lists, so levels come from Waller. Basic particles (は, を, に and so on) are left out on purpose. No N2 or N1.

Machine usability: yes. Each rule has `steps` made of token constraints (`surface`, `baseForm`, `pos`, `pos2`, `conjForm`), with `anyOf` alternatives, bounded gaps, `subsumes`, `examples` and `counterExamples`. The README reports 0.992 precision and 0.989 recall on 655 regression sentences for the first 199 rules.

Caveat: the constraints use IPADIC part-of-speech and conjugation names (`接続助詞`, `仮定形`, `連用テ接続`). They would need translation for UniDic-based tokenizers such as Sudachi or fugashi with UniDic.

### Sources not usable or not verified

Bunpro, JLPT Sensei and similar study sites publish grammar for their own apps. I found no open license on them and did not check their terms in detail. Treat as not shippable.

Academic function-expression resources look machine-usable but their redistribution terms were not found:

- つつじ (Tsutsuji) dictionary of function expressions: about 17,000 surface forms with meaning labels ([NLP2011 paper P2-5](https://www.anlp.jp/proceedings/annual_meeting/2011/pdf_dir/P2-5.pdf)). License not found.
- はごろも (Hagoromo) function-word example database: 1,848 entries drawn partly from the old 出題基準, so its levels follow the old four-level test ([CiNii record](https://cir.nii.ac.jp/crid/1390001205781434752)). License not found.

## License implications for Michigo

Michigo's code is MIT. Shipping CC BY or CC BY-SA data next to MIT code is common: the data files keep their own license, and the code stays MIT. ShareAlike applies to the data Michigo redistributes and to modified versions of it, not to the app code that reads it (OpenJLPT and japanese-language-data both state this reading in their READMEs).

Obligations by source:

| Source | License | What Michigo must do |
| --- | --- | --- |
| Waller lists | CC BY (no version given) | Credit Waller and link tanos.co.uk |
| yomitan-jlpt-vocab | CC BY-SA 4.0 | Credit, link license, keep modified copies CC BY-SA |
| OpenJLPT | CC BY-SA 4.0 | Credit OpenJLPT and its upstreams per `NOTICE.md`, keep CC BY-SA |
| hanabira grammar | CC BY 4.0 plus requested link | Credit and link hanabira.org |
| Kaidoku rules | MIT | Keep the copyright notice |
| JMdict (if bundled) | CC BY-SA 4.0 | Acknowledge in docs and an About screen, ship or link the license, and have a regular update procedure ([EDRDG licence](https://www.edrdg.org/edrdg/licence.html)) |

The EDRDG monthly update rule is stated for web dictionary servers. For other software it asks only for "a procedure for regularly updating" the data.

## Recommendation

This section is a recommendation, not a finding.

For vocabulary, vendor a snapshot of yomitan-jlpt-vocab (or OpenJLPT, if its deduplicated "easiest level" rule is wanted). Both are Waller plus JMdict IDs under CC BY-SA 4.0. Keep the source CSVs in the repo so a future list can replace them.

For grammar, no option covers N5 to N1 with machine-usable patterns. Two paths:

- Port Kaidoku's MIT rules for N5 to N3 and write N2 and N1 rules in the same shape, using Waller or OpenJLPT labels as the checklist.
- Ship prose labels only (Waller or OpenJLPT) and defer grammar detection.

Either way, label every level in the UI as an estimate, since no official list exists.
