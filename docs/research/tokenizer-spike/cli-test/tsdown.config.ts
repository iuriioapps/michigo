import { defineConfig } from "tsdown";
export default defineConfig({
  entry: ["src/index.ts"], format: "esm", platform: "node", target: "node24", fixedExtension: false,
  noExternal: [/.*/],
  loader: { ".wasm": "binary" },
  outputOptions: { codeSplitting: false },
});
