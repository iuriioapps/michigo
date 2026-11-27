// Writes one issue body per implementation batch: node make.mjs <details dir> <out dir> <label> <parent> <first batch> <last batch>
import { readFileSync, writeFileSync } from "node:fs";
const [dir, out, label, parent, from, to] = process.argv.slice(2);
const files = [];
for (let n = +from; n <= +to; n++) files.push("b" + String(n).padStart(2, "0"));
const ship = [];
for (const b of files) {
  const log = new Map(JSON.parse(readFileSync(`${dir}/../logs/${b}.json`, "utf8")).map((l) => [l.id, l.verdict]));
  for (const e of JSON.parse(readFileSync(`${dir}/${b}.json`, "utf8"))) if (log.get(e.id) !== "reject") ship.push({ ...e, batch: b });
}
const count = Math.round(ship.length / 15), size = ship.length / count;
const groups = Array.from({ length: count }, (_, i) => ship.slice(Math.round(i * size), Math.round((i + 1) * size)));
const cell = (s) => s.replaceAll("|", "\\|");
groups.forEach((g, i) => {
  const body = `## What to build

- Ship the ${g.length} Grammar Patterns below as tested patterns in \`packages/grammar\`, in one pull request (a stack when it outgrows the size rule).
- Each pattern comes from its entry in \`docs/research/grammar-patterns/details/<file>.json\` on the \`research/grammar-patterns\` branch: the display form, the meaning, the examples, the near misses and the \`detection\` note. The notes were checked against UniDic 2025.12 tokens with \`tools/tokenize.mjs\`.

## Patterns

| Id | Form | Meaning | File |
| --- | --- | --- | --- |
${g.map((e) => `| \`${e.id}\` | ${cell(e.form)} | ${cell(e.meaning)} | ${e.batch} |`).join("\n")}

## Done when

- [ ] Every pattern above ships, or is dropped in ${parent} with a one-line reason.
- [ ] Every matcher is checked against the real tokenizer, with the entry's examples and near misses as tests (at least 5 and 3), and passes the 95% corpus check.
- [ ] Pattern names are ids, and their text is in the app catalog.
- [ ] Meets \`docs/quality-targets.md\` where it applies: the budgets it touches are measured on the reference machine and recorded in the PR, visible text is in the catalog, dates use \`Temporal\`, events are logged with the \`actionId\`, and Japanese text has \`lang="ja"\`.
- [ ] \`pnpm check\` passes, and new logic has tests.

## Decisions

- [How many Grammar Patterns does v1 ship?](https://github.com/iuriioapps/michigo/issues/120)
- [What does grammar detection show?](https://github.com/iuriioapps/michigo/issues/49)
- [ADR 0003](https://github.com/iuriioapps/michigo/blob/main/docs/adr/0003-grammar-patterns-are-own-code-without-jlpt-levels.md)

## Screens

- None: this issue has no screen of its own.

## Blocked by

- [Grammar package and the first patterns](https://github.com/iuriioapps/michigo/issues/202)

## Notes

- Part of ${parent}. A pattern that #202 already shipped needs no work here; say so in the PR.
- \`subsumes\` and \`confusables\` may name ids of other batches. Test a subsumption when both of its patterns have shipped.
- The review log of each entry is in \`logs/<file>.json\` on the same branch, and \`tools/render.mjs\` writes a page that shows the entries as the grammar tab will.`;
  writeFileSync(`${out}/${i + 1}.md`, body);
});
console.log(ship.length, "patterns in", count, "batches:", groups.map((g) => g.length).join(","));
