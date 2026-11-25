---
paths:
  - "packages/tokenizer/**"
---

# Tokenizer

Decided in `docs/adr/0005-unidic-2025-12-with-the-native-lindera-binding.md`. The rules for code:

- Only `packages/tokenizer` imports `lindera`. It names the binding as a peer dependency, and the desktop app carries it in `dependencies`.
- Use the native `lindera` binding. `lindera-wasm` needs a 2 GB heap for this dictionary, and Lindera's filters do nothing in it.
- The tokenizer dictionary downloads on first start into one folder per build in the shared data folder. It is never in the repo, the installer or a bundle.
- One constant names the dictionary build (UniDic version plus Lindera version). The app refuses to tokenize with any other build.
- Keep the UniDic version fixed within a major version of Michigo. Lexeme keys differ between versions, so a change is a migration.
- The tokenizer utility process opens no database (see "Threads and I/O" in `CLAUDE.md`).
