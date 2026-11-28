import process from "node:process";

import { ankiModule } from "@michigo/anki";
import { audioModule } from "@michigo/audio";
import { describeRuntime } from "@michigo/core";
import { pitchModule } from "@michigo/pitch";
import { referenceModule } from "@michigo/reference";
import { storageModule } from "@michigo/storage";
import { vocabModule } from "@michigo/vocab";
import { EventPublisher } from "@orpc/server";
import { app as electronApp } from "electron";

import { os } from "./base";

export interface MainErrors {
  /** Sends `code` to every page that listens, or keeps it until one does. */
  report(code: string): void;
  /** Yields the kept code, if any, and then every code reported after it. */
  subscribe(signal?: AbortSignal): AsyncGenerator<string>;
}

export function createMainErrors(): MainErrors {
  const publisher = new EventPublisher<{ error: string }>();
  // Only the last one: the page shows one error at a time.
  let kept: string | undefined;

  return {
    report(code) {
      if (publisher.size === 0) {
        kept = code;
      } else {
        publisher.publish("error", code);
      }
    },
    async *subscribe(signal) {
      // Subscribed before the kept code is handed out, so no code falls between.
      const codes = publisher.subscribe("error", { signal });

      try {
        if (kept !== undefined) {
          const code = kept;

          kept = undefined;
          yield code;
        }
        yield* codes;
      } finally {
        // A page that leaves stops listening, so the next code is kept again.
        await codes.return(undefined);
      }
    },
  };
}

export const app = {
  info: os.app.info.handler(() =>
    describeRuntime({
      app: electronApp.getName(),
      version: electronApp.getVersion(),
      modules: [storageModule, referenceModule, pitchModule, vocabModule, ankiModule, audioModule],
      electron: process.versions.electron,
    }),
  ),
  errors: os.app.errors.handler(({ context, signal }) => context.mainErrors.subscribe(signal)),
};
