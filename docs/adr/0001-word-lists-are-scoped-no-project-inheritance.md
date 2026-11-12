# Word Lists are scoped, and Projects do not inherit

A Word List is owned by one Project or by nobody (global), and a Project sees its own lists plus the global lists. Projects do not inherit from each other, and no synthetic "Default" Project carries the global lists. The learner shares a word or a list across Projects by promotion: add the word to a global list, or make the Project list global.

The `subs-jp` prototype shared lists through an `extends` chain between projects. That chain carried known-word files, stopwords and names. The Word Bank now holds known words for the whole app, and groups inside a Project hold seasons and volumes, so the chain had nothing left to carry except a resolution order that the learner must understand.

## Considered options

- Project inheritance, as in the prototype. Rejected: it needs chain resolution rules and base Projects that contain no Sources.
- A "Default" Project that owns the global lists. Rejected: a Project is a group of Sources, and a Project that can hold none needs special rules for open, add and delete.
- Global lists only. Rejected: a name or a stopword is often specific to one series.

## Consequences

Names and Stopwords exist as built-in lists at the global scope and in every Project. Stopwords is the only list that changes the coverage count.
