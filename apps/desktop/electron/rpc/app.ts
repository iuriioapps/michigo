import process from "node:process";

import { ankiModule } from "@michigo/anki";
import { describeRuntime } from "@michigo/core";
import { vocabModule } from "@michigo/vocab";
import { app as electronApp } from "electron";

import { os } from "./base";

export const app = {
  info: os.app.info.handler(() =>
    describeRuntime({
      app: electronApp.getName(),
      version: electronApp.getVersion(),
      modules: [vocabModule, ankiModule],
      electron: process.versions.electron,
    }),
  ),
};
