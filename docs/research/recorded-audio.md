# Recorded audio for Japanese words

Research for issue #54: which sources of recorded (human) Japanese word audio can Michigo use for playback and for Anki cards. Generated speech is covered separately in [tts.md](https://github.com/iuriioapps/michigo/blob/research/tts/docs/research/tts.md) and is not repeated here. Sources were checked on 2026-11-11. At most one test request was sent to each service.

## Summary

The sources split three ways. Some have a free license that allows storing and sharing (Wikimedia Commons, the Tofugu archive). Some allow personal use only and forbid automated access (JapanesePod101, Forvo's website, WaniKani's site content). One has no stated terms at all (Jisho).

| Source | Japanese size | Lookup key | Official API | Recording license | Store on a card | Sentences |
| --- | --- | --- | --- | --- | --- | --- |
| JapanesePod101 | Not published | Spelling and reading | No | All rights reserved | Personal, non-commercial only; automated access forbidden | Words |
| LanguagePod101 dictionary | Same catalog as above | Spelling, filtered by reading | No | All rights reserved | Same terms as above | Words |
| Jisho.org | Not published | Spelling and reading (HTML) | No | Not stated | Not stated | Words |
| Lingua Libre (on Commons) | 5,234 files | Spelling only | MediaWiki API | Per file (CC0, CC BY, CC BY-SA) | Yes, with attribution where required | Mostly words |
| Wiktionary / Commons `Ja-*.ogg` | About 260 files | Romaji file name | MediaWiki API | Per file | Yes, with attribution where required | Words |
| Tofugu / WaniKani archive (GitHub) | 6,355 MP3 files | Spelling and reading in the file name | No (static files) | CC BY-SA 4.0 | Yes, with attribution and share-alike | Words |
| WaniKani API | About 6,000 vocabulary | Subject characters | Yes, token per user | Tofugu copyright | Personal use; no for-profit tools | Words |
| Forvo API | 298,038 pronounced words | Spelling only | Yes, paid | Forvo terms | No: caching is forbidden | Words and phrases |
| Tatoeba | 6,420 recordings | Sentence id | Downloads, no API needed | Per recording; most have none | Only the 1,309 with a license | Sentences only |

## How Yomitan fetches audio

