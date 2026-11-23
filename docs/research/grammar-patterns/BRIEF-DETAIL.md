# Detail stage: one full entry per Grammar Pattern

Read `BRIEF.md` first; every rule there applies. You receive a batch of inventory entries and turn each one into a full entry. You may use the web to check a pattern's meaning, connection rules and nuance, but every sentence and every English line is your own.

## The entry

Keep the inventory keys `id`, `form`, `variants`, `meaning`, `kind`, `level`, `sources`, `prototype` (fix `meaning` or `variants` when they are wrong or incomplete, and say so in your reply). Drop the inventory key `notes`: what it said belongs in `detection` now. Add these keys, and no others:

| Key | Content |
| --- | --- |
| `register` | `spoken`, `neutral` or `written` |
| `connection` | Each way the pattern attaches, in this notation: `V-dict`, `V-masu-stem`, `V-te`, `V-ta`, `V-nai`, `V-nai-stem`, `V-vol`, `V-ba`, `V-plain` (any plain form), `i-Adj`, `i-Adj-stem`, `na-Adj`, `N`, `Clause-plain`, followed by `+` and the fixed part. Example: `["V-te + いる"]` |
| `examples` | At least 6 objects `{"ja", "match", "en"}`. `match` is the exact substring of `ja` that is the pattern, including the conjugated part it attaches to only when needed to be unambiguous, and it occurs exactly once in `ja`. |
| `counterexamples` | At least 3 objects `{"ja", "en", "why"}`. Near misses only (see below). |
| `subsumes` | Ids from the final id list of shorter patterns that sit inside this one and must not also count when this one matches. Example: `nakereba-naranai` subsumes `ba` only if `ba` is in the list. Empty array when none. |
| `confusables` | Ids from the final id list that learners or a matcher easily confuse with this one. Empty array when none. |
| `detection` | 2 to 6 sentences for the person who will write the matcher on UniDic short-unit tokens: which tokens make up the pattern, the UniDic lexeme (語彙素) of the fixed words as far as you know it (UniDic uses kanji lexemes, for example いる is 居る, ある is 有る, しまう is 仕舞う, くださる is 下さる; mark a lexeme you are not sure of with `?`), the context guards that stop false matches, and what the pattern is often confused with. |

## Examples

- Cover every variant in `variants` that occurs in real text, including the casual contractions (てる, ちゃう, なきゃ, とく).
- Mix plain and polite speech, statements and questions, short lines (as in subtitles) and longer sentences. At least one example where the pattern is not at the end of the sentence, when the pattern allows it.
- Vary the verbs, adjectives and nouns. Do not reuse one sentence frame.
- `en` is a natural English translation, not a word-by-word gloss.

## Counterexamples

Each one shares surface text or tokens with the pattern but is a different structure, for example:

- the same characters across a word or phrase boundary (で as a particle against で as the て-form of だ, の as a pronoun in のに);
- a shorter or longer pattern that contains or is contained in this one;
- a homonym with another meaning (ばかり "just did" against ばかり "only", そうだ hearsay against そうだ appearance), when they are separate entries;
- the plain words of the pattern used in their literal sense (ことがある "there is a thing" in a non-experience sense, when that is possible).

`why` names the structure in one line, for example "で is the location particle, not the て-form of だ".

## Check before you finish

Run the validator on your output and fix every problem it reports:

```text
node docs/research/grammar-patterns/tools/validate.mjs --known docs/research/grammar-patterns/final-ids.json <your output file>
```

Then reread every sentence once as a native speaker would, and fix anything unnatural, wrong or ambiguous.
