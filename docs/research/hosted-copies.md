# Which licenses permit a hosted copy, and what do they ask?

Read on 2026-11-13 from the license pages of each publisher. This is a reading of the license texts, not legal advice.

Every data set that the earlier research marked as shippable also permits a copy on Michigo's own hosting. Hosting is redistribution, and each license grants it. Two points need care: the update duty for the EDRDG files and the Jiten terms of service.

## Summary

| Data | License | Hosted copy | What it asks |
| --- | --- | --- | --- |
| UniDic 2025.12 (tokenizer dictionary) | GPL v2, LGPL v2.1 or modified BSD, at the user's choice | Yes, under BSD | Copyright notice, conditions and disclaimer with the download. No use of the consortium's name for promotion. |
| JMdict, JMnedict | CC BY-SA 4.0 plus the EDRDG licence | Yes | Credit on an About screen, in docs and on the website. License copy or link. A procedure for regular updates. |
| KANJIDIC2 | CC BY-SA 4.0 plus the EDRDG licence | Yes | The same as JMdict, plus credit to Jack Halpern for the SKIP codes. |
| Jitendex, jmdict-yomitan, jmdict-simplified | CC BY-SA 4.0 (data), EDRDG licence applies | Yes | The same as JMdict, plus credit to the repackager. |
| Jiten frequency lists | CC BY-SA 4.0 | Yes by the license, unclear by the site terms | Attribution and share-alike. The terms forbid a mirror of the service. |
| JMdict priority tags | Part of JMdict | Yes | Covered by JMdict. |
| wordfreq (Japanese) | CC BY-SA 4.0 (data) | Yes | License and attribution must travel with the data. Credits for its sources. |
| JLPT vocabulary (yomitan-jlpt-vocab) | CC BY-SA 4.0, from Waller's CC BY lists | Yes | Credit to Jonathan Waller and to the repository. |
| Tofugu audio archive | CC BY-SA 4.0 | Yes | Credit to Tofugu and WaniKani. Voice rights are not part of the license. |
| Wikimedia Commons audio | Per file | Per file | Read the license of each file. Not suited to one hosted archive. |

## What CC BY-SA 4.0 asks of a hosted copy

Most of the data is CC BY-SA 4.0, so these rules apply to almost every row.

- An unchanged copy needs the creator's name, the copyright notice, a notice of the license with its text or link, and a link to the source where practicable (section 3(a)(1)). Any reasonable manner is enough (section 3(a)(2)).
- A change of file format alone is not an adaptation. Section 2(a)(4) permits "technical modifications" for other formats and says they "never" produce Adapted Material.
- A file that Michigo filters, merges or restructures is likely Adapted Material. It must carry CC BY-SA 4.0 or a compatible license, and Michigo must say that it changed the data (section 3(b)).
- Michigo may not add terms or technical locks that restrict what the learner does with the data (section 2(a)(5)(C)).
- Share-alike covers the data files. It does not reach Michigo's code.

## UniDic

- The 2025.12 package states its license in its own README: GPL v2.0, LGPL v2.1 or modified BSD. The NINJAL FAQ says that the user may apply any one of the three.
- Under BSD, a build in Lindera's format is a redistribution in binary form. It must reproduce the copyright notice, the conditions and the disclaimer "in the documentation and/or other materials provided with the distribution".
- The copyright line on the NINJAL license page is "Copyright (c) 2011-2021, The UniDic Consortium".
- The FAQ asks software that uses UniDic to package the license files (BSD and AUTHORS). The 2025.12 package has no AUTHORS file. Its README names NINJAL as the copyright holder.
- The name of the consortium may not promote a product without written permission.
- NINJAL asks for a citation in published research. That is a request, not a condition.
- The FAQ also mentions UniDic variants under CC BY-NC-SA. Its only example is a historical dictionary. The 2025.12 written-language package is under the triple license.

## EDRDG files: JMdict, JMnedict, KANJIDIC2

The EDRDG licence applies on top of CC BY-SA 4.0, and it covers "any data files which are derived from them".

- Redistribution is allowed, with no limit on commercial use and no demand that the software be open source.
- An app must name the files and their source in its documentation and on its website, and on a separate screen such as About. A line on a start screen is not enough.
- An app must provide the documentation and license files, or links to them.
- The licence page says nothing about mirrors, hot-links or server load.

### The update duty

The licence says: "there must be a procedure for regular updating of the data from the most recent versions available". It gives one example: dictionary web servers "should update their dictionary versions at least once a month". It names no interval for a desktop app. It also says that failure to keep versions current "is a violation of the licence".

**A hosted copy that Michigo never refreshes breaks this term.** EDRDG generates new JMdict files daily. A hosted copy needs a scheduled rebuild, and the app needs a way to fetch the newer file.

### SKIP codes in KANJIDIC2

The EDRDG licence says that the SKIP codes are "under their own similar Creative Common licence". The KANJIDIC wiki names CC BY-NC-SA 4.0 for them. The rights holder's own page says CC BY-SA 4.0 with commercial use allowed. See the follow-up section.

### Repackagings

- jmdict-yomitan: the released dictionaries are CC BY-SA 4.0, the code is MIT. It builds daily and covers JMdict, JMnedict and KANJIDIC in the Yomitan zip format.
- jmdict-simplified: derived JSON files under the same license, with a release every Monday.
- Jitendex: the dictionary is CC BY-SA 4.0 (37 MB Yomitan zip, last dated 2026-10-03), and its build code is AGPL-3.0. The site says both "monthly" and "weekly" for its updates.
- A hosted copy of any of them owes credit to EDRDG and to the repackager, and it carries the same update duty.

## Jiten frequency lists

