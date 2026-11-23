import { parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(workerData.dbPath);
db.exec("pragma journal_mode = wal; create table t(x text); create virtual table f using fts5(x, tokenize='trigram');");
const ins = db.prepare("insert into t values (?)");
const t0 = performance.now();
db.exec("begin");
for (let i = 0; i < 100000; i++) ins.run("猫が好きです" + i);
db.exec("commit");
const ms = Math.round(performance.now() - t0);
db.exec("insert into f values ('東京の猫が好きです')");
const mode = db.prepare("pragma journal_mode").get().journal_mode;
const rows = db.prepare("select count(*) n from t").get().n;
const fts = db.prepare("select count(*) n from f where f match '猫が好'").get().n;
db.close();
parentPort.postMessage({ mode, rows, insert100kMs: ms, fts });
