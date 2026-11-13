# UniDic 2025.12 with the native Lindera binding, pinned for v1

Michigo v1 tokenizes with UniDic 2025.12 through the native Lindera binding, in the desktop app and in the CLI. The Tokenizer dictionary is 1 GB on disk and a download of about 385 MB. Michigo builds it, hosts it and downloads it on first start.

The tokenizer decides what a word is, so its errors reach every coverage number. In a judged sample of 150 regions where the two versions differ, UniDic 2.1.2 is wrong in 43 and 2025.12 in 18. Version 2025.12 knows current spoken forms and names (やべぇ, フリーレン), and each token carries an accent field that Michigo uses for pitch. The learner pays for the size once, at first start.

## The pin

**v1 never changes the UniDic version. A new UniDic version is a new major version of Michigo.** Lexeme keys differ for 3.94% of tokens between 2.1.2 and 2025.12, so a change is a migration of the Word Bank. Starting on 2025.12 means that v1 needs none.

A dictionary build is identified by the UniDic version plus the Lindera version that built it. The desktop app and the CLI use the same build and refuse to tokenize with any other. A new Lindera version means a rebuild of the same UniDic version and a new download. The lexeme keys stay the same.

## Delivery

- Both apps use the native binding. It maps the dictionary from disk and uses about 50 MB after load.
- The CLI ships inside the desktop app's install. It is not one file, and Michigo publishes no separate CLI package in v1.
- A script in the repo builds the dictionary: download from NINJAL, compact the connection matrix, build with Lindera, pack. A manual GitHub Actions workflow runs it, and a local run is the fallback.
- The archive sits in a GitHub release of its own. The manifest entry holds the URL, the size and a SHA-256 hash.
- The download resumes, checks free disk space and the hash, and installs with one atomic rename into one folder per build in the shared data folder.

## Considered options

- UniDic 2.1.2. Rejected: 46 MB to download and prebuilt by Lindera, but more than twice the errors in the judged sample, no accent field, and a migration later.
- UniDic 3.1.1. Rejected: 716 MB on disk, so it saves little, and it is not the latest.
- The WASM build. Rejected: it holds the dictionary in a heap of 2 GB that never shrinks, and Lindera's filters do nothing in it.
- WASM as a fallback on other platforms. Rejected: it would give different tokens once a filter is in use.
- A one-file CLI. Rejected: the native binding is a per-platform module and cannot be bundled.
- The dictionary in the installer. Rejected: no reference data ships in the installer, and the dictionary changes far less often than the app.

## Consequences

The first start needs a network connection and about 1.5 GB of free disk space. Michigo supports only the platforms for which Lindera publishes a native binding: the tokens are identical on macOS x64, macOS arm64, Linux x64 and Windows x64.

Michigo owns the build. It peaks at 13.3 GB of RAM, which fits a standard GitHub runner with 15 GB usable, but with a thin margin. The build is reproducible: the files are identical on the runner and on a local machine.

The native binding is the first entry in `dependencies` of both apps and loads from `app.asar.unpacked`.
