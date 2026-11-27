// Renders every details/bNN.json (and logs/bNN.json when present) as one review page: node render.mjs <out.html>
// The page looks like the learner's grammar tab, with the reviewer's data inside each card.
// It has no doctype or <body>: the Artifact host wraps it. A browser opens it as a file too.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2];
if (!out) throw new Error("usage: node render.mjs <out.html>");

const entries = [];
for (const file of readdirSync(join(root, "details")).filter((f) => /^b\d+\.json$/.test(f)).sort()) {
  const batch = file.slice(0, -5);
  const logPath = join(root, "logs", file);
  const log = new Map(existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")).map((l) => [l.id, l]) : []);
  for (const p of JSON.parse(readFileSync(join(root, "details", file), "utf8"))) {
    const l = log.get(p.id);
    entries.push({ ...p, batch, verdict: l?.verdict ?? "unreviewed", changes: l?.changes ?? [] });
  }
}
// "</" would close the data script early.
const data = JSON.stringify(entries).replaceAll("</", "<\\/");

const html = `<title>Grammar Pattern Review</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>
/* Layout: one reading column of pattern cards, like the grammar tab, under a sticky filter bar. Colors are the app's tokens. */
:root {
  --bg: oklch(0.977 0.004 250);
  --fg: oklch(0.235 0.017 265);
  --card: oklch(1 0 0);
  --primary: oklch(0.546 0.215 263);
  --muted: oklch(0.962 0.006 252);
  --muted-fg: oklch(0.551 0.023 264);
  --accent: oklch(0.925 0.032 256);
  --accent-fg: oklch(0.478 0.185 263);
  --mark: oklch(0.9 0.07 256);
  --bad: oklch(0.577 0.245 27);
  --bad-bg: oklch(0.96 0.03 27);
  --ok: oklch(0.52 0.14 150);
  --ok-bg: oklch(0.955 0.04 150);
  --warn: oklch(0.55 0.12 70);
  --warn-bg: oklch(0.96 0.05 85);
  --border: oklch(0.925 0.011 253);
  --sans: "Geist", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
  --ja: "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
  --mono: "Geist Mono", ui-monospace, monospace;
  --radius: 0.5rem;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: oklch(0.183 0.016 266); --fg: oklch(0.967 0.004 250); --card: oklch(0.228 0.018 266);
  --primary: oklch(0.62 0.19 263); --muted: oklch(0.285 0.02 266); --muted-fg: oklch(0.706 0.021 262);
  --accent: oklch(0.324 0.055 262); --accent-fg: oklch(0.81 0.11 258); --mark: oklch(0.38 0.08 262);
  --bad: oklch(0.704 0.191 22); --bad-bg: oklch(0.3 0.06 22); --ok: oklch(0.75 0.15 150); --ok-bg: oklch(0.3 0.05 150);
  --warn: oklch(0.8 0.12 80); --warn-bg: oklch(0.32 0.05 80); --border: oklch(1 0 0 / 10%); color-scheme: dark;
} }
:root[data-theme="dark"] {
  --bg: oklch(0.183 0.016 266); --fg: oklch(0.967 0.004 250); --card: oklch(0.228 0.018 266);
  --primary: oklch(0.62 0.19 263); --muted: oklch(0.285 0.02 266); --muted-fg: oklch(0.706 0.021 262);
  --accent: oklch(0.324 0.055 262); --accent-fg: oklch(0.81 0.11 258); --mark: oklch(0.38 0.08 262);
  --bad: oklch(0.704 0.191 22); --bad-bg: oklch(0.3 0.06 22); --ok: oklch(0.75 0.15 150); --ok-bg: oklch(0.3 0.05 150);
  --warn: oklch(0.8 0.12 80); --warn-bg: oklch(0.32 0.05 80); --border: oklch(1 0 0 / 10%); color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 var(--sans); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
[lang="ja"] { font-family: var(--ja); }
.wrap { max-width: 46rem; margin: 0 auto; padding-block: 0 4rem; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1 { font-size: 1.5rem; font-weight: 600; margin: 0; text-wrap: balance; }
.intro { padding-block: 2rem 1rem; display: grid; gap: 0.5rem; }
.intro p { margin: 0; color: var(--muted-fg); max-width: 65ch; }
.stats { display: flex; flex-wrap: wrap; gap: 0.4rem 1.25rem; font-size: 0.85rem; color: var(--muted-fg); font-variant-numeric: tabular-nums; }
.stats b { color: var(--fg); font-weight: 600; }
.bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding-block: 0.75rem; border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.bar input, .bar select { font: inherit; font-size: 0.9rem; color: var(--fg); background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.4rem 0.6rem; min-width: 0; }
.bar input { flex: 1 1 12rem; }
.seg { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.seg button { font: inherit; font-size: 0.85rem; padding: 0.3rem 0.65rem; border-radius: 999px; border: 1px solid var(--border); background: var(--card); color: var(--fg); cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); border-color: transparent; font-weight: 500; }
.count { font-size: 0.85rem; color: var(--muted-fg); margin-left: auto; font-variant-numeric: tabular-nums; }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.level { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted-fg); font-weight: 500; margin: 2rem 0 0.75rem; }
.list { display: grid; gap: 0.75rem; }
.entry { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.1rem; display: grid; gap: 0.75rem; min-width: 0; scroll-margin-top: 5rem; }
.entry.rejected { opacity: 0.72; }
.entry:target { outline: 2px solid var(--primary); }
.head { display: grid; grid-template-columns: 1fr auto; gap: 0.15rem 0.75rem; align-items: baseline; }
.form { font-size: 1.3rem; font-weight: 700; margin: 0; overflow-wrap: anywhere; }
.meaning { grid-column: 1 / -1; margin: 0; }
.meta { grid-column: 1 / -1; font: 0.78rem var(--mono); color: var(--muted-fg); overflow-wrap: anywhere; }
.pill { font-size: 0.75rem; font-weight: 500; padding: 0.1rem 0.55rem; border-radius: 999px; white-space: nowrap; }
.v-ok { background: var(--ok-bg); color: var(--ok); }
.v-fixed { background: var(--warn-bg); color: var(--warn); }
.v-reject { background: var(--bad-bg); color: var(--bad); }
.v-unreviewed { background: var(--muted); color: var(--muted-fg); }
.sents { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.sents li { display: grid; gap: 0.1rem; min-width: 0; }
.ja { margin: 0; font-size: 1.05rem; overflow-wrap: anywhere; }
.en { margin: 0; font-size: 0.88rem; color: var(--muted-fg); }
mark { background: var(--mark); color: inherit; border-radius: 3px; padding: 0 0.1em; }
.why { margin: 0; font-size: 0.85rem; color: var(--bad); }
.more { justify-self: start; font: inherit; font-size: 0.85rem; color: var(--accent-fg); background: none; border: 0; padding: 0; cursor: pointer; }
.more:hover { text-decoration: underline; }
details.notes { border-top: 1px solid var(--border); padding-top: 0.6rem; }
details.notes > summary { cursor: pointer; font-size: 0.85rem; color: var(--muted-fg); }
.grid { display: grid; gap: 0.9rem; margin-top: 0.8rem; min-width: 0; }
.grid h4 { margin: 0 0 0.3rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted-fg); font-weight: 500; }
.grid p, .grid ul { margin: 0; }
.grid ul { padding-left: 1.1rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.chips a, .chips span { font: 0.8rem var(--mono); padding: 0.1rem 0.45rem; border-radius: 4px; background: var(--muted); color: var(--fg); text-decoration: none; }
.chips a:hover { background: var(--accent); color: var(--accent-fg); }
.detect { font-size: 0.9rem; max-width: 65ch; }
.empty { color: var(--muted-fg); padding: 2rem 0; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>
<div class="wrap">
  <header class="intro">
    <h1>Grammar Pattern Review</h1>
    <p>Each card shows a pattern as the learner's grammar tab will: the form, the meaning and example sentences with the match marked. Open "Reviewer notes" for the variants, connections, near misses, detection hints and the review log.</p>
    <div class="stats" id="stats"></div>
  </header>
  <div class="bar" role="search">
    <input id="q" type="search" placeholder="Search id, form or meaning" aria-label="Search id, form or meaning">
    <div class="seg" id="levels" role="group" aria-label="Level"></div>
    <select id="batch" aria-label="Batch"><option value="">All batches</option></select>
    <select id="verdict" aria-label="Review verdict">
      <option value="">Any verdict</option><option value="unreviewed">Not reviewed</option><option value="ok">ok</option><option value="fixed">fixed</option><option value="reject">reject</option>
    </select>
    <span class="count" id="count" aria-live="polite"></span>
  </div>
  <main id="main"></main>
</div>
<script type="application/json" id="data">${data}</script>
<script>
const E = JSON.parse(document.getElementById("data").textContent);
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ids = new Set(E.map((e) => e.id));
const marked = (ja, m) => { const i = ja.indexOf(m); return i < 0 ? esc(ja) : esc(ja.slice(0, i)) + "<mark>" + esc(m) + "</mark>" + esc(ja.slice(i + m.length)); };
const sent = (x) => '<li><p class="ja" lang="ja">' + marked(x.ja, x.match) + '</p><p class="en">' + esc(x.en) + "</p></li>";
const near = (x) => '<li><p class="ja" lang="ja">' + esc(x.ja) + '</p><p class="en">' + esc(x.en) + '</p><p class="why">Not a match: ' + esc(x.why) + "</p></li>";
const links = (list) => list.length ? '<div class="chips">' + list.map((r) => ids.has(r) ? '<a href="#p-' + esc(r) + '">' + esc(r) + "</a>" : "<span>" + esc(r) + "</span>").join("") + "</div>" : "<p>None</p>";
const label = { unreviewed: "not reviewed" };

function notes(e) {
  const src = Object.entries(e.sources || {}).map(([k, v]) => k + " " + v).join(", ");
  return '<div class="grid">' +
    (e.changes.length ? "<div><h4>Review " + esc(e.verdict) + "</h4><ul>" + e.changes.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul></div>" : "") +
    '<div><h4>Variants</h4><div class="chips">' + e.variants.map((v) => '<span lang="ja">' + esc(v) + "</span>").join("") + "</div></div>" +
    '<div><h4>Connection</h4><div class="chips">' + e.connection.map((v) => '<span lang="ja">' + esc(v) + "</span>").join("") + "</div></div>" +
    '<div><h4>Near misses</h4><ul class="sents">' + e.counterexamples.map(near).join("") + "</ul></div>" +
    "<div><h4>Subsumes</h4>" + links(e.subsumes) + "</div>" +
    "<div><h4>Confusables</h4>" + links(e.confusables) + "</div>" +
    '<div><h4>Detection</h4><p class="detect">' + esc(e.detection) + "</p></div>" +
    '<div><h4>Register and sources</h4><p class="detect">' + esc(e.register) + " · " + esc(e.kind) + " · " + esc(src) + "</p></div>" +
    "</div>";
}

function card(e) {
  const a = document.createElement("article");
  a.className = "entry" + (e.verdict === "reject" ? " rejected" : "");
  a.id = "p-" + e.id;
  const rest = e.examples.length - 3;
  a.innerHTML = '<div class="head"><h3 class="form" lang="ja">' + esc(e.form) + '</h3><span class="pill v-' + esc(e.verdict) + '">' + esc(label[e.verdict] || e.verdict) + "</span>" +
    '<p class="meaning">' + esc(e.meaning) + '</p><div class="meta">' + esc(e.id) + " · " + esc(e.level) + " · " + esc(e.batch) + "</div></div>" +
    '<ul class="sents">' + e.examples.slice(0, 3).map(sent).join("") + "</ul>" +
    (rest > 0 ? '<ul class="sents" hidden>' + e.examples.slice(3).map(sent).join("") + '</ul><button class="more" type="button" aria-expanded="false">Show all ' + e.examples.length + " sentences</button>" : "") +
    '<details class="notes"><summary>Reviewer notes</summary></details>';
  const more = a.querySelector(".more");
  if (more) more.addEventListener("click", () => {
    const list = more.previousElementSibling, open = list.hidden;
    list.hidden = !open; more.setAttribute("aria-expanded", open);
    more.textContent = open ? "Show fewer" : "Show all " + e.examples.length + " sentences";
  });
  const d = a.querySelector("details");
  d.addEventListener("toggle", () => { if (d.open && !d.dataset.done) { d.insertAdjacentHTML("beforeend", notes(e)); d.dataset.done = "1"; } }, { once: false });
  return a;
}

const main = document.getElementById("main");
const sections = {};
for (const lv of LEVELS) {
  const list = E.filter((e) => e.level === lv);
  if (!list.length) continue;
  const s = document.createElement("section");
  s.innerHTML = '<h2 class="level">' + lv + ' · <span></span></h2><div class="list"></div>';
  const box = s.querySelector(".list");
  for (const e of list) { e.el = card(e); box.append(e.el); }
  main.append(s);
  sections[lv] = s;
}

const by = (k) => E.reduce((m, e) => (m[e[k]] = (m[e[k]] || 0) + 1, m), {});
const v = by("verdict"), lv = by("level");
document.getElementById("stats").innerHTML = "<span><b>" + E.length + "</b> patterns</span>" +
  LEVELS.filter((l) => lv[l]).map((l) => "<span>" + l + " <b>" + lv[l] + "</b></span>").join("") +
  ["ok", "fixed", "reject", "unreviewed"].filter((k) => v[k]).map((k) => "<span>" + (label[k] || k) + " <b>" + v[k] + "</b></span>").join("");

const levelBox = document.getElementById("levels");
let level = "";
for (const l of ["", ...LEVELS.filter((l) => lv[l])]) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = l || "All"; b.setAttribute("aria-pressed", l === level);
  b.addEventListener("click", () => { level = l; levelBox.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); apply(); });
  levelBox.append(b);
}
const batchSel = document.getElementById("batch");
for (const b of [...new Set(E.map((e) => e.batch))]) batchSel.insertAdjacentHTML("beforeend", '<option value="' + b + '">' + b + "</option>");
const q = document.getElementById("q"), verdictSel = document.getElementById("verdict");

function apply() {
  const t = q.value.trim().toLowerCase();
  let shown = 0;
  for (const e of E) {
    const hit = (!level || e.level === level) && (!batchSel.value || e.batch === batchSel.value) && (!verdictSel.value || e.verdict === verdictSel.value) &&
      (!t || (e.id + " " + e.form + " " + e.meaning + " " + e.variants.join(" ")).toLowerCase().includes(t));
    e.el.hidden = !hit; if (hit) shown++;
  }
  for (const [l, s] of Object.entries(sections)) {
    const n = E.filter((e) => e.level === l && !e.el.hidden).length;
    s.hidden = n === 0; s.querySelector(".level span").textContent = n + (n === 1 ? " pattern" : " patterns");
  }
  document.getElementById("count").textContent = shown + " of " + E.length;
}
q.addEventListener("input", apply); batchSel.addEventListener("change", apply); verdictSel.addEventListener("change", apply);
// A link to a card hidden by the filters clears them first, so the link always lands.
document.addEventListener("click", (ev) => {
  const a = ev.target.closest('a[href^="#p-"]'); if (!a) return;
  const el = document.getElementById(a.getAttribute("href").slice(1));
  if (el && el.hidden) { q.value = ""; batchSel.value = ""; verdictSel.value = ""; level = ""; levelBox.querySelector("button").click(); }
});
apply();
</script>
`;
writeFileSync(out, html);
console.log(`${entries.length} patterns -> ${out}`);
