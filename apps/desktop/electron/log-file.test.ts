// @vitest-environment node
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { LOG_FILE_COUNT, LOG_FILE_MAX_BYTES, createLogFile } from "./log-file";

async function folder(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "michigo-log-"));
}

describe("createLogFile", () => {
  it("rotates at 5 MB and keeps 3 files", () => {
    expect(LOG_FILE_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(LOG_FILE_COUNT).toBe(3);
  });

  it("appends lines in the order they were written, creating the folder", async () => {
    const dir = path.join(await folder(), "logs");
    const file = createLogFile(dir);

    file.write("one\n");
    file.write("two\n");
    await file.flushed();

    expect(await readFile(path.join(dir, "michigo.log"), "utf8")).toBe("one\ntwo\n");
  });

  it("keeps at most the given number of files, none above the size limit", async () => {
    const dir = await folder();
    const file = createLogFile(dir, { maxBytes: 100, files: 3 });

    for (let index = 0; index < 50; index += 1) {
      file.write(`${"x".repeat(20)}${String(index).padStart(3, "0")}\n`);
    }
    await file.flushed();

    const names = (await readdir(dir)).toSorted();
    expect(names).toEqual(["michigo.1.log", "michigo.2.log", "michigo.log"]);
    for (const name of names) {
      expect((await stat(path.join(dir, name))).size).toBeLessThanOrEqual(100);
    }
    // The newest line is in the current file, and the oldest are gone.
    expect(await readFile(path.join(dir, "michigo.log"), "utf8")).toContain("x049\n");
    expect(await readFile(path.join(dir, "michigo.2.log"), "utf8")).not.toContain("x000\n");
  });

  it("counts the size of a file left by an earlier run", async () => {
    const dir = await folder();
    const first = createLogFile(dir, { maxBytes: 10, files: 2 });
    first.write("12345678\n");
    await first.flushed();

    const second = createLogFile(dir, { maxBytes: 10, files: 2 });
    second.write("abc\n");
    await second.flushed();

    expect(await readFile(path.join(dir, "michigo.1.log"), "utf8")).toBe("12345678\n");
    expect(await readFile(path.join(dir, "michigo.log"), "utf8")).toBe("abc\n");
  });

  it("drops lines instead of growing the file when it cannot rotate", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const dir = await folder();
    // A folder in the place of the oldest file makes the rotation fail.
    await mkdir(path.join(dir, "michigo.1.log", "blocked"), { recursive: true });
    const file = createLogFile(dir, { maxBytes: 10, files: 2 });

    for (let index = 0; index < 20; index += 1) {
      file.write("123456\n");
    }
    await file.flushed();

    expect((await stat(path.join(dir, "michigo.log"))).size).toBeLessThanOrEqual(10);
  });

  it("drops the queued lines when the folder cannot be made", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const parent = await folder();
    await writeFile(path.join(parent, "logs"), "a file, not a folder");
    const file = createLogFile(path.join(parent, "logs"));

    file.write("lost\n");
    await file.flushed();

    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
