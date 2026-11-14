// Scans a folder of real subtitle files and prints counts only, never subtitle text beyond short markers.
// Usage: node real-files.mjs <dir with node_modules of the parsers> <folder with .srt and .ass files>
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const require = createRequire(process.argv[2] + "/");
const subsrtMod = require("subsrt-ts");
const subsrt = subsrtMod.default ?? subsrtMod;
const ass = require("ass-compiler");

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(process.argv[3]).filter((p) =>
  [".srt", ".ass", ".ssa"].includes(extname(p).toLowerCase()),
);

const counts = new Map();
const bump = (key, n = 1) => counts.set(key, (counts.get(key) ?? 0) + n);
const examples = new Map();
const example = (key, value) => {
  const list = examples.get(key) ?? [];
  if (list.length < 6 && !list.includes(value)) list.push(value);
  examples.set(key, list);
};

const decode = (buf) => {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
    return ["utf-8 with BOM", new TextDecoder("utf-8").decode(buf)];
  if (buf[0] === 0xff && buf[1] === 0xfe)
    return ["utf-16le with BOM", new TextDecoder("utf-16le").decode(buf)];
  if (buf[0] === 0xfe && buf[1] === 0xff)
    return ["utf-16be with BOM", new TextDecoder("utf-16be").decode(buf)];
  try {
    return ["utf-8", new TextDecoder("utf-8", { fatal: true }).decode(buf)];
  } catch {
    try {
      return [
        "shift_jis (strict decode passes)",
        new TextDecoder("shift_jis", { fatal: true }).decode(buf),
      ];
    } catch {
      return ["unknown", new TextDecoder("utf-8").decode(buf)];
    }
  }
};

const KANA = /[\u3040-\u30ff]/;
const textStats = (kind, lines) => {
  for (const line of lines) {
    bump(`${kind} text lines`);
    if (/^[（(][^）)]{1,12}[）)]/.test(line))
      bump(`${kind} lines that start with a label in parentheses`);
    if (/^（[^）]{1,12}）/.test(line)) bump(`${kind} .. of these, full-width parentheses`);
    if (/[一-龯々]+[（(][ぁ-ゖー]+[）)]/.test(line)) {
      bump(`${kind} lines with a kana reading in parentheses after kanji`);
      example(`${kind} reading in parentheses`, line.match(/[一-龯々]+[（(][ぁ-ゖー]+[）)]/)[0]);
    }
    if (/[♪♬～〜]{1}/.test(line) && /[♪♬]/.test(line)) bump(`${kind} lines with a music mark`);
    if (/^[-‐－–—]/.test(line)) bump(`${kind} lines that start with a hyphen`);
    if (/^[^\s（(：:]{1,8}[：:]/.test(line) && KANA.test(line))
      bump(`${kind} lines that start with "name:"`);
    if (/《[^》]+》/.test(line)) bump(`${kind} lines with Aozora ruby marks`);
  }
};

