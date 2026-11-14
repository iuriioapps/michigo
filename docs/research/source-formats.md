# Source formats for v1: contents and Node parsers

Research for [What do the v1 Source formats contain, and which parsers read them?](https://github.com/iuriioapps/michigo/issues/75). It feeds [How does a Source get imported and cleaned?](https://github.com/iuriioapps/michigo/issues/45).

This document reports evidence and options. It chooses nothing.

## How the facts were checked

All checks ran on 2026-11-13.

| Kind of fact | How it was checked |
| --- | --- |
| Format rules | Read from the specification or from the reference implementation named in each section |
| Package metadata | `npm view <package>` for version, license, release date, dependencies, unpacked size and types |
| Repository state | `gh api repos/<owner>/<repo>` for the archived flag and the last push |
| Parser behavior | Read from the published source of each package. Afterward `subsrt-ts`, `ass-compiler` and `lrc-kit` were run on small hand-made samples: see [What a run on sample files shows](#what-a-run-on-sample-files-shows). `media-captions`, `subtitle`, `node-webvtt` and `clrc` were not run |
| `TextDecoder` behavior | Run on Node 24.22.1 with ICU 78.3 (full ICU), and afterward inside Electron 44.4.5 run as Node (Node 24.21.0, ICU 78.2), with the same result |

Anything that no primary source confirmed is listed under [What is not verified](#what-is-not-verified).

## Summary of what text cleanup meets

| Item | SRT | ASS/SSA | WebVTT | LRC | Plain text |
| --- | --- | --- | --- | --- | --- |
| Formal specification | No | No | Yes (W3C) | No | Not applicable |
| Timing | One line per cue | Start and End fields per event | One line per cue | Tags at line start | None |
| Position data | Optional coordinates on the timing line, `{\an8}` in text | Margins, `\pos`, `\move`, `\an` | Cue settings, regions | None | None |
| Styling | HTML-like tags | Override blocks in braces | Tags, classes, `STYLE` blocks | None | Aozora annotations |
| Speaker label in the format | No | `Name` field | `<v Name>` tag | Walaoke `M:`, `F:`, `D:` | No |
| Ruby in the format | No | No (karaoke templater syntax only) | `<ruby>` and `<rt>` | No | Aozora `《》` |
| Karaoke timing | No | `\k` family | Timestamp tags in cue text | Enhanced LRC word tags | No |
| Non-text payload | No | Drawings, comments, embedded fonts and pictures | `NOTE`, `STYLE`, `REGION`, metadata cues | ID tags | Aozora header and colophon |
| Encoding by rule | None stated | None stated | UTF-8 required | None stated | Aozora: Shift_JIS |

## SRT

### No specification exists

SubRip has no formal specification. The closest primary sources are the Matroska subtitle page and the FFmpeg demuxer and decoder, which are the de facto reference behavior.

The Matroska page describes four parts of a block: a sequence number, the timing line, the text, and a blank line. Its example timing line is `00:02:17,440 --> 00:02:20,375`. Source: [Matroska subtitles](https://www.matroska.org/technical/subtitles.html).

### Timing and position

FFmpeg reads the timing line with the pattern `%d:%d:%d%*1[,.]%d --> %d:%d:%d%*1[,.]%d`, so it accepts a comma or a period before the milliseconds. The same call reads optional coordinates after the times: `X1:… X2:… Y1:… Y2:…`. Source: [FFmpeg `srtdec.c`](https://github.com/FFmpeg/FFmpeg/blob/master/libavformat/srtdec.c).

The sequence number is needed for FFmpeg to recognize the file, but not to read a cue.

### Styling tags

FFmpeg's SubRip text handler recognizes this markup. Source: [FFmpeg `htmlsubtitles.c`](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/htmlsubtitles.c).

- `<b>`, `<i>`, `<u>`, `<s>`, in any letter case.
- `<font>` with `color`, `face` and `size`.
- `<br>` as a line break.
- ASS override blocks: `{\an8}` is kept as a position, other `{\…}` blocks are removed.
- MicroDVD style blocks such as `{Y:…}` and `{C:…}` are removed.
- An unknown tag that looks like a tag is removed. A lone `<` is kept as text.

Cleanup must therefore remove angle-bracket tags and brace blocks, and must not treat every `<` as a tag.

### Speaker labels, ruby and sound cues

The format has no field for any of these. They are written into the text, so they follow the conventions in [Conventions in Japanese subtitle text](#conventions-in-japanese-subtitle-text).

### Encoding

No rule exists. Matroska converts the text to UTF-8 when it stores it, which shows that files in other encodings are expected.

## ASS and SSA

### No specification exists

The format is defined by the behavior of its renderers. The sources used here are the libass parser, the Aegisub manual and the Matroska page.

### File structure

libass recognizes the sections `[Script Info]`, `[V4 Styles]` (SSA), `[V4+ Styles]` (ASS), `[Events]` and `[Fonts]`. Matroska also names `[Pictures]`. Source: [libass `ass.c`](https://github.com/libass/libass/blob/master/libass/ass.c).

An event line follows the `Format:` line of its section. The defaults in libass are:

```text
ASS: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
SSA: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
```

`Text` is the last field and may contain commas. A parser that splits on every comma loses text.

### Comment lines

libass parses `Dialogue:` lines and ignores `Comment:` lines. Aegisub says a comment line "will not be displayed on the video". **Comment events are not part of what a viewer reads.** Source: [Aegisub: Editing subtitles](https://aegisub.org/docs/latest/editing_subtitles/).

### Speaker labels

The `Name` field is the actor. Aegisub describes it as "The actor speaking this line. Has no actual effect on subtitle display but can be useful for editing purposes." It is often empty. A speaker can also be written into the text, as in SRT.

### Override tags and special characters

Source for this section: [Aegisub: ASS tags](https://aegisub.org/docs/latest/ass_tags/).

- Tags sit in blocks between `{` and `}`. Text in braces that is not a tag is ignored, so braces also carry comments.
- `\N` is a line break. `\n` is a line break only in one wrap mode and otherwise a space. `\h` is a hard space.
- Position and movement: `\pos`, `\move`, `\an`, `\a`, `\org`, `\clip`, `\iclip`.
- `\r` resets the style. `\t` animates tags.
- `\fe` and the style field `Encoding` choose a font character set. Aegisub states that this "has nothing to do with the encoding of the actual text". Source: [Aegisub: Styles](https://aegisub.org/docs/latest/styles/).

### Drawings

`{\p1}` turns on drawing mode and `{\p0}` turns it off. While it is on, the text is drawing commands such as `m 0 0 l 10 0 10 10`, not readable text. Removing the brace blocks alone leaves these commands in the output.

### Karaoke

`\k`, `\K`, `\kf` and `\ko` give each syllable a duration in centiseconds. `\kt` sets a syllable start. The tags split one line into syllables, so the text of a line is the concatenation of the pieces between the tags.

### Ruby

ASS has no ruby tag. Aegisub has a furigana syntax that works inside karaoke-timed lines only. Source: [Aegisub: Furigana karaoke](https://aegisub.org/docs/latest/furigana_karaoke/).

```text
{\k10}漢|かん{\k10}字|じ
{\k10}中|ちゅ{\k10}#|う{\k10}国|ご{\k10}#|く
```

- A pipe after the syllable text starts the reading.
- A `#` syllable continues the previous syllable and may carry more of the reading.
- `!` or `<` right after the pipe controls the layout of the reading.
- Full-width forms are accepted too: `＃`, `｜`, `！`, `＜`.

The karaoke templater then writes the readings as separate positioned lines in a style named `<MainStyle>-furigana`, at half the font size. A file that went through this step contains ruby as extra `Dialogue` events, not as inline text. The page itself warns that the syntax is not meant for ruby in normal dialogue.

### Encoding

libass skips a UTF-8 BOM and converts other encodings only when the caller names a codepage. It does not detect the encoding itself.

## WebVTT

### A real specification

Source for this section: [WebVTT: The Web Video Text Tracks Format](https://www.w3.org/TR/webvtt1/).

- The file must be UTF-8. An optional BOM may come first.
- The first line starts with `WEBVTT`.
- Line ends are CRLF, LF or CR.

### Blocks that are not cues

- `NOTE` blocks are comments.
- `STYLE` blocks hold CSS.
- `REGION` blocks define regions.
- Header text may follow `WEBVTT` on the first line.

### Timing and position

A cue has an optional identifier line, then `hh:mm:ss.ttt --> hh:mm:ss.ttt` with optional hours, then optional settings on the same line: `vertical` (`rl` or `lr`), `line`, `position`, `size`, `align` and `region`.

`vertical:rl` is the setting for vertical Japanese text.

### Cue text tags

- `<c>`, `<i>`, `<b>`, `<u>`, with classes such as `<c.yellow>`.
- `<v Name>` is a voice span. The annotation is the speaker.
- `<ruby>` and `<rt>` mark a ruby base and its reading.
- `<lang ja>` marks a language.
- `<00:00:01.500>` inside the text is a timestamp tag. It marks karaoke-style progress within a cue.
- HTML character references such as `&amp;` and `&lrm;` are allowed. A raw `&` or `<` is not.

WebVTT is the only v1 format where speaker and ruby are marked up by rule. **Removing all tags from `漢字<rt>かんじ</rt>` leaves `漢字かんじ`**, so the reading must be handled before the tags are removed.

## LRC

### No specification exists

LRC is a convention. The only general description is the Wikipedia article, which is a secondary source and is used here because no primary one exists. Source: [LRC (file format)](<https://en.wikipedia.org/wiki/LRC_(file_format)>).

### Core format

```text
[ti:曲名]
[ar:歌手]
[offset:+100]
[00:21.10][00:45.10]繰り返す行
```

- A time tag is `[mm:ss.xx]` with hundredths of a second.
- ID tags are `[type:value]`. The article lists `ti`, `ar`, `al`, `au`, `lr`, `length`, `by`, `offset`, `re` or `tool`, `ve`, and `#` for comments.
- A line may carry several time tags. This is how a repeated line, such as a chorus, is stored once.

A parser that expands the time tags returns the repeated line several times. One that keeps the line as written returns it once. The choice changes word counts.

### Extensions

- Walaoke: `M:`, `F:` or `D:` at the start of a line marks the singer. The marker stays in force until the next one.
- A2, also called enhanced LRC: word time tags in angle brackets, `<mm:ss.xx>`, inside the line.
- The `lrc-kit` source also accepts square-bracket word tags inside a line and names this the foobar2000 form.

### Encoding

No rule exists.

## Plain text

### What it contains

Plain text has no timing, position or styling by format. The one widespread Japanese convention with markup is the Aozora Bunko text file.

### Aozora Bunko notation

Sources: [Aozora Bunko annotation manual](https://www.aozora.gr.jp/annotation/etc.html) and [Aozora Bunko input manual](https://www.aozora.gr.jp/aozora-manual/index-input.html).

Ruby is written after its base in `《》`:

```text
青空文庫《あおぞらぶんこ》
霧の｜ロンドン警視庁《スコットランドヤード》
武州｜青梅《おうめ》の宿
```

- Without a bar, the base is the run of one character type before `《`. The characters `仝々〆〇ヶ` count as kanji.
- A full-width bar `｜` marks the start of the base when the base mixes character types or is not otherwise clear.
- Annotations are written as `［＃…］`, for example `［＃２字下げ］`, `［＃改ページ］` and `［＃「大焼き」に傍点］`.
- Left-side ruby is an annotation: `［＃「青空文庫」の左に「あおぞらぶんこ」のルビ］`.
- A character outside JIS X 0208 is written as `※［＃「木＋睛のつくり」、第3水準1-85-73］`. Ruby may follow it.

### Aozora file layout

- Line 1 is the title and line 2 is the author. More credit lines may follow.
- A block headed `【テキスト中に現れる記号について】` explains the symbols used in the file.
- A colophon that starts with `底本` follows the body after blank lines.

None of these three parts is text of the work.

### Aozora encoding

The input manual requires "Shift_JISのテキスト、改行コードはCR+LF" and limits the characters to JIS X 0201 and JIS X 0208.

## Conventions in Japanese subtitle text

### What the Netflix style guide prescribes

Source: [Netflix Japanese Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215767517-Japanese-Timed-Text-Style-Guide). It is a publisher's authoring rule, not a file format. It shows what professionally made Japanese subtitles and captions contain.

| Item | Rule in the guide | Example |
| --- | --- | --- |
| Speaker label (captions for the deaf and hard of hearing) | Full-width parentheses, only when the speaker cannot be seen | `（田中）こんばんは` |
| Speaker with a device | Method and speaker, separated by a half-width colon | `（電話:大介）` |
| Sound cue | Full-width parentheses | `（雷鳴）`, `（ＢＧＭ：不気味な音楽）` |
| Bleeped speech | Fixed strings | `（自主規制音）`, `××××` |
| Two speakers in one event | A half-width hyphen before each line | `- まさか`, `-（みのり）はじめまして` |
| Songs | A music note and a half-width space | `♪ 歌詞`, `♪～`, `～♪` |
| Ruby | On the first instance of a term only, on every instance in content for children | Reading above the base |
| Emphasis dots | Above or beside the character | Not text |
| Vertical text | Allowed, top-aligned at the side of the screen | Not text |
| Signs and letters on screen | Double quotation marks, often italic | Not speech |

### What follows for cleanup

Speaker labels and sound cues use the same full-width parentheses. A reading in parentheses after a kanji word, such as `漢字（かんじ）`, would use them too. The guide does not describe that last form, because Netflix delivers ruby as real ruby markup. How ruby turns into text when such a file is converted to SRT depends on the converter and was not verified.

The three uses differ in position and content. A speaker label or sound cue opens a line or follows a hyphen. A reading follows a kanji run and holds kana only. This is an inference from the examples above, not a rule from any source.

## Repeated and duplicate lines

| Cause | Format | Evidence |
| --- | --- | --- |
| One line with several time tags | LRC | Described in the LRC article, handled by `lrc-kit` and `clrc` |
| Readings written as separate events in a `-furigana` style | ASS | Aegisub furigana karaoke page |
| The same text on several layers for visual effect | ASS | Aegisub describes layers for overlapping lines. Duplication was not verified |
| Lines generated by the karaoke templater next to the originals | ASS | Not confirmed by the Aegisub page that was read |
| Rolling captions that repeat the previous line | WebVTT | Not verified |

## Encodings and decoding in Node

### What `TextDecoder` accepts on Node 24

Run on Node 24.22.1, ICU 78.3, full ICU.

| Label | Result |
| --- | --- |
| `shift_jis`, `sjis`, `shift-jis`, `x-sjis`, `windows-31j`, `ms932` | Decoder `shift_jis` |
| `cp932` | Throws `ERR_ENCODING_NOT_SUPPORTED` |
| `euc-jp`, `x-euc-jp` | Decoder `euc-jp` |
| `iso-2022-jp` | Decoder `iso-2022-jp` |
| `utf-16le`, `utf-16`, `ucs-2`, `unicode` | Decoder `utf-16le` |
| `utf-16be` | Decoder `utf-16be` |
| `utf-8`, `utf8` | Decoder `utf-8` |

These match the label table of the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/), which has no `cp932` label.

The `shift_jis` decoder covers the Windows extensions. The bytes `87 54` decoded to `Ⅰ` and `FA 40` to `ⅰ`, which plain JIS X 0208 does not contain.

`Buffer.isEncoding("shift_jis")` is false, so `Buffer#toString` cannot decode these files. `TextDecoder` can.

### The ICU build matters

The Node documentation lists `shift_jis`, `euc-jp` and `iso-2022-jp` only under "Encodings supported by default (with full ICU data)". A `small-icu` build has only `utf-8`, `utf-16le` and `utf-16be`. The `fatal` option is not supported without ICU. Source: [Node 24 `util.TextDecoder`](https://nodejs.org/docs/latest-v24.x/api/util.html#class-utiltextdecoder).

Whether the main process of Electron 44 has the full set was not tested.

### Byte order marks

- The Encoding Standard defines BOM sniffing: `EF BB BF` is UTF-8, `FE FF` is UTF-16BE, `FF FE` is UTF-16LE. It says "the byte order mark is more authoritative than anything else".
- `TextDecoder` does not sniff. It decodes with the label it was given.
- With the default `ignoreBOM: false`, the `utf-8`, `utf-16le` and `utf-16be` decoders remove a leading BOM from the output. The run confirmed this for all three.

So the caller reads the first three bytes, picks the decoder, and the decoder removes the mark.

### What a strict decode can tell

Run with `fatal: true`:

| Bytes          | Decoded as  | Result                                         |
| -------------- | ----------- | ---------------------------------------------- |
| UTF-8 `あ`     | `shift_jis` | Throws                                         |
| Shift_JIS `あ` | `utf-8`     | Throws                                         |
| EUC-JP `あい`  | `shift_jis` | No error, returns `､｢､､` (half-width katakana) |

A strict UTF-8 decode separates UTF-8 from the legacy encodings. `buffer.isUtf8()` exists in Node 24 for the same test. **A strict decode cannot separate EUC-JP from Shift_JIS**, because EUC-JP bytes are valid half-width katakana in Shift_JIS. That step needs statistics or a rule about half-width katakana.

UTF-16 without a BOM is also not found by a strict decode.

### Detection libraries

All are pure JavaScript with no install script.

| Package | Version | Released | License | Dependencies | Types | Unpacked size | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`chardet`](https://github.com/runk/node-chardet) | 2.2.0 | 2026-06-20 | MIT | 0 | Yes | 179 kB | Detects UTF-8, UTF-16, UTF-32, Shift_JIS, EUC-JP, ISO-2022-JP and others. Returns matches with confidence |
| [`encoding-japanese`](https://github.com/polygonplanet/encoding.js) | 2.5.0 | 2026-11-02 | MIT | 0 | Yes | 423 kB (88 kB minified file) | Japanese only: UTF-8, UTF-16, UTF-32, Shift_JIS, EUC-JP, JIS. Detects and converts with its own tables |
| [`jschardet`](https://github.com/aadsm/jschardet) | 4.1.0 | 2026-10-25 | 0BSD | 0 | Yes | 7.5 MB (1.18 MB minified file) | Many encodings, including `cp932` and `euc-jis-2004`. Has an allowlist option. Needs Node 20 or later |
| [`iconv-lite`](https://github.com/pillarjs/iconv-lite) | 0.7.3 | 2026-07-03 | MIT | 1 (`safer-buffer`) | Yes | 344 kB | Decodes only, does not detect. Only its metadata was checked |
| `detect-file-encoding-and-language` | 2.4.0 | 2023-06-30 | MIT | 0 | Yes | 51 kB | Not inspected |

## Node parsers

### How to read the tables

Every package below is pure JavaScript: none has a `gypfile` or an install script, and all installed with `--ignore-scripts`. "Released" is the date of the latest version on npm. "Last push" is from GitHub. Unpacked size is the npm figure for the whole package, which is larger than what a bundler keeps.

### Parsers for several formats

| Package | Formats | Version | Released | Last push | License | Dependencies | Types | Unpacked size |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [`subsrt-ts`](https://github.com/rakuzen25/subsrt-ts) | SRT, WebVTT, ASS, SSA, LRC, SUB, SMI, SBV | 2.1.3 | 2026-10-28 | 2026-11-13 | MIT | 0 | Yes | 87 kB |
| [`media-captions`](https://github.com/vidstack/captions) | WebVTT, SRT, ASS, SSA | 0.0.18 | 2023-06-15 | 2026-09-09 | MIT | 0 | Yes | 216 kB |
| [`subtitle`](https://github.com/gsantiago/subtitle.js) | SRT, partial WebVTT | 4.2.2 | 2025-11-16 | 2026-01-24 | MIT | 4 direct | Yes | 110 kB |
| [`@plussub/srt-vtt-parser`](https://github.com/plussub/srt-vtt-parser) | SRT, WebVTT | 2.0.5 | 2024-07-29 | 2024-07-29 | MIT | 0 | Yes | 12 kB |

### What the source of `subsrt-ts` shows

- It is ESM only. Each format handler is 3 to 8 kB.
- SRT: a block must start with the sequence number and the timing line must end right after the end time. A leading BOM or coordinates on the timing line make the block fail to match, and the block is dropped.
- SRT and WebVTT: `text` is the content with `<…>` and `{…}` removed. A ruby reading stays in the text.
- SRT: it also removes `>> NAME:` speaker prefixes, an English caption convention.
- ASS: it reads `Dialogue` only, rejoins text that contains commas, replaces `\N`, and removes `{…}`. Drawing commands stay in the text. The `Name` field is available in `data`.
- LRC: it reads one time tag per line. A second time tag stays in the text. It has no enhanced LRC support.

### What the source of `media-captions` shows

- The npm release is from 2023, although the repository is active.
- The API is asynchronous (`parseText`) and returns `VTTCue` objects. `tokenizeVTTCue` turns cue text into tokens, which the README shows for voice spans.
- The SRT parser is the WebVTT parser with the comma replaced.
- ASS: it removes `{…}` and replaces `\N`. Drawing commands stay in the text.

### What the source of `subtitle` shows

- It is built on Node streams. Its four direct dependencies pull in `readable-stream` and others, more than ten packages in all.
- It removes a BOM with `strip-bom`.
- Its timing pattern keeps anything after the end time as `settings`, so SRT coordinates and WebVTT settings do not break a cue.
- No tag removal was found in its source.

### ASS and SSA parsers

| Package | Version | Released | Last push | License | Dependencies | Types | Unpacked size |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`ass-compiler`](https://github.com/weizhenye/ass-compiler) | 0.1.16 | 2025-11-09 | 2025-11-09 | MIT | 0 | Yes | 145 kB (18 kB minified file) |
| [`@qgustavor/ass-parser`](https://github.com/qgustavor/ass-parser) | 0.5.3 | 2023-07-12 | 2023-07-12 | MIT | 0 | No | 8 kB |
| `ass-parser` | 0.2.0 | 2018-01-08 | Not checked | MIT | 4 | No | Not reported |
| [`assjs`](https://github.com/weizhenye/ASS) | 0.1.10 | 2026-08-15 | 2026-08-15 | MIT | 0 | Yes | 262 kB |

`assjs` is a browser renderer, not a parser.

The source of `ass-compiler` shows that `parse`:

- keeps `Comment` and `Dialogue` events in separate lists,
- rejoins text that contains commas,
- returns `Name` and `Effect` for each event,
- splits `Text` into fragments, each with its tags, its text and its drawing,
- gives a drawing fragment an empty text, so drawing commands do not leak,
- leaves `\N`, `\h` and the karaoke furigana pipe in the text.

### WebVTT parsers

| Package | Version | Released | Last push | License | Dependencies | Types | Unpacked size |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`node-webvtt`](https://github.com/osk/node-webvtt) | 2.0.0 | 2026-09-07 | 2026-11-03 | MIT | 0 | Yes | 23 kB |
| [`webvtt-parser`](https://github.com/w3c/webvtt.js) | 2.2.0 | 2022-08-17 | 2024-08-13 | CC0-1.0 | 0 | No | 84 kB |
| [`videojs-vtt.js`](https://github.com/videojs/vtt.js) | 0.15.5 | 2023-07-20 | 2023-07-20 | Apache-2.0 | 1 | No | 247 kB |
| [`vtt.js`](https://github.com/mozilla/vtt.js) | 0.13.0 | 2017-01-03 | 2024-03-01 | Apache-2.0 | 0 | No | Not reported |

`node-webvtt` is strict by default and throws on a malformed file. `strict: false` collects errors instead. It skips `NOTE` blocks and returns the settings as a string in `styles`. Its source shows no handling of cue text tags, so `<v>` and `<ruby>` stay in `text`.

`webvtt-parser` is the parser from the W3C repository. Its source was not read.

### LRC parsers

| Package | Version | Released | Last push | License | Dependencies | Types | Unpacked size | Enhanced LRC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [`lrc-kit`](https://github.com/weirongxu/lrc-kit) | 1.2.1 | 2026-03-06 | 2026-03-27 | MIT | 0 | Yes | 56 kB | Yes |
| [`clrc`](https://github.com/mebtte/clrc) | 3.1.4 | 2023-11-27 | 2023-11-27 | MIT | 0 | Yes | 21 kB | Yes |
| [`lrc-file-parser`](https://github.com/lyswhut/lrc-file-parser) | 2.5.0 | 2026-11-10 | 2026-11-10 | MIT | 0 | Yes | 55 kB | Not checked |
| [`liricle`](https://github.com/mcanam/liricle) | 4.2.0 | 2024-07-29 | 2025-01-12 | MIT | 0 | Yes | 53 kB | Yes |

- `lrc-kit` reads several time tags per line, ID tags, and word tags in both the `<…>` and the `[…]` form. It also ships a playback runner.
- `clrc` reads several time tags per line. It has `parse` and `parseEnhanced`, and marks lines it cannot read as invalid with their line number. Its time pattern needs two-digit minutes.
- `lrc-file-parser` and `liricle` are playback classes with callbacks, built to sync lyrics to audio.
- No parser was found that reads the Walaoke `M:`, `F:`, `D:` markers.

### Stale packages

These came up in the search and are listed so that nobody checks them again: `subsrt` 1.1.1 (2019, no types, the origin of `subsrt-ts`), `srt-parser-2` 1.2.3 (2023), `subtitles-parser` 0.0.2 (2013), `subtitle-converter` 3.0.12 (2022, 6 dependencies), `lrc-parser` 1.0.1 (2018), `lrc.js` 1.0.2 (2018), `lyric-parser` 1.0.1 (2017).

## What a run on sample files shows

`docs/research/source-formats/parser-check.mjs` runs `subsrt-ts` 2.1.3, `ass-compiler` 0.1.16 and `lrc-kit` 1.2.1 on small samples written for this check. Every gap that the source reading found is confirmed, and the run found three more.

### `subsrt-ts` on SRT

| Sample | Result |
| --- | --- |
| Three plain blocks | All three are returned. `{\an8}` and `<i>` are removed, and `（田中）` stays in the text |
| A BOM before the first block | The first block is dropped without an error |
| Coordinates on a timing line | That block is dropped without an error |
| CRLF line ends | All three blocks are returned |

The text of the last block ends with `\r\n` in every sample, also when the input uses LF. This was not seen in the source reading.

### LRC

| Sample | `subsrt-ts` | `lrc-kit` |
| --- | --- | --- |
| `[00:01.00][00:20.00]` before one line | One line at 1 s. The second tag stays in the text as `[00:20.00]繰り返す歌詞` | Two lines, at 1 s and at 20 s |
| Enhanced word tags `<00:05.00>一 <00:06.00>二` | The tags stay in the text | The text is `一 二`, and the word times are returned apart |

So the second time tag is not only ignored by `subsrt-ts`: it lands in the text.

### ASS

| Sample | `subsrt-ts` | `ass-compiler` |
| --- | --- | --- |
| Text that holds a comma | Rejoined correctly | Rejoined correctly |
| `\N` line break | Turned into a line end | Left in the text as `\N` |
| Actor in the `Name` field | Not in the result | Returned as `Name` |
| Drawing `{\p1}m 0 0 l 100 0 100 100{\p0}` | The drawing commands are returned as text | Returned as a drawing, with empty text |
| `Comment:` event | Not returned | Returned apart from the dialogue |
| Karaoke with readings `{\k20}漢 | かん{\k20}字 | じ` | `漢 | かん字 | じ` | `漢 | かん`and`字 | じ`, one part per karaoke tag |

`subsrt-ts` also returns two entries with no text before the dialogue lines, for the sections of the file that are not events. No parser removes the `|かん` reading marks.

## Options

### Parsing

| Option | What it means | Evidence for | Evidence against |
| --- | --- | --- | --- |
| One library for all formats | `subsrt-ts` or `media-captions` | One dependency, one result shape | `subsrt-ts` drops SRT blocks with a BOM or coordinates and reads one LRC time tag. Both leak ASS drawings. Neither exposes ruby or voice as data without more work |
| One library per format | For example `ass-compiler`, a WebVTT parser and `lrc-kit` or `clrc` | `ass-compiler` handles comments, drawings and commas in text. The LRC libraries handle repeated and enhanced lines | Three result shapes to map. WebVTT cue text tags still need their own handling |
| Own parsers | Line-oriented code in the repository | The existing parsers are 1 to 10 kB each. Locators and Japanese conventions need the raw text anyway | SRT, ASS and LRC have no specification, so edge cases come from real files |
| Mixed | A library where the format is hard (ASS), own code where it is small (SRT, LRC) | Follows the evidence per format | Two styles of code |

No parser handles the Japanese text conventions (parentheses labels, sound cues, music notes, readings in parentheses) or Aozora notation. That part is own code under every option.

### Encoding

| Option | What it means | Evidence for | Evidence against |
| --- | --- | --- | --- |
| BOM, then strict UTF-8, then a detection library | `chardet` or `jschardet` chooses among the legacy encodings | A strict decode already settles UTF-8. `chardet` is small | A detector can be wrong on a short file |
| BOM, then strict UTF-8, then `encoding-japanese` | Japanese-only detection | Covers exactly the encodings in question | 88 kB of tables that `TextDecoder` already has for decoding |
| BOM, then strict UTF-8, then own rule | Try `shift_jis` and `euc-jp` strictly and score the result | No dependency | Needs a scoring rule, since EUC-JP decodes as Shift_JIS without error |
| Any of the above plus a manual choice | The learner can pick the encoding when the text looks wrong | Fixes every wrong guess | One more control in the import screen |

Decoding itself needs no library on Node 24 with full ICU.

## What is not verified

- Parser behavior on real files. Three parsers were run on hand-made samples only. `media-captions`, `subtitle`, `node-webvtt` and `clrc` were not run.
- How often Japanese SRT files write readings in parentheses, and whether converters produce that form from ruby markup. No primary source was found.
- Whether the Aegisub karaoke templater leaves the original lines as comments and marks generated lines in the `Effect` field. The page that was read does not say.
- Rolling duplicate lines in automatically generated WebVTT captions.
- The accuracy of `chardet`, `jschardet` and `encoding-japanese` on short Japanese subtitle files.
- The bundled size of each package after tree shaking. Only npm unpacked sizes and single file sizes were measured.
- The line of hyphens that often surrounds the Aozora symbol block. The manual only requires a blank line.
