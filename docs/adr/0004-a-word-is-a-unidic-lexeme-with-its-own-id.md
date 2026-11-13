# A word is a UniDic lexeme with its own ID

A word in the Word Bank is one UniDic lexeme: the pair 語彙素 and 語彙素読み that the tokenizer reports for a token. Each word also has an ID that Michigo creates. The lexeme pair is stored text that finds the word. It is not the ID. Under each word, Michigo records every Spelling it has seen (the lemma as written).

A word that the learner knows must count as Known in every text, in kana or in kanji. Only the lexeme does that: すごい, 凄い, スゴイ and すげぇ share one lexeme. The lemma as written keeps すごい, 凄い and スゴイ apart, and it reports すげぇ as すごい. The Word Bank must also work with no Dictionary installed, so a Dictionary entry ID cannot be the identity. UniDic is tokenizer data that Michigo provides, not a Dictionary, so the lexeme is always available.

## The identity rule

**Known, Word List membership and coverage attach to the word ID, never to a Spelling, a surface form or a Dictionary entry.** A Word List that holds 凄い matches すごい and every inflection. Reference data (a Dictionary, a JLPT list, a frequency list) find a word through its Spellings and reading at lookup time, and Michigo stores no such link as identity.

A token becomes a word when UniDic or the user dictionary knows it and it holds Japanese script. Particles and auxiliaries are words. Symbols, Latin runs and digit runs are discarded. A token with Japanese script that nothing knows is Unrecognized: it stays with its Source, outside the Word Bank, until the learner promotes it. A promoted word has no lexeme, so its key is its Spelling plus the reading that the learner gives, if any.

Michigo takes the tokenizer's choice of lexeme as it is. A word displays with the Spelling that is most frequent in the learner's Sources, because the lexeme form is often a kanji form that the text never used (みんな has the lexeme 皆).

## Considered options

- Lemma as written plus reading. Rejected: a learner who knows すごい would see 凄い and スゴイ as unknown words.
- Dictionary entry ID (JMdict). Rejected: the Word Bank must not depend on a Dictionary, and a word must stay when a Dictionary goes.
- The lexeme pair as the primary key, with no ID. Rejected: 2.2% of tokens change lexeme between UniDic versions, so a dictionary change would lose words.
- Known for each Spelling. Rejected for v1: it doubles the bookkeeping. The recorded Spellings leave room for it.

## Consequences

The lexeme merges more than spellings. 勝てる counts as 勝つ, 斬る as 切る, and 1 as 一. On kana-only text the tokenizer sometimes picks the wrong lexeme (のろい becomes 呪い), and v1 shows that choice. The learner cannot merge or split words in v1. The word ID exists so that a later version can point two lexeme keys at one word, or move a Spelling to a new word.

Michigo pins one UniDic version. A change of version is a migration that maps old lexeme keys to word IDs, never a silent swap of the dictionary files.
