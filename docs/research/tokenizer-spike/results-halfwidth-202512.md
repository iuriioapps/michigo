# Half-width katakana on UniDic 2025.12

The corpus has no line in half-width katakana. This test takes the 7349 lines that hold a katakana run and writes their katakana in half width.

| Measure | Value |
| --- | --- |
| Tokens with Japanese script, original lines | 91806 |
| Unknown among them | 1763 |
| Tokens, half-width lines as written | 90348 |
| Unknown among them | 13407 |
| Lines where half width changes the cut or the unknown flags | 6452 |
| Lines where the conversion back to full width gives the original tokens | 7349 of 7349 |

## Examples

- ﾌﾘｰﾚﾝ様と過ごした時間です
  - as written: ﾌﾘｰﾚﾝ⇒? 様⇒様(サマ) と⇒と(ト) 過ごし⇒過ごす(スゴス) た⇒た(タ) 時間⇒時間(ジカン) です⇒です(デス)
  - converted: フリーレン⇒フリーレン-Frieren(フリーレン) 様⇒様(サマ) と⇒と(ト) 過ごし⇒過ごす(スゴス) た⇒た(タ) 時間⇒時間(ジカン) です⇒です(デス)
- ﾍﾍﾍｯ
  - as written: ﾍﾍﾍｯ⇒?
  - converted: ヘヘヘッ⇒へへへ(ヘヘヘ)
- ﾌﾘｰﾚﾝ
  - as written: ﾌﾘｰﾚﾝ⇒?
  - converted: フリーレン⇒フリーレン-Frieren(フリーレン)
- ﾃﾞﾝｹﾝ
  - as written: ﾃﾞﾝｹﾝ⇒?
  - converted: デン⇒でん(デン) ケン⇒ケン(ケン)
- ﾌﾘｰﾚﾝと同じ実力なら
  - as written: ﾌﾘｰﾚﾝ⇒? と⇒と(ト) 同じ⇒同じ(オナジ) 実力⇒実力(ジツリョク) なら⇒だ(ダ)
  - converted: フリーレン⇒フリーレン-Frieren(フリーレン) と⇒と(ト) 同じ⇒同じ(オナジ) 実力⇒実力(ジツリョク) なら⇒だ(ダ)
- ﾊｧ…
  - as written: ﾊｧ⇒?
  - converted: ハァ⇒はあ(ハア)
