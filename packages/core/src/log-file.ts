import { appendFile, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

export const LOG_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const LOG_FILE_COUNT = 3;

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
      await rename(nameOf(index), nameOf(index + 1)).catch(() => undefined);
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
    for (let line = queue.shift(); line !== undefined; line = queue.shift()) {
      const bytes = Buffer.byteLength(line);

      if (size > 0 && size + bytes > maxBytes) {
        await rotate();
        size = 0;
      }
      await appendFile(nameOf(0), line);
      size += bytes;
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
      queue.push(line);
      kick();
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