Yomitan (GPL-3.0) is the reference for what tools do today. Its downloader is [`ext/js/media/audio-downloader.js`](https://github.com/yomidevs/yomitan/blob/ee81f8dcf13e985bb4d7961009fb49a764b4d924/ext/js/media/audio-downloader.js) at commit `ee81f8d`.

### Built-in sources

The handlers are `jpod101`, `language-pod-101`, `jisho`, `lingua-libre`, `wiktionary`, two text to speech types, `custom` (a URL template) and `custom-json` (a URL that returns a list). For Japanese, `getRequiredAudioSourceList` adds `jpod101`, `language-pod-101` and `jisho` as fallbacks even when the user did not select them.

### What each handler sends

- `jpod101` builds `https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=…&kana=…` with no prior lookup. A missing word returns a placeholder clip, which Yomitan rejects by its SHA-256 (`ae6398b5…098906`).
- `language-pod-101` POSTs `post=dictionary_reference&match_type=exact&search_query=<term>` to `https://www.japanesepod101.com/learningcenter/reference/dictionary_post` and scrapes `<audio>` tags from the HTML, keeping rows whose `dc-vocab_kana` matches the reading.
- `jisho` GETs `https://jisho.org/search/<term>` and reads the element with id `audio_<term>:<reading>`.
- `lingua-libre` and `wiktionary` run a regex title search on the Commons API, then one `imageinfo` request per hit, all in parallel (`Promise.all`).

### The local audio server

The Yomitan project also points users to [local-audio-yomichan](https://github.com/yomidevs/local-audio-yomichan) (MIT code), an Anki add-on that serves audio on `127.0.0.1:5050` through the `custom-json` source. Its README says it adds "Forvo (select users), NHK 2016, and Shinmeikai 8" and covers "over 250,000 unique expressions". The audio itself is distributed by torrent (`local-yomichan-audio-collection-2023-06-11`), not by the rights holders. Those are commercial dictionary recordings and scraped Forvo files, so this is a user-supplied source with no license Michigo could rely on.

## JapanesePod101 and LanguagePod101

Both are run by Innovative Language Learning and share one dictionary and one audio CDN. A test request for 猫/ねこ to `audiomp3.php` returned `301` to `https://cdn.innovativelanguage.com/japanesepod101/learningcenter/audio/assets/93487.mp3`. The catalog size is not published. The local audio server notes that "JPod files were found to be mostly contained of literal duplicate files", so file counts overstate coverage.

### JapanesePod101 terms

The Terms of Use ("Last Updated: June 4, 2026", served from [`/theme/documents/terms_of_use.php`](https://www.japanesepod101.com/theme/documents/terms_of_use.php)) say:

- "Our Services are for your personal and non-commercial use."
- "you agree that you will not use the Services, or duplicate, download, publish, modify, or otherwise distribute or use any material on the Services for any purpose, except for your personal, non-commercial use."
- "You also agree that you will not link to any page on the Services other than the home page (for example, “deep linking”), without Company’s prior written consent."
- Users may not "use automated queries or scripts (including, without limitation, by screen or database scraping, spiders, robots, crawlers or any other automated activity with the purpose of obtaining information from the Services and/or the Content) without Company’s prior express written permission".
- "You also agree not to access the Services through any means other than publicly documented interfaces provided by Company".
- On termination, "you must cease all use of the Services and delete all copies of any lessons, audio, PDFs, or other downloads obtained from the Services."

**Without written permission, a tool that fetches JapanesePod101 audio automatically conflicts with the automated-access and documented-interfaces clauses, even for personal use.** Neither endpoint Yomitan uses is a documented interface. A user's private deck may fall under "personal, non-commercial use"; a shared deck does not. No rate limit is published; `robots.txt` does not block `/learningcenter/` or the asset host.

## Jisho.org

Jisho shows audio for common words. The test page for 猫 contained `<audio id="audio_猫:ねこ">` with MP3 and OGG sources on `d1vjc5dkcd3yh2.cloudfront.net`. Lookup is by spelling, and the element id carries spelling and reading.

The [about page](https://jisho.org/about) says "Audio files are graciously provided by Tofugu's excellent kanji learning site WaniKani." It states licenses for JMdict, Tatoeba, KanjiVG and others, but none for the audio, and Jisho publishes no terms of use. There is no official API for audio. `robots.txt` sets `Crawl-delay: 40` for all agents. Whether Jisho's files are the same recordings as the CC BY-SA Tofugu archive below was not checked.

## Wikimedia Commons, Lingua Libre and Wiktionary

Wiktionary does not host audio; its pronunciation files live on Wikimedia Commons. Lingua Libre is a recording tool that uploads to Commons. All three are reached through the same MediaWiki API at `commons.wikimedia.org/w/api.php`.

### Size and lookup

- `Category:Lingua Libre pronunciation-jpn` has 5,234 files. Names follow `LL-Q5287 (jpn)-<speaker>-<word>.wav`, so lookup is by spelling only, in whatever script the recorder typed. Test: `猫` returned one file, `LL-Q5287 (jpn)-葵心-猫.wav`.
- Wiktionary-style Japanese files use romaji: `File:Ja-hito.ogg`, `File:Ja-neko.ogg`. A title search for `^Ja-.*\.ogg` reports 260 hits. Yomitan's `wiktionary` handler searches for `ja-<term>.ogg` with the term in Japanese script, and the test for 猫 returned 0 hits, so that handler finds little for Japanese.
- `Category:Japanese pronunciation` has 248 files directly and 12 subcategories, including `Category:Japanese vocabulary pronunciation from WaniKani and Tofugu` (116 files).

### License

Each file carries its own license, and it differs between files. `imageinfo` with `iiprop=extmetadata` returns it:

| File | `LicenseShortName` | `AttributionRequired` |
| --- | --- | --- |
| `LL-Q5287 (jpn)-葵心-猫.wav` | CC0 | false |
| `Ja-hito.ogg` | CC BY-SA 4.0 (Artist: Tofugu and WaniKani) | true |
| `Ja-ii-good.ogg` | Public domain | false |

Michigo would have to read `LicenseShortName`, `Artist` and `AttributionRequired` per file and keep them with the clip. All the licenses seen allow storing the file and putting it on a shared card; CC BY and CC BY-SA need a credit, and CC BY-SA needs the deck's derived material to stay under the same license.

### Fetching rules

- The [User-Agent policy](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy): "Wikimedia sites require a HTTP User-Agent header for all requests." Requests with "an empty or generic one" fail with HTTP 403. The recommended form is `Name/version (contact URL or email) library/version`. Node's `fetch` sends a generic one by default, so Michigo must set its own.
- [Rate limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits): 10 requests per minute for "Requests with no identifying characteristics other than IP address", 200 per minute for "Unauthenticated bot requests with a compliant User-Agent header".
- [API etiquette](https://www.mediawiki.org/wiki/API:Etiquette): "Making your requests in series rather than in parallel". Yomitan's parallel `imageinfo` calls do not follow this.

## Tofugu and WaniKani

### The CC BY-SA archive

[tofugu/japanese-vocabulary-pronunciation-audio](https://github.com/tofugu/japanese-vocabulary-pronunciation-audio) is licensed CC-BY-SA-4.0 (GitHub license detection and the `LICENSE` file, "Attribution-ShareAlike 4.0 International"). The README: "This is mainly old vocabulary pronunciation audio from WaniKani. These are no longer available on WaniKani as they have been replaced with newer recordings." It describes two voices, a professional Tokyo-accent male and an amateur Kansai-accent female, and asks: "Please attribute to Tofugu and WaniKani per the LICENSE."

The tree has 6,355 files under `lib/mp3/` plus OGG copies. File names carry spelling and reading, for example `〜人【にん】.mp3`, so lookup by both is a file name match. The last push was in 2019. This is the only source found that can be bundled or downloaded once and shipped, with no runtime requests at all.

### The WaniKani API

The [API v2 docs](https://docs.api.wanikani.com/20170710/) list `pronunciation_audios` on vocabulary subjects, each with a `url`, `content_type` (`audio/mpeg`, `audio/ogg`, `audio/webm`) and `metadata` (`voice_actor_name`, `gender`, `voice_description`, `pronunciation` in kana). The homepage claims "6,000 vocabulary words".

- Every request needs a personal API token: "The token has to be included with every request."
- Rate limit: "Requests per minute 60".
- Free accounts are limited: `max_level_granted` is 3 or 60, and the docs say paid subscriptions "grant access to all the content past level three".
- On reuse: "Once you start building tools that can be used by other people, things change, though. First, you can't use the content to build anything that's for profit. Second, you need to respect the limitations put in place by the subscriptions."
- The [Terms](https://www.wanikani.com/terms) (effective May 25, 2023) say "You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service ... without Tofugu’s express written permission."

So this works only for users who already have a WaniKani account, and current recordings stay under Tofugu's copyright. Michigo is not for profit, but the terms do not say whether storing the clips on a shared deck is allowed.

## Forvo

The Japanese page lists "PRONOUNCED WORDS 298,038" from 27,088 speakers in Forvo. Lookup is by spelling only (`word` plus `language=ja`); there is no reading parameter. Forvo also holds phrases.

### API plans

The [plans page](https://api.forvo.com/plans-and-pricing/) lists Non-Profit at $2.00 a month for 500 requests a day with commercial use "Not Allowed", Small Business at $28.95 for 10,000 a day, and Corporate by contact for 100,000 a day. There is no free plan.

### Forvo terms

The [API general information](https://api.forvo.com/documentation/general-information/) page says:

- "Attribution, non-commercial and share-alike, except for the commercial plans."
- "Your application will only use one API key. You can't create different ones for getting more requests or even encourage end users to get their own API keys. This is forbidden."
- "When you generate an audio link using Forvo API it's valid during the next 2 hours."
- "Important: It is not allowed to cache audio pronunciations."
- "A "request" is also counted for every play of an audio file from your application to Forvo."

**The no-cache rule rules out Forvo for Anki cards, which need a stored file.** The one-key rule means an open source app cannot ship a key (it would be public) and cannot ask each user for one either. The site [terms](https://forvo.com/terms-and-conditions/) add that users "may only use it for academic or personal and non-commercial purposes" with "a maximum daily volume of 500 requests per User", and "Users may use the pronunciations and translations made available on Forvo within the legal limits established, but not for commercial purposes."

## Tatoeba (sentences)

Tatoeba is the only source here built for sentences. The per-language export [`jpn_sentences_with_audio.tsv.bz2`](https://downloads.tatoeba.org/exports/per_language/jpn/) lists 6,420 Japanese recordings for 6,332 sentences. By license: 5,111 have an empty license field, 1,282 are CC BY-NC 4.0 and 27 are CC BY 4.0.

The [downloads page](https://tatoeba.org/en/downloads) says "The license covering an audio file is chosen by the contributor" and "If the license field is empty, you may not reuse the audio outside the Tatoeba project." A clip is fetched by id from `https://tatoeba.org/audio/download/<audio id>`. So only 1,309 Japanese clips can go on a card, and 1,282 of those are non-commercial.

## Getting a clip onto an Anki card

Every source that allows storage produces a plain file (MP3, OGG, WAV or WebM), which goes into `collection.media` and is referenced as `[sound:…]`, as described in the TTS research. Two things differ from generated speech:

- The credit has to travel with the clip. For CC BY and CC BY-SA, the speaker or source and the license should be stored in a card field, not only in Michigo's cache.
- WAV from Lingua Libre is large; converting to MP3 or Opus is a modification, which CC BY-SA allows as long as the result stays CC BY-SA.

## Not verified

- The size of the JapanesePod101 catalog, and whether JapanesePod101 grants permission to open source tools on request.
- Whether Jisho's audio files are the same recordings as the CC BY-SA Tofugu archive, and under what terms Tofugu gave them to Jisho.
- Whether storing current WaniKani API audio on a shared deck is allowed; the terms do not address it.
- How many distinct words the 6,355 Tofugu files cover after removing duplicate voices.
- Mozilla Common Voice and other crowd-sourced sentence corpora were not checked.
- Audio quality was not listened to for any source.

## Recommendation

This section is a recommendation, not a finding.

Wikimedia Commons (Lingua Libre plus the `Ja-*` files) and the Tofugu CC BY-SA archive are the only sources whose terms clearly allow fetching from Node, storing, and putting the clip on a shared card. Together they cover roughly 11,000 files, far fewer than JapanesePod101 or Forvo. JapanesePod101 has the coverage learners expect from Yomitan, but its terms forbid automated access without written permission; asking Innovative Language for that permission is the way to find out whether it can be offered. Forvo is not usable for cards. If coverage matters more than terms, the honest middle ground is a `custom` URL source that the user configures themselves, as Yomitan does, so Michigo itself ships no third-party endpoint.
