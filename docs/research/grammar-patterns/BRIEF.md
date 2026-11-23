# Grammar Pattern research brief

You help build the v1 Grammar Pattern set of Michigo, a free and open source desktop app for Japanese learners. Michigo imports texts (subtitles, lyrics, plain text), tokenizes them with UniDic 2025.12 (short units, through the Lindera tokenizer) and shows the learner which grammar patterns a text contains. Michigo writes its own pattern matchers in TypeScript later. Your output is the research data those matchers and their tests will be built from. Quality and correctness matter more than speed.

## Hard rules

- Write every Japanese sentence and every English meaning yourself. Do NOT copy example sentences, explanations or translations from any website, book or list. Lists of grammar point NAMES and their JLPT levels are facts and can be used. The Michigo repository is public, so copied text is a license problem.
- Sentences must be natural, grammatical modern Japanese that a native speaker would accept. Prefer the kind of language found in anime, drama, novels, songs and daily conversation, since that is what learners import. Mix polite and plain styles. Use kanji the way a normal adult text would.
- Each example sentence contains the pattern exactly once, unless the entry says otherwise.
- A counterexample is a sentence that a naive matcher could mistake for the pattern but that is NOT the pattern (a near miss). Example: for 〜ている, 「手紙を書いて、いる人に渡した」 or a plain て-form 「書いて送った」. Say in one line why it is not the pattern.
- English stays short and plain. A meaning is one line, at most 80 characters.
- IDs are lower-case romaji in kebab-case, Hepburn without macrons: `te-iru`, `nakereba-naranai`, `ni-yoru-to`. Reuse an id from `prototype-ids.tsv` whenever the pattern is the same; never rename one.
- A JLPT level is internal metadata used only to choose the scope. Michigo never shows it to learners.

## Sources to cross-check (names and levels only)

Use several of these and record which ones list the pattern and at which level: JLPT Sensei, Bunpro, Jonathan Waller's tanos.co.uk grammar lists, Nihongo no Mori, Marumori, JapaneseTest4You, Tae Kim's guide, Imabi, the Dictionary of Basic/Intermediate/Advanced Japanese Grammar (DoJG), Shin Kanzen Master and Try! tables of contents. Use short source keys: `jlptsensei`, `bunpro`, `tanos`, `nihongonomori`, `marumori`, `jt4y`, `taekim`, `imabi`, `dojg`, `kanzen`, `try`.

## Files

All files are UTF-8 JSON, an array of objects, pretty-printed with 2 spaces. Write them with your file tools, never through a shell heredoc that may break Japanese text.
