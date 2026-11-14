# One row per occurrence in SQLite

Node v24.22.1, `node:sqlite`, SQLite 3.53.4. Real tokens of the subtitle corpus on UniDic 2025.12, repeated as Sources of 400 lines. A line stands for a Sentence. Only tokens with Japanese script are rows.

| Measure | Value |
| --- | --- |
| Sources | 3000 |
| Sentences | 1200400 |
| Occurrence rows | 5947490 |
| Distinct words | 7685 |
| Insert of everything in one transaction, s | 8.9 |
| File without secondary indexes, MB | 136 |
| Both indexes plus `ANALYZE`, s | 6.0 |
| File with indexes, MB | 221 |
| Rerun of one Source (delete and insert), ms | 77 |

## Queries

Best of five runs.

| Query | ms | Rows |
| --- | --- | --- |
| Read one Source: its sentences and occurrences | 2.82 | 1877 |
| Occurrences per word in one Source | 0.91 | 451 |
| Occurrences per word in a Project of 50 Sources | 55 | 5828 |
| 20 sentences with the most frequent word | 0.03 | 20 |
| 20 sentences with a rare word | 0.02 | 1 |
| Occurrences per word over the whole library | 257 | 7686 |
