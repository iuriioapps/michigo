// Merges the five inventories into the final candidate set: node merge.mjs <grammar folder>
// Writes final-inventory.json, final-ids.json and merge-log.md into that folder.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const files = ["n5", "n4", "n3", "n2", "n1"];
const log = [];
const all = files.flatMap((f) => JSON.parse(readFileSync(join(dir, `inventory-${f}.json`), "utf8")));

// Particles that carry a meaning of their own. Every other single particle (は, が, を, に, で, の, よ, ね, sentence-final わ, ぞ, さ) is too common to be a pattern.
const KEEP_PARTICLE_IDS = new Set(["dake", "dake-gendo", "kurai", "yori", "demo", "nado", "shi", "kana", "kashira", "mo-emphasis", "made-even", "nanka-nante", "hodo", "bakari", "sae", "koso", "tte-shudai", "tte-kyouchou", "kke", "zutsu", "kiri", "datte", "nomi", "nominarazu", "tteba", "sura", "tote", "na-prohibitive"]);
// Classical auxiliaries with a meaning of their own, filed as inflections by the inventories.
const KEEP_INFLECTION_IDS = new Set(["mai", "beku", "gotoki", "majiki", "bekarazu", "taru", "na-prohibitive"]);
// The same pattern under two ids: [dropped, kept].
const SAME = [["sukoshimo-nai", "sukoshi-mo-nai"], ["te-shouganai", "te-shou-ga-nai"], ["wa-betsu-toshite", "wa-betsu-to-shite"], ["to-iu-wake-dewa-nai", "to-iu-wake-de-wa-nai"], ["tsu-tsu", "tsutsu"]];
// Broad entries with no surface marker of their own.
const DROP_IDS = new Set(["relative-clause"]);

const kept = [];
for (const e of all) {
  if (DROP_IDS.has(e.id)) { log.push(`drop ${e.id}: no surface marker`); continue; }
  if (e.kind === "word") continue;
  if (e.kind === "inflection" && !KEEP_INFLECTION_IDS.has(e.id)) continue;
  if (e.kind === "particle" && !KEEP_PARTICLE_IDS.has(e.id)) continue;
  kept.push(e.kind === "inflection" ? { ...e, kind: "construction" } : e);
}
const dropSame = new Map(SAME);
for (const e of kept) if (dropSame.has(e.id)) { log.push(`merge ${e.id} into ${dropSame.get(e.id)}`); e.id = dropSame.get(e.id); }

// Combine entries that share an id: union of sources, level by majority vote, a tie goes to the lower level.
const byId = new Map();
for (const e of kept) (byId.get(e.id) ?? byId.set(e.id, []).get(e.id)).push(e);
const out = [];
for (const [id, group] of byId) {
  const sources = Object.assign({}, ...group.map((g) => g.sources));
  const votes = new Map();
  for (const lv of Object.values(sources)) if (LEVELS.includes(lv)) votes.set(lv, (votes.get(lv) ?? 0) + 1);
  const best = Math.max(0, ...votes.values());
  const level = LEVELS.find((lv) => votes.get(lv) === best) ?? group[0].level;
  const base = group.find((g) => g.kind === "construction" && g.level === level) ?? group.find((g) => g.kind === "construction") ?? group[0];
  const variants = [...new Set(group.flatMap((g) => g.variants ?? []))];
  const notes = [...new Set(group.map((g) => g.notes).filter(Boolean))].join(" | ");
  if (group.length > 1) log.push(`combine ${id}: ${group.map((g) => g.level).join("+")} -> ${level}`);
  out.push({ id, form: base.form, variants, meaning: base.meaning, kind: base.kind, register: base.register ?? null, level, sources, prototype: group.some((g) => g.prototype), notes });
}
// Purpose ように: both N4 and N3 left it to the other.
if (!byId.has("you-ni")) {
  out.push({ id: "you-ni", form: "〜ように", variants: ["〜ないように", "〜ようにと"], meaning: "so that, in order that (purpose with a non-volitional verb)", kind: "construction", register: null, level: "N3", sources: { jlptsensei: "N3", tanos: "N3", jt4y: "N3", bunpro: "N4", marumori: "N4" }, prototype: true, notes: "Added at merge: the N4 and N3 inventories each left it to the other. Confusable with you-ni-suru, you-ni-naru and ように as a wish or request." });
  log.push("add you-ni: missing from every inventory");
}
out.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
writeFileSync(join(dir, "final-inventory.json"), JSON.stringify(out, null, 2) + "\n");
writeFileSync(join(dir, "final-ids.json"), JSON.stringify(out.map((e) => e.id)) + "\n");
const counts = LEVELS.map((lv) => `${lv}: ${out.filter((e) => e.level === lv).length}`).join(", ");
writeFileSync(join(dir, "merge-log.md"), `# Merge log\n\n${out.length} candidates (${counts}).\n\n${log.map((l) => `- ${l}`).join("\n")}\n`);
console.log(out.length, counts);