- The terms (version 2026-08-08, article 6.1) put the frequency lists under CC BY-SA 4.0 and allow commercial use with attribution and share-alike.
- Article 5 forbids a mirror of "the Service or the API" and forbids systematic extraction of "a substantial part of the Corpus". Article 6.2 says that these limits "apply to access to the Service, not to use of licensed data", and it also forbids a bulk extract "in order to reconstitute it elsewhere".
- A copy of one downloaded list is use of licensed data. Copies of every list for every media type come close to the bulk extract that the terms forbid. The line between the two is not stated.
- Two safe paths exist: ask Jiten for permission to host the lists, or let the app download a list from Jiten when the learner asks for it.

## JLPT vocabulary

- yomitan-jlpt-vocab is CC BY-SA 4.0 and credits Jonathan Waller's lists "under the terms of the Creative Commons BY license". It ships as a Yomitan zip.
- A hosted copy owes credit to Waller and to the repository.

## wordfreq

- The data files "may be redistributed under a Creative Commons Attribution-ShareAlike 4.0 license". The code is Apache-2.0.
- The README warns that a plain CSV export has no room for attribution and license, "and therefore does not follow the CC-By-SA license". A hosted file must carry both.
- The Japanese data comes from Wikipedia, subtitles, web text, Twitter and Reddit. OpenSubtitles asks for attribution.

## Recorded audio

- The Tofugu archive is CC BY-SA 4.0. Its README says: "Please attribute to Tofugu and WaniKani per the LICENSE."
- CC BY-SA does not license publicity or personality rights (section 2(b)(1)). The archive holds two voices, and the repository says nothing about their consent beyond the license.
- Wikimedia Commons files each have their own license, so one hosted archive would need a credit list per file.

## The hosting place: GitHub Releases

- "Each file included in a release must be under 2 GiB. There is no limit on the total size of a release, nor bandwidth usage."
- The acceptable use policy keeps a right to throttle or suspend when bandwidth is "significantly excessive in relation to other users of similar features". It gives no number.
- GitHub describes releases as the way to give binary files to other people. No page says whether automatic downloads by every install of an app count as normal use.

## Follow-up on the open points

None of the open points blocks a launch. Each was read again from its primary source.

### SKIP codes: not a blocker

Jack Halpern's own page says: "As of December 12, 2014, the SKIP coding system and all established SKIP codes have been placed under a Creative Commons Attribution-ShareAlike 4.0 International." It allows use "for any purpose, even commercially". The EDRDG licence points to that page. Only the KANJIDIC wiki names a non-commercial license, with no source, and it cites the same page.

The rights holder's statement is the stronger source, so KANJIDIC2 can be hosted whole. Halpern asks for this credit: the SKIP system "was developed by Jack Halpern (Kanji Dictionary Publishing Society at http://www.kanji.org/), and is used with his permission". Michigo is free in any case, so even the non-commercial reading would not forbid it.

### UniDic commercial use: not a blocker

The NINJAL page on commercial use says that the written-language UniDic from version 2.x on is "完全なフリーソフトウェア" (fully free software) under the triple license, and that commercial use is free. Prior consultation applies only to dictionaries under other licenses, such as the historical ones under CC BY-NC-SA.

### EDRDG credit wording: settled

The sample for a software package is: "This package uses the JMdict/EDICT and KANJIDIC dictionary files. These files are the property of the Electronic Dictionary Research and Development Group, and are used in conformance with the Group's licence." Any reasonable variant is accepted.

### GitHub Releases: not a blocker, with a watch point

The terms for additional products do not mention release assets. They forbid use as a content delivery network for Actions and Codespaces only. The GitHub Pages limits page itself suggests releases for heavy downloads. The 2 GiB file limit holds on the Free plan. No bandwidth number exists, so GitHub's right to throttle stays a matter of its judgment. The download URL should be a setting in the app, so the host can change without a new release.

### JLPT lists: not a blocker

OpenJLPT exists at https://github.com/evanclan/OpenJLPT under CC BY-SA 4.0, with JSON, CSV and SQLite files and a NOTICE file for its sources. Waller's own site (tanos.co.uk) does not resolve, so the version of his CC BY license was not read. The earlier JLPT research read the license through the Wayback Machine. Michigo would host a downstream list (yomitan-jlpt-vocab or OpenJLPT), which states its own license, and credit Waller by name.

## Still not verified

- The license files inside jmdict-simplified and the legal page of Jitendex.
- The NOTICE file of OpenJLPT.
- Whether Jiten accepts a hosted copy of its lists. Only Jiten can answer that.

## Sources

- https://clrd.ninjal.ac.jp/unidic/copying/BSD, https://clrd.ninjal.ac.jp/unidic/download.html, https://clrd.ninjal.ac.jp/unidic/faq.html
- https://www.edrdg.org/edrdg/licence.html, https://www.edrdg.org/dokuwiki/doku.php, https://www.edrdg.org/dokuwiki/doku.php?id=wiki_index.php_kanjidic_project
- https://creativecommons.org/licenses/by-sa/4.0/legalcode
- https://jitendex.org/pages/downloads.html, https://github.com/yomidevs/jmdict-yomitan, https://github.com/scriptin/jmdict-simplified
- https://jiten.moe/terms, https://jiten.moe/frequency-dictionaries, https://jiten.moe/guides/deck-licensing
- https://github.com/stephenmk/yomitan-jlpt-vocab, https://github.com/rspeer/wordfreq, https://github.com/tofugu/japanese-vocabulary-pronunciation-audio
- https://www.kanji.org/kanji/dictionaries/skip_permission.htm, https://www.edrdg.org/edrdg/sample.html, https://clrd.ninjal.ac.jp/unidic/commerce_use.html, https://github.com/evanclan/OpenJLPT
- https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features, https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases, https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
