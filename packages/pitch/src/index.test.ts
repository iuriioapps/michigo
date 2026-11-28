import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ModuleInfoSchema } from "@michigo/core/schemas";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { pitchModule } from "./index";

const PackageSchema = z.object({ name: z.string(), version: z.string() });

const pkg = PackageSchema.parse(
  JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")),
);

describe("pitchModule", () => {
  it("satisfies the shared ModuleInfo schema", () => {
    expect(ModuleInfoSchema.safeParse(pitchModule).success).toBe(true);
  });

  // Guards against the hand-written constant drifting from package.json.
  it("matches the real package name and version", () => {
    expect(pitchModule.name).toBe(pkg.name);
    expect(pitchModule.version).toBe(pkg.version);
  });
});
