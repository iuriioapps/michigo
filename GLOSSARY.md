# Michigo

Michigo measures how much of a Japanese text a learner can already read, and which words close the gap.

## Language

### Source

A material that Michigo can extract Japanese text from, such as a subtitle file, a plain text document or pasted text.

_Avoid_: document, file, material

### Project

A named group of Sources that the learner organizes and measures together.

_Avoid_: collection, shelf, library

### Word

One vocabulary item of Japanese, whatever its Spelling or inflection: すごい, 凄い and すげぇ are one word. Two items with the same Spelling and different readings are two words, such as 人 read ひと and 人 read じん. A particle or an auxiliary is also a word.

_Avoid_: term, lemma, token, entry

### Spelling

One way of writing a word in its dictionary form, such as すごい or 凄い. A word has every Spelling that Michigo has seen for it. A Spelling has its own reading, which can differ from the reading of another Spelling of the same word: みんな and 皆 are one word. A Spelling has no Known state of its own.

_Avoid_: form, variant, surface

### Unrecognized

A piece of Japanese text in a Source that Michigo could not identify as a word, often a name or an invented term. It is not in the Word Bank. The learner can promote it to a word, or put it in Names or Stopwords.

_Avoid_: junk, unknown word

### Compound

A word that the learner makes from several adjacent words in a text, such as 魔法使い from 魔法 and 使い. It matches that exact text in every Source, and where it matches, it counts instead of its parts. Its Known state is its own. The learner can delete a Compound, and the text then counts as its parts again.

_Avoid_: merge, joined word, phrase

### Word List

A named group of words that the learner manages, such as "Magic-related words". It is either global or owned by one Project, and a word can be in many Word Lists.

_Avoid_: collection, deck, custom collection, category

### Names

A built-in Word List for the names of people and characters. One exists globally and one in each Project.

### Stopwords

A built-in Word List for words that the coverage count ignores completely: a piece that Michigo parsed wrongly, or a word the learner does not care about, such as a sound effect or an obscure term. One exists globally and one in each Project. A word has no "ignored" state: it is in Stopwords or it is not.

_Avoid_: exclusion list, ignore list, ignored word

### Part of speech

The grammatical class of a word (noun, verb, na-adjective). It is an attribute of the word in the Word Bank, not a Word List.

### Word Bank

Every word that Michigo has recorded for the learner, known or not. It stands alone: no Dictionary is needed for a word to be in it.

_Avoid_: known list, vocabulary

### Known

The state of a word in the Word Bank that the learner can already read. A word is Known or it is not, with no state between. Only an action of the learner changes it, one word at a time or many at once. A learner can forget a word: it becomes unknown and stays in the Word Bank.

### Occurrences

How many times a word appears in one Source or one Project. The number belongs to that Source or Project: a word can appear 50 times in one Source and once in another. The Word Bank has no such number of its own.

_Avoid_: frequency, count

### Grammar Pattern

A grammatical construction, such as 〜てしまう, that Michigo detects in a Source to show the learner which grammar the text needs. It is Known or not, like a word, and only the learner changes that. It never changes coverage.

_Avoid_: grammar point, rule

### Tokenizer dictionary

The data that Michigo needs to split text into words. Michigo downloads it on first start and cannot work without it. It is not Reference data and not a Dictionary: the learner never imports, replaces or removes it.

_Avoid_: UniDic dictionary, dictionary (alone)

### Reference data

External data that describes words: a Dictionary, a JLPT list or a frequency list. Michigo downloads it when its license permits a hosted copy, and the learner can import more from a file. Removing it changes nothing in the Word Bank or in any Word List.

### Word metadata

A fact about a word that Reference data adds, such as its JLPT level or its Frequency rank. A word has it only while Reference data that provides it is present. The learner can filter words by it and act on the result.

_Avoid_: tag, property

### Frequency rank

The position of a word in a frequency list. It is Word metadata, and it describes the texts that the list was built from, such as news articles. It does not say how useful the word is for the Source that the learner wants to read: Occurrences says that.

_Avoid_: frequency (alone)

### Dictionary

An external reference for meanings and readings. The Michigo installer holds none: Michigo downloads a Dictionary, and the learner can import additional ones. The learner can work without one.

_Avoid_: glossary, word database

### Personal Dictionary

The learner's own translation and notes for words. It is built in, always present and shown before any Dictionary. It is not part of the word itself, and it is deleted with its word.

_Avoid_: user dictionary, custom dictionary

### Snapshot

A copy of the learner's database alone, which Michigo takes automatically and keeps beside the data.

### Backup

A single file that holds everything needed to restore Michigo: the database, plus media and Dictionaries when the learner includes them. The learner or a schedule creates it.

_Avoid_: dump, archive, export

### Audio Source

One entry in the learner's ordered list that can return audio for a word or a sentence: a publisher of recorded audio, a voice of the operating system, a cloud voice or a custom URL. Michigo asks them in order and takes the first audio it gets. Every Audio Source is off until the learner turns it on. Never shorten it to "source": a Source is a text.

_Avoid_: source (alone), provider, TTS engine

### Clip

One stored audio file of one Spelling of a word, from one Audio Source. A Clip never stands for the word as a whole, because two Spellings of one word can sound different. A word can hold several Clips. Audio of a sentence is not a Clip: Michigo keeps it only for a time.

_Avoid_: recording, sound, audio file
