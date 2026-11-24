import { appendFile, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

export const LOG_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const LOG_FILE_COUNT = 3;
/** Lines waiting for the disk beyond this are dropped, so a flood cannot exhaust memory. */
export const LOG_FILE_MAX_QUEUED_LINES = 10_000;

export interface LogFile {
  write(line: string): void;
  /** Settles once every line written so far is on disk. */
  flushed(): Promise<void>;
}

/**
 * `michigo.log` in `dir`, with older lines in `michigo.1.log`, `michigo.2.log`
 * and so on. Writes are async and in order, so the main thread never blocks.
 */
export function createLogFile(
  dir: string,
  { maxBytes = LOG_FILE_MAX_BYTES, files = LOG_FILE_COUNT } = {},
): LogFile {
  const nameOf = (index: number) =>
    path.join(dir, index === 0 ? "michigo.log" : `michigo.${String(index)}.log`);
  const queue: string[] = [];
  let size: number | undefined;
  let draining: Promise<void> = Promise.resolve();
  let idle = true;

  async function rotate(): Promise<void> {
    await rm(nameOf(files - 1), { force: true });
    for (let index = files - 2; index >= 0; index -= 1) {
      // A missing older file is normal. Any other failure stops this write, so the file cannot grow past the limit.
      await rename(nameOf(index), nameOf(index + 1)).catch((error: unknown) => {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
          throw error;
        }
      });
    }
  }

  async function drain(): Promise<void> {
    if (size === undefined) {
      await mkdir(dir, { recursive: true });
      size = await stat(nameOf(0)).then(
        (stats) => stats.size,
        () => 0,
      );
    }
    // One append per batch of lines that fits, instead of one per line.
    while (queue.length > 0) {
      let chunk = "";
      let chunkBytes = 0;

      for (const line of queue.splice(0)) {
        const bytes = Buffer.byteLength(line);

        if (size + chunkBytes > 0 && size + chunkBytes + bytes > maxBytes) {
          if (chunk !== "") {
            await appendFile(nameOf(0), chunk);
          }
          await rotate();
          size = 0;
          chunk = "";
          chunkBytes = 0;
        }
        chunk += line;
        chunkBytes += bytes;
      }
      await appendFile(nameOf(0), chunk);
      size += chunkBytes;
    }
  }

  function kick(): void {
    if (!idle) {
      return;
    }
    idle = false;
    draining = drain()
      // A failing log must never take the app down, or log its own failure in a loop.
      .catch((error: unknown) => {
        // Retrying the same lines could loop forever, so they are lost.
        queue.length = 0;
        console.error("Michigo could not write its log", error);
      })
      .finally(() => {
        idle = true;
        // A line can arrive after the loop ended but before this callback ran.
        if (queue.length > 0) {
          kick();
        }
      });
  }

  return {
    write(line) {
      if (queue.length < LOG_FILE_MAX_QUEUED_LINES) {
        queue.push(line);
        kick();
      }
    },
    async flushed() {
      // A drain that finds new lines at its end starts the next one.
      let current: Promise<void>;
      do {
        current = draining;
        await current;
      } while (current !== draining);
    },
  };
}
