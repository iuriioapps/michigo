// Tests if ANALYZE alone fixes the slow spelling-plus-reading lookup in the plain JMnedict file.
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.argv[2]);
const tables = db
  .prepare("select name, sql from sqlite_master where type in ('table','index')")
  .all();
for (const t of tables) console.log(t.sql);
const cols = db
  .prepare("pragma table_info(terms)")
  .all()
  .map((c) => c.name);
const [e, r] = [cols.find((c) => /expr|spell/.test(c)), cols.find((c) => /read/.test(c))];
const sample = db
  .prepare(`select ${e} as e, ${r} as r from terms where rowid % 600 = 0 limit 1000`)
  .all();
const q = `select * from terms where ${e} = ? and ${r} = ?`;
const run = (label) => {
  console.log(
    label,
    "plan:",
    db
      .prepare("explain query plan " + q)
      .all("x", "y")
      .map((p) => p.detail)
      .join(" | "),
  );
  const st = db.prepare(q),
    ts = [];
  for (const s of sample) {
    const t0 = performance.now();
    st.all(s.e, s.r);
    ts.push(performance.now() - t0);
  }
  ts.sort((a, b) => a - b);
  console.log(
    label,
    `median ${(ts[500] * 1000).toFixed(0)} µs, p95 ${(ts[950] * 1000).toFixed(0)} µs`,
  );
};
run("before ANALYZE");
const t0 = performance.now();
db.exec("ANALYZE");
console.log("ANALYZE took", ((performance.now() - t0) / 1000).toFixed(2), "s");
run("after ANALYZE");
