# One replaceable Manifest, with the tokenizer hash in the app

Every download in Michigo goes through one Manifest: a JSON file that lists the Tokenizer dictionary and the Reference data with their URLs. The address of the Manifest is a setting. A host can change without a new release of Michigo, and anyone can publish a Manifest and its files.

The installer holds no Reference data, and GitHub states no bandwidth limit for release assets, so a fixed download address in the app is a risk. A Manifest at a configurable address removes that risk. It also lets a community host data that Michigo cannot host.

## The hash pin

**The app carries the SHA-256 of its Tokenizer dictionary build and accepts that file from any host only when the hash matches.** A hash in a Manifest proves only that a file matches that Manifest. The Tokenizer dictionary loads through a native binding and decides what a word is, so a Manifest can move it but can never replace it.

Reference data from any Manifest is untrusted input. The app never unpacks an archive to disk: it reads the files that it knows straight into the database, so it uses no file path from the archive. It reads at most 256 MB per file, 4 GB in total and 100,000 entries, and it validates each row against a schema that Michigo names. A change of the Manifest address shows one warning that names the new host.

## The Manifest

- One active Manifest at a time, with a button that returns to Michigo's own. The app holds a copy of Michigo's Manifest from build time and uses it when the fetch fails.
- The file has a `schemaVersion`. An app that reads a newer one keeps its built-in copy and tells the learner to update Michigo.
- An entry holds a stable `id`, a `kind`, the `schema` of the file, a title, a `version`, an ordered `urls` list, `size`, `sha256`, and `license` and `credit` text.
- An entry that points at a live publisher is unpinned: it has no hash and no size, and the app validates its schema only. The Jiten frequency list is the one such entry in Michigo's Manifest.
- The app saves `license` and `credit` with the installed data, so the About screen keeps the credit after a Manifest change.
- Installed data stays when the Manifest changes. An item that the new Manifest does not list stays usable, with no update.

## Considered options

- One origin setting per source. Rejected: a host change would need one edit per source by every learner, and a community could not publish a set.
- Michigo's Manifest plus extra ones. Rejected for v1: it needs merge rules and conflict handling, and manual import already covers one extra Dictionary.
- The tokenizer hash in the Manifest only. Rejected: a foreign Manifest could then feed any file to the native binding.
- Fixed URLs in the app. Rejected: a host change would need a release, and the old versions would stop working.
- Indexed Dictionary files as the hosted format. Rejected: 268 MB against 28 MB of Yomitan zips, and the learner's machine builds the index in about 10 seconds. The zip is also the schema for manual import, so one reader serves both.

## Consequences

A new Tokenizer dictionary build needs a new release of Michigo, because the hash is in the app. This fits the rule that the app refuses any other build.

An unpinned entry has no integrity check beyond its schema. Michigo accepts this for the Jiten list, because a frequency rank is Word metadata only and no action in v1 depends on it.

A learner on a community Manifest gets no Reference data updates from Michigo until they return to Michigo's Manifest.
