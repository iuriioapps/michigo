# Grammar Patterns are Michigo's own code, without JLPT levels

Michigo detects Grammar Patterns with matchers that the project writes itself. The matchers are TypeScript code in `packages/grammar`. The package takes tokens and returns matches: a pattern ID and a position in the text. It imports no tokenizer and no storage.

Comprehension is not only a vocabulary problem. The grammar tab of a Source or a Project tells the learner which grammar the text needs and which of it they do not know yet. A JLPT level adds nothing to that answer. No official grammar list exists since 2010, and the unofficial lists and the textbooks disagree, so a Grammar Pattern has no level in v1.

One open rule set exists: Kaidoku (MIT, 341 JSON rules for N5 to N3). Michigo takes ideas from it and copies nothing. Its rules name IPADIC tags, and Michigo's tokenizer will use another dictionary, so every rule needs a rewrite and a new proof in any case. Its project is weeks old and has one author. Rules as data would also need a matcher language with the full power of code, and nobody but a contributor with tokenizer knowledge can write a correct rule.

## The pattern rule

One Grammar Pattern is one object in one file: ID, display form, one-line English meaning, matcher, examples and counterexamples. **A pattern without examples and counterexamples does not ship.** The tests run both through the real tokenizer. Precision comes first: a pattern that often fires on text that is not the pattern does not ship. A pattern ID never changes after release, because the learner's Known marks attach to it.

## Considered options

- Port the Kaidoku rules. Rejected: the IPADIC tags force a rewrite of every rule, and the reported precision does not carry over to another tokenizer.
- Rules as data that the learner imports. Rejected: no usable rule file exists to import, and a wrong rule teaches the learner to ignore the grammar tab.
- A JLPT level on each pattern. Rejected for v1: the level would be Michigo's own guess with an official-looking name.
- Levels from the JLPT list that the learner imports. Rejected: nobody publishes a file that maps Michigo's pattern IDs to levels.

## Consequences

A new Grammar Pattern reaches learners only with a new app version. Michigo detects grammar again for a Source when its stored result comes from an older pattern set. A change of tokenizer or dictionary shows at once which patterns broke, because each pattern carries its own tests. The learner marks patterns Known one at a time, because no level exists to mark in bulk.
