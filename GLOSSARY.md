# Michigo

Michigo measures how much of a Japanese text a learner can already read, and which words close the gap.

## Language

### Source

A material that Michigo can extract Japanese text from, such as a subtitle file, a plain text document or pasted text.

_Avoid_: document, file, material

### Project

A named group of Sources that the learner organizes and measures together.

_Avoid_: collection, shelf, library

### Word List

A named group of words that the learner manages, such as "Magic-related words". It is either global or owned by one Project, and a word can be in many Word Lists.

_Avoid_: collection, deck, custom collection, category

### Names

A built-in Word List for the names of people and characters. One exists globally and one in each Project.

### Stopwords

A built-in Word List for words that the coverage count ignores completely. One exists globally and one in each Project.

_Avoid_: exclusion list, ignore list

### Part of speech

The grammatical class of a word (noun, verb, na-adjective). It is an attribute of the word in the Word Bank, not a Word List.

### Word Bank

Every word that Michigo has recorded for the learner, known or not. It stands alone: no Dictionary is needed for a word to be in it.

_Avoid_: known list, vocabulary

### Known

The state of a word in the Word Bank that the learner can already read. A learner can forget a word: it becomes unknown and stays in the Word Bank.

### Reference data

External data that the learner imports to describe words: a Dictionary, a JLPT list or a frequency list. Removing it changes nothing in the Word Bank or in any Word List.

### Dictionary

An external reference that the learner imports to see meanings and readings. Michigo ships none, and the learner can work without one.

_Avoid_: glossary, word database

### Snapshot

A copy of the learner's database alone, which Michigo takes automatically and keeps beside the data.

### Backup

A single file that holds everything needed to restore Michigo: the database, plus media and Dictionaries when the learner includes them. The learner or a schedule creates it.

_Avoid_: dump, archive, export
