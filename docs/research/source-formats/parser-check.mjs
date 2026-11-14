// Runs three parsers on small hand-made samples to confirm the gaps the research read from source.
import { createRequire } from "node:module";
const require = createRequire(process.argv[2] + "/");
const subsrtMod = require("subsrt-ts");
const subsrt = subsrtMod.default ?? subsrtMod;
const ass = require("ass-compiler");
const { Lrc } = require("lrc-kit");

const show = (label, fn) => {
  try {
    console.log(label.padEnd(26), JSON.stringify(fn()));
  } catch (e) {
    console.log(label.padEnd(26), "ERROR", String(e).slice(0, 200));
  }
};

const srt = (first, coords) =>
  `${first}\n00:00:01,000 --> 00:00:02,000\nこんにちは\n\n2\n00:00:03,000 --> 00:00:04,000${coords}\n{\\an8}<i>（田中）元気？</i>\n\n3\n00:00:05,000 --> 00:00:06,000\nさようなら\n`;
const srtTexts = (s) => subsrt.parse(s, { format: "srt" }).map((c) => c.text ?? c.content);
show("SRT plain", () => srtTexts(srt("1", "")));
show("SRT with BOM", () => srtTexts(srt("﻿1", "")));
show("SRT with coordinates", () => srtTexts(srt("1", " X1:10 X2:20 Y1:30 Y2:40")));
show("SRT CRLF", () => srtTexts(srt("1", "").replaceAll("\n", "\r\n")));

const lrc = "[00:01.00][00:20.00]繰り返す歌詞\n[00:05.00]<00:05.00>一 <00:06.00>二\n";
show("LRC subsrt-ts", () =>
  subsrt.parse(lrc, { format: "lrc" }).map((c) => [c.start, c.text ?? c.content]),
);
show("LRC lrc-kit", () =>
  Lrc.parse(lrc).lyrics.map((l) => [l.timestamp, l.content, l.wordTimestamps?.length ?? null]),
);

const a = `[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,Default,田中,0,0,0,,{\\i1}はい、そうです,たぶん\\N次の行
Dialogue: 0,0:00:03.00,0:00:04.00,Default,,0,0,0,,{\\p1}m 0 0 l 100 0 100 100{\\p0}
Dialogue: 0,0:00:07.00,0:00:08.00,Default,,0,0,0,,{\\k20}漢|かん{\\k20}字|じ
Comment: 0,0:00:05.00,0:00:06.00,Default,,0,0,0,,隠しコメント
`;
show("ASS subsrt-ts", () => subsrt.parse(a, { format: "ass" }).map((c) => c.text ?? c.content));
const p = ass.parse(a);
show("ASS ass-compiler dialogue", () =>
  p.events.dialogue.map((d) => ({
    name: d.Name,
    text: d.Text.parsed.map((x) => x.text),
    drawing: d.Text.parsed.some((x) => (x.drawing?.length ?? 0) > 0),
  })),
);
show("ASS ass-compiler comments", () => p.events.comment.map((c) => c.Text.raw));