for (const path of files) {
  const ext = extname(path).toLowerCase();
  const kind = ext === ".srt" ? "SRT" : "ASS";
  const [encoding, text] = decode(readFileSync(path));
  bump(`${kind} files`);
  bump(`${kind} encoding: ${encoding}`);
  bump(`${kind} line ends: ${text.includes("\r\n") ? "CRLF" : "LF"}`);
  const japanese = KANA.test(text);
  bump(`${kind} files with kana (Japanese): ${japanese ? "yes" : "no"}`);

  if (kind === "SRT") {
    const timing = text.split(/\r?\n/).filter((l) => /^\d\d:\d\d:\d\d[,.]\d{1,3}\s*-->/.test(l));
    const withCoords = timing.filter((l) => /-->\s*\d\d:\d\d:\d\d[,.]\d{1,3}\s+\S/.test(l)).length;
    if (withCoords) bump("SRT files with coordinates on a timing line");
    let parsed = [];
    try {
      parsed = subsrt
        .parse(text, { format: "srt" })
        .filter((c) => c.type === "caption" || c.type === undefined);
    } catch {
      bump("SRT files where subsrt-ts throws");
    }
    bump("SRT blocks by timing lines", timing.length);
    bump("SRT blocks returned by subsrt-ts", parsed.length);
    if (parsed.length !== timing.length) {
      bump("SRT files where subsrt-ts loses blocks");
      bump("SRT blocks lost by subsrt-ts", timing.length - parsed.length);
      if (encoding.endsWith("BOM")) bump("SRT .. files that lose blocks and have a BOM");
    }
    for (const [name, re] of [
      ["<i>", /<i>/i],
      ["<b>", /<b>/i],
      ["<u>", /<u>/i],
      ["<font", /<font/i],
      ["{\\an", /\{\\an?\d/],
      ["other {\\ block", /\{\\(?!an?\d)/],
    ])
      if (re.test(text)) bump(`SRT files with ${name}`);
    if (japanese) {
      const body = text
        .split(/\r?\n/)
        .filter((l) => l.trim() && !/^\d+$/.test(l.trim()) && !/-->/.test(l));
      textStats(
        "SRT",
        body.map((l) => l.replace(/<[^>]+>|\{[^}]*\}/g, "").trim()),
      );
      const seen = parsed.map((c) => (c.text ?? "").trim());
      let repeats = 0;
      for (let i = 1; i < seen.length; i++) if (seen[i] && seen[i] === seen[i - 1]) repeats++;
      bump("SRT blocks with the same text as the block before", repeats);
    }
  } else {
    let p;
    try {
      p = ass.parse(text);
    } catch {
      bump("ASS files where ass-compiler throws");
      continue;
    }
    const dialogue = p.events.dialogue;
    bump("ASS dialogue events", dialogue.length);
    bump("ASS comment events", p.events.comment.length);
    if (p.events.comment.length) bump("ASS files with comment events");
    const named = dialogue.filter((d) => d.Name).length;
    bump("ASS dialogue events with an actor name", named);
    if (named) bump("ASS files with actor names");
    const drawings = dialogue.filter((d) =>
      d.Text.parsed.some((x) => (x.drawing?.length ?? 0) > 0),
    ).length;
    bump("ASS dialogue events that are drawings", drawings);
    if (drawings) bump("ASS files with drawings");
    const karaoke = dialogue.filter((d) => /\\[kK][fo]?\d/.test(d.Text.raw)).length;
    bump("ASS dialogue events with karaoke tags", karaoke);
    if (karaoke) bump("ASS files with karaoke tags");
    const marks = dialogue.filter((d) => /\\[kK][fo]?\d+\}[^{|]+\|[^{]+/.test(d.Text.raw)).length;
    if (marks) bump("ASS files with reading marks in karaoke (base|reading)");
    const styles = new Set(dialogue.map((d) => d.Style));
    bump("ASS styles used by dialogue, summed over files", styles.size);
    if ([...styles].some((s) => /furigana|ruby|ルビ/i.test(s)))
      bump("ASS files with a furigana or ruby style");
    if (dialogue.some((d) => /\\N/.test(d.Text.raw))) bump("ASS files with \\N line breaks");
    if (dialogue.some((d) => /\\h/.test(d.Text.raw))) bump("ASS files with \\h hard spaces");
    if (dialogue.some((d) => /\\(pos|move|clip|fad|t)\(/.test(d.Text.raw)))
      bump("ASS files with position, clip, fade or transform tags");

    let caps = [];
    try {
      caps = subsrt.parse(text, { format: "ass" }).filter((c) => typeof c.text === "string");
    } catch {
      bump("ASS files where subsrt-ts throws");
    }
    bump("ASS captions returned by subsrt-ts", caps.length);
    const leaked = caps.filter((c) => /^m -?[\d.]+ -?[\d.]+ [lb] /.test(c.text.trim())).length;
    bump("ASS captions from subsrt-ts that are drawing commands", leaked);

    // Same text at the same start time on several events: layers for effects, or a sign shown twice.
    const keyed = new Map();
    for (const d of dialogue) {
      const plain = d.Text.parsed.map((x) => x.text).join("");
      if (!plain.trim()) continue;
      const key = d.Start + "|" + plain;
      keyed.set(key, (keyed.get(key) ?? 0) + 1);
    }
    const dup = [...keyed.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
    bump("ASS dialogue events that repeat a text at the same start time", dup);
    if (dup) bump("ASS files with such repeats");

    if (japanese) {
      const lines = dialogue
        .filter((d) => !d.Text.parsed.some((x) => (x.drawing?.length ?? 0) > 0))
        .flatMap((d) =>
          d.Text.parsed
            .map((x) => x.text)
            .join("")
            .split(/\\N/),
        )
        .map((l) => l.trim())
        .filter(Boolean);
      textStats("ASS", lines);
    }
  }
}

for (const key of [...counts.keys()].sort()) console.log(String(counts.get(key)).padStart(8), key);
console.log("\nExamples (short matches only):");
for (const [key, list] of examples) console.log(" ", key + ":", list.join("  "));
