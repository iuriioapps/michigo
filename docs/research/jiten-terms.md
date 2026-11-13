# What the Jiten site terms allow

Read on 2026-11-13. This answers [What do the Jiten site terms allow?](https://github.com/iuriioapps/michigo/issues/74). It builds on [Which licenses permit a hosted copy, and what do they ask?](https://github.com/iuriioapps/michigo/issues/66) and [Which word frequency data can Michigo ship?](https://github.com/iuriioapps/michigo/issues/35). It is a reading of the published texts, not legal advice. It reports evidence and options and chooses nothing.

## Short answer

Both paths are covered by Jiten's own published texts.

- A download from Jiten on the learner's machine is allowed. The terms permit automated access "through the documented API and within its published rate limits", and the frequency list download is a documented API endpoint.
- A hosted copy of the published lists is allowed by the license. Jiten's own guide calls the lists "free to download and free to redistribute under CC BY-SA 4.0", and the terms say that nothing in them restricts use of data obtained under that license.
- The ban on bulk extraction stays in force beside the license. No text says whether a copy of every published list counts as "a substantial part of the Corpus". No statement by the maintainer about a third-party hosted copy was found.

## How the sources were read

The pages on `jiten.moe` answer a plain `curl` with HTTP 418, so their text was read from the site's source in the Jiten repository at commit [`aa4d1d4`](https://github.com/Sirush/Jiten/tree/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4) (2026-11-12). The repository is the source of the live site. A fetch of the live [terms page](https://jiten.moe/terms) confirmed the same articles and the date 8 August 2026, but not word for word. The API host `api.jiten.moe` and `jiten.moe/robots.txt` were read live.

| Source | Live URL | Source file |
| --- | --- | --- |
| Terms of Use, version 2026-08-08 | https://jiten.moe/terms | [terms.vue](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/app/pages/terms.vue), [legalDocuments.ts](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/app/utils/legalDocuments.ts) |
| Guide "Can I use the API or scrape the site?" (updated 2026-08-08) | https://jiten.moe/guides/api-and-scraping | [api-and-scraping.md](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/content/guides/api-and-scraping.md) |
| Guide "Using the API" (updated 2026-10-08) | https://jiten.moe/guides/using-the-api | [using-the-api.md](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/content/guides/using-the-api.md) |
| Guide "What can I use the data for?" (updated 2026-07-28) | https://jiten.moe/guides/deck-licensing | [deck-licensing.md](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/content/guides/deck-licensing.md) |
| Guide "Install Jiten's frequency dictionaries in Yomitan" (updated 2026-07-28) | https://jiten.moe/guides/yomitan-frequency-dictionaries | [yomitan-frequency-dictionaries.md](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/content/guides/yomitan-frequency-dictionaries.md) |
| Frequency lists page | https://jiten.moe/frequency-dictionaries | [frequency-dictionaries.vue](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/app/pages/frequency-dictionaries.vue) |
| About page | https://jiten.moe/about | [about.vue](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/app/pages/about.vue) |
| Privacy policy | https://jiten.moe/privacy | [privacy.vue](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Web/app/pages/privacy.vue) |
| Download endpoints | https://api.jiten.moe | [FrequencyListController.cs](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Api/Controllers/FrequencyListController.cs) |
| Rate limits and scheduled jobs | none | [Program.cs](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Api/Program.cs) |

## License of the frequency data

The frequency lists are CC BY-SA 4.0. Four first-party texts say so, and none says anything else.

- Terms, article 6.1: "Derived Data published by Jiten, including study decks, vocabulary lists and frequency lists, is licensed under CC BY-SA 4.0. Within that licence, commercial use is permitted, subject to attribution and share-alike."
- Frequency lists page: "All frequency lists are licensed under CC BY-SA 4.0."
- Licensing guide: "Decks, frequency lists, and other derived statistical data are licensed under CC BY-SA 4.0."
- About page: "Every data derived by Jiten from that analysis including the decks, frequency lists and statistics, is published under CC BY-SA 4.0. You can use them in your own projects as long as you respect the licensing guide and the API terms."

The license does not cover everything on the site. The licensing guide says: "This does not cover example sentences or media text, which belong to their respective copyright holders." The frequency lists contain neither.

The code is a separate matter. The repository is Apache-2.0, and the about page says the source is "available on GitHub under the Apache 2.0 licence". Jiten is "built and run by a solo developer, Sirus", and the publisher named in the terms is "Jitensoft, entreprise individuelle".

The downloaded files carry no license notice. The Yomitan zip holds `index.json` and `term_meta_bank_1.json` only. `index.json` names `"author":"Jiten"` and `"url":"https://jiten.moe"` and has no license field. The CSV has only the header `Word,Form,Rank`. A copy that Michigo passes on must add the license and the credit itself.

## What the terms say about automated downloads

Automated access is allowed through the documented API, within its rate limits.

- Terms, article 5(b), forbids to "access the Service by automated means except through the documented API and within its published rate limits, or as expressly permitted by robots.txt".
- Terms, article 8.1: "The API is provided under these Terms, its published documentation and its published rate limits."
- API guide: "Jiten's API is public." It lists `/api/frequency-list/download` among the most used endpoints and says of them: "All of these are `GET` and all of them answer without a key."
- Scraping guide: "The API endpoints are publicly available and you're welcome to use them for personal projects, small-scale research, or tools that complement the learning experience."

The frequency list endpoint exists for exactly this use by another program. The controller carries the comment "DON'T TOUCH THIS / IT'S BEING USED BY THE YOMITAN EXTENSION". Yomitan's [recommended dictionaries file](https://github.com/yomidevs/yomitan/blob/master/ext/data/recommended-dictionaries.json) points at `https://api.jiten.moe/api/frequency-list/download?downloadType=yomitan`, so a third-party app already downloads the list from each user's machine.

An API key is not needed and would not fit. Article 5(e) forbids to "share, sell or transfer an Account or API key", so Michigo could not ship one key for all learners. The public endpoint works anonymously.

`robots.txt` adds nothing for this case. It governs paths on `jiten.moe` and has no rule for `/frequency-dictionaries`. `api.jiten.moe/robots.txt` returns 404.

## What the terms say about redistribution

Redistribution of a downloaded list is allowed by the license, and the terms say they do not narrow it.

- Yomitan guide: "Jiten publishes its own, built from the whole library and updated frequently, free to download and free to redistribute under CC BY-SA 4.0." This is the most direct sentence, and the earlier research had not found it.
- Terms, article 6.1: "Nothing in these Terms restricts what you may do with data you have lawfully obtained under that licence."
- Terms, article 6.2: "The restrictions in article 5 apply to access to the Service, not to use of licensed data. You may use a downloaded deck in a paid course. You may not resell access to Jiten itself, paywall a proxy of the API, or bulk-extract the Corpus in order to reconstitute it elsewhere."
- Scraping guide: "decks, vocabulary and frequency lists you download normally are CC BY-SA licensed, so using them commercially is fine with attribution and share-alike."
- Terms, article 8.4: "Attribution is required when publishing data obtained through the API, on the terms of the CC BY-SA 4.0 licence."

Three limits stay in force beside the license.

- Terms, article 5(c), forbids to "systematically extract, copy or reconstruct all or a substantial part of the Corpus, whether by scraping the interface, iterating the API, or otherwise". It adds that the restriction "is asserted under the sui generis database right" of French law "and is independent of the licences granted in article 6".
- Terms, article 5(d), forbids to "resell, sublicense, proxy, mirror, or provide paid access to the Service or the API, or operate a service whose substantial function is to relay Jiten's responses to third parties".
- Scraping guide: "please don't bulk-scrape, crawl, or systematically download the site's data". Its example is "dumping every deck's vocabulary to mirror the database or build a competing service".

The terms define the Corpus as "the database of Japanese media, vocabulary, statistics and derived data compiled by Jitensoft". The examples of forbidden use are all about the per-title data (every deck's vocabulary) and about relaying the API. A published frequency list is a summary file that Jiten offers as one download. Read together, the texts place a hosted copy of a downloaded list on the allowed side.

## What no text states

- No text says whether a copy of all 13 published lists together is "a substantial part of the Corpus". The terms give no number and no example for frequency lists.
- No statement by the maintainer about a third party that hosts the lists was found. A search of the repository's issues for license, redistribution, mirror and scraping found nothing. The project's Discord, where the guides send such questions, was not read.
- No text names a required wording for the credit. Only the CC BY-SA 4.0 rules apply.
- No text states an update schedule for the lists.
- No text offers a mirror, a bulk archive or a versioned snapshot of the lists.

## Download endpoints and limits

All endpoints are `GET` on `https://api.jiten.moe` and need no key. All were tested on 2026-11-13.

| Endpoint | Returns |
| --- | --- |
| `/api/frequency-list/download` | Global list. `downloadType` is `yomitan` (default, zip) or `csv`. |
| `/api/frequency-list/download?mediaType=<type>` | One list per media type, same formats. |
| `/api/frequency-list/index` and `/index?mediaType=<type>` | The Yomitan `index.json` of a list, 370 bytes, with its `revision`. |
| `/api/frequency-list/download-kanji` | Kanji list, zip or CSV. |
| `/api/frequency-list/index-kanji` | `index.json` of the kanji list. |

The media types in the code are `Anime`, `Drama`, `Movie`, `Novel`, `NonFiction`, `VideoGame`, `VisualNovel`, `WebNovel`, `Manga`, `Audio` and `YouTube`. With the global and the kanji list that makes 13 lists.

Measured sizes of the global list: the zip is 7,995,850 bytes (56 MB unpacked), the CSV is 16,538,434 bytes with 464,144 rows. The kanji CSV is 145,594 bytes.

### Rate limits

The API guide states: "120 requests per minute while anonymous or 300 requests per minute with an API key for ordinary endpoints, and 10 per minute or less for the heavy ones: deck downloads, frequency lists, the custom deck parser, and some others."

- The code agrees. The `download` policy is a sliding window of 60 seconds with 10 permits, keyed by client IP for anonymous calls.
- The two `download` endpoints carry that policy. The two `index` endpoints do not, so they fall under the ordinary limit.
- Over the limit, the API "returns a 429 with a `Retry-After` header".
- The limit is per IP, so each learner's machine has its own budget. A fetch of all 13 lists in one go would exceed 10 per minute and needs pacing.

### Stability of the API

- API guide: "While the endpoints are generally stable, they are not versioned and can change at any moment without notice."
- Scraping guide: "The API may change at any time without notice and is rate-limited."
- Terms, article 8.3: "Rate limits, quotas and endpoint availability may change. We will give reasonable notice of breaking changes where practicable."
- The responses carry no `ETag` and no `Last-Modified` header. The `revision` in the index is the only change marker.

## How often the data changes

No schedule is stated. The evidence points to frequent, irregular rebuilds.

- Yomitan guide: the lists are "updated frequently" and "rebuilt as the library grows". It advises users to check for updates "at least once a month".
- The live index on 2026-11-13 showed `"revision":"Jiten 26-11-13"`, and the files in the zip were dated 2026-11-13 00:39. The lists had been rebuilt that day.
- The revision is the build date in the form `yy-MM-dd`, set in [YomitanHelper.cs](https://github.com/Sirush/Jiten/blob/aa4d1d484e1e9a5ae8a092757f5f177bff128ac4/Jiten.Core/YomitanHelper.cs).
- In the code, the rebuild (`RecomputeFrequencies`) is not among the scheduled jobs. Only an admin endpoint starts it. So the interval depends on the maintainer and cannot be read from the code.

Ranks shift with every rebuild because the library grows. A copy is therefore a snapshot of one revision.

## What a contingency needs

The terms promise no availability.

- Terms, article 10.1: "The Service is provided \"as is\" and \"as available\". We do not warrant that it will be uninterrupted, error-free, or that Derived Data will be accurate or complete."
- Terms, article 10.2: "We may modify, suspend for maintenance, or discontinue parts of the Service. Where a discontinuation materially affects Users we will give reasonable public notice."
- Terms, article 4.2, promises that free features stay free, but 4.2(d) says the promise "applies to features, not to any particular quantity of storage, computation or bandwidth".
- The site is run by one developer, and the repository has no releases that hold the lists.

From these facts, a contingency has to deal with four cases.

- The site is down or gone: only a copy held outside Jiten helps. The license allows such a copy, with credit and share-alike.
- The endpoint or the format changes without notice: the download URL has to be changeable without a new app release, and a file that does not parse must not replace a good one.
- A 429 answer: the app has to honor `Retry-After` and pace several lists.
- A normal update: the `index` endpoint gives the revision at the cost of 370 bytes, so a full download is needed only when the revision changed.

A list that the learner already has keeps working offline in every case, because the file is self-contained.

## What each path asks of Michigo

### Download from Jiten on the learner's machine

- It uses the documented endpoint within the limit, as article 5(b) asks, and matches what Yomitan does.
- The learner's IP address reaches Jiten. The privacy policy says technical request logs "are kept for 30 days for security, abuse prevention and debugging, then deleted or reduced to anonymous aggregates".
- The app still shows data from Jiten, so the credit and the license notice belong in the app either way.
- It fails when the site is down, and it breaks when the unversioned API changes.

### Hosted copy in Michigo's GitHub release

- The license and the sentence "free to download and free to redistribute" cover it.
- The copy must name Jiten, link to `https://jiten.moe`, state CC BY-SA 4.0 with a link, and name the revision. The files carry none of this themselves.
- An unchanged file, or one only converted to another format, is not an adaptation under CC BY-SA 4.0 (see the earlier findings on hosted copies). A filtered or merged file is an adaptation, must say what changed, and stays CC BY-SA 4.0.
- The copy goes stale unless someone refreshes it. Jiten states no update duty, unlike the EDRDG licence.
- One open point remains: whether all 13 lists together touch article 5(c). A copy of the global list alone is the narrowest case.

### Both, with the hosted copy as fallback

- Nothing in the terms forbids the combination. It answers the contingency cases above at the cost of the duties of both paths.

### Ask the maintainer

- The guides invite the question: "If you're unsure whether your use case is okay, feel free to ask on Discord." The terms give `contact@jiten.moe`.
- An answer would close the one open point on article 5(c). It is not required by any text for a copy of a downloaded list.

## Not verified

- The live HTML of the `jiten.moe` pages was not read word for word. The quotes come from the repository source of those pages.
- The French version of the terms, which prevails "for consumers resident in France", was not compared with the English one.
- The project's Discord was not read.
- The update interval over time was not measured. Only one day's revision was seen.
