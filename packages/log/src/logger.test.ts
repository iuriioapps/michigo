import { readFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MichigoError } from "@michigo/core";
import { createLogger } from "./logger";

const home = "/Users/learner";
const dataDir = path.join(home, "Library/Application Support/Michigo");

function setup() {
  const lines: string[] = [];
  const logger = createLogger({
    process: "main",
    write: (line) => lines.push(line),
    dataDir,
    homeDir: home,
    now: () => Date.UTC(2026, 10, 23, 9, 30),
  });
  const parsed = () =>
    lines.map((line): Record<string, unknown> =>
      z.record(z.string(), z.unknown()).parse(JSON.parse(line)),
    );

  return { lines, logger, parsed };
}

function caught(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected a throw");
}

describe("createLogger", () => {
  it("writes one JSON line with the fixed fields first and the caller's fields after", () => {
    const { lines, parsed, logger } = setup();

    logger.info("anki", "anki.sync.done", { actionId: "a1", count: 3, durationMs: 12 });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.endsWith("\n")).toBe(true);
    expect(parsed()[0]).toEqual({
      time: "2026-11-23T09:30:00.000Z",
      level: "info",
      process: "main",
      scope: "anki",
      event: "anki.sync.done",
      actionId: "a1",
      count: 3,
      durationMs: 12,
    });
  });

  it("does not let a field overwrite a fixed field", () => {
    const { parsed, logger } = setup();

    logger.warn("ipc", "ipc.slow", { level: "info", process: "renderer", event: "x" });

    expect(parsed()[0]).toMatchObject({ level: "warn", process: "main", event: "ipc.slow" });
  });

  it("logs only the name, code and frames of a Node error, never its message or path", async () => {
    const { lines, parsed, logger } = setup();
    const error = await readFile("/Users/learner/Videos/MyShow.srt").catch(
      (cause: unknown) => cause,
    );

    logger.error("source", "source.read.failed", {}, error);

    expect(lines[0]).not.toContain("MyShow");
    expect(parsed()[0]?.["error"]).toEqual({
      name: "Error",
      code: "ENOENT",
      frames: expect.any(Array),
    });
  });

  it("logs the code and numeric errcode of a SQLite error, never its message", () => {
    const { lines, parsed, logger } = setup();
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE words (spelling TEXT UNIQUE)");
    db.exec("INSERT INTO words VALUES ('猫')");
    const error = caught(() => db.exec("INSERT INTO words VALUES ('猫')"));

    logger.error("storage", "word.insert.failed", {}, error);

    expect(lines[0]).not.toContain("UNIQUE");
    expect(parsed()[0]?.["error"]).toMatchObject({
      name: "Error",
      code: "ERR_SQLITE_ERROR",
      errcode: 2067,
    });
  });

  it("logs the path and code of each zod issue, never the received value", () => {
    const { lines, parsed, logger } = setup();
    const schema = z.object({ name: z.string(), tags: z.array(z.literal("ok")) });
    const error = caught(() => schema.parse({ name: 42, tags: ["secret-title"] }));

    logger.error("ipc", "ipc.failed", {}, error);

    expect(lines[0]).not.toContain("secret-title");
    expect(parsed()[0]?.["error"]).toEqual({
      name: "ZodError",
      issues: [
        { path: "name", code: "invalid_type" },
        { path: "tags.0", code: "invalid_value" },
      ],
      frames: expect.any(Array),
    });
  });

  it("keeps only the stack frames, without the message line", () => {
    const { lines, logger } = setup();

    logger.error("x", "x.failed", {}, new Error("line one\nline two"));

    expect(lines[0]).not.toContain("line one");
    expect(lines[0]).not.toContain("line two");
    expect(lines[0]).toContain('"frames":["at ');
  });

  it("replaces the home folder in stack frames with ~", () => {
    const { lines, parsed, logger } = setup();
    const error = new TypeError("boom");
    error.stack = [
      "TypeError: boom",
      `    at load (${home}/Applications/Michigo.app/Contents/main.js:1:2)`,
      `    at file://${home}/Applications/Michigo.app/index.js:3:4`,
    ].join("\n");

    logger.error("x", "x.failed", {}, error);

    expect(lines[0]).not.toContain(home);
    expect(parsed()[0]?.["error"]).toEqual({
      name: "TypeError",
      frames: [
        "at load (~/Applications/Michigo.app/Contents/main.js:1:2)",
        "at file://~/Applications/Michigo.app/index.js:3:4",
      ],
    });
  });

  it("replaces a URL-encoded home folder in a renderer frame with ~", () => {
    const lines: string[] = [];
    const logger = createLogger({
      process: "renderer",
      write: (line) => lines.push(line),
      dataDir,
      homeDir: "/Users/山田 太郎",
    });
    const error = new Error("boom");
    error.stack =
      "Error: boom\n    at file:///Users/%E5%B1%B1%E7%94%B0%20%E5%A4%AA%E9%83%8E/app.js:1:2";

    logger.error("app", "uncaught.error", {}, error);

    expect(lines[0]).toContain('"frames":["at file://~/app.js:1:2"]');
  });

  it("logs the message of a Michigo error, which is a code", () => {
    const { parsed, logger } = setup();

    logger.error("anki", "anki.sync.failed", {}, new MichigoError("anki.closed"));

    expect(parsed()[0]?.["error"]).toMatchObject({ name: "MichigoError", message: "anki.closed" });
  });

  it("logs a thrown non-error by its type only", () => {
    const { lines, logger } = setup();

    logger.error("x", "x.failed", {}, "MyShow.srt");

    expect(lines[0]).not.toContain("MyShow");
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ error: { name: "string" } });
  });

  it("logs a path inside the data folder relative to it", () => {
    const { parsed, logger } = setup();

    logger.info("storage", "db.opened", { file: path.join(dataDir, "michigo.db") });

    expect(parsed()[0]?.["file"]).toBe("michigo.db");
  });

  it("never logs a path outside the data folder", () => {
    const { lines, parsed, logger } = setup();

    logger.info("source", "source.import.start", {
      file: "/Users/learner/Videos/MyShow.srt",
      sibling: `${dataDir}-old/michigo.db`,
      kind: "srt",
    });

    expect(lines[0]).not.toContain("MyShow");
    expect(parsed()[0]).not.toHaveProperty("file");
    expect(parsed()[0]).not.toHaveProperty("sibling");
    expect(parsed()[0]?.["kind"]).toBe("srt");
  });
});
