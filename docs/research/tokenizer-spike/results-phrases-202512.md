# Phrase split, half-width katakana and name tags on UniDic 2025.12

## Phrase split

37045 lines. 11098 contain a space between two phrases. Tokenizing each phrase alone changes the tokens with Japanese script in 554 of them.

### Every 13th changed line

- 小鮒釣りし かの川
  - whole: か⇒か(カ) の⇒の(ノ)
  - separate: かの⇒彼の(カノ)
- やっぱり 読み聞かせようか？
  - whole: 読み聞かせよう⇒読み聞かせる(ヨミキカセル)
  - separate: 読み聞かせ⇒読み聞かせ(ヨミキカセ) よう⇒良い(ヨイ)
- 新しい必殺技 見せてよ
  - whole: 技⇒技(ギ)
  - separate: 技⇒技(ワザ)
- お前が あの魔法を
  - whole: あの⇒彼の(アノ)
  - separate: あの⇒あの(アノ)
- たしか 北側諸国でも
  - whole: 北側⇒キタガワ(キタガワ)
  - separate: 北側⇒北側(キタガワ)
- 新しい風呂おけ 小さくない？
  - whole: おけ⇒置く(オク)
  - separate: おけ⇒桶(オケ)
- そもそも フリーレンが
  - whole: フリー⇒フリー-free(フリー) レン⇒レン(レン)
  - separate: フリーレン⇒フリーレン-Frieren(フリーレン)
- 私は 魔法使い ユーベル
  - whole: 使い⇒使う(ツカウ)
  - separate: 使い⇒使い(ツカイ)
- 意外だな デンケン
  - whole: デンケン⇒?
  - separate: デン⇒でん(デン) ケン⇒ケン(ケン)
- そういえば あのエルフ
  - whole: あの⇒彼の(アノ)
  - separate: あの⇒あの(アノ)
- それでいいだろ デンケン
  - whole: デンケン⇒?
  - separate: デン⇒でん(デン) ケン⇒ケン(ケン)
- 夢が かなったよって
  - whole: か⇒か(カ) なっ⇒成る(ナル)
  - separate: かなっ⇒適う(カナウ)
- どうせ 金の使い道などない
  - whole: 金⇒金(キン)
  - separate: 金⇒金(カネ)
- 実は フリーレンに
  - whole: フリー⇒フリー-free(フリー) レン⇒レン(レン)
  - separate: フリーレン⇒フリーレン-Frieren(フリーレン)
- 対価は フリーレンが受け取るさ
  - whole: フリー⇒フリー-free(フリー) レン⇒レン(レン)
  - separate: フリーレン⇒フリーレン-Frieren(フリーレン)
- もっとも うちの
  - whole: もっとも⇒尤も(モットモ)
  - separate: もっとも⇒最も(モットモ)
- あれ ヤバくねえか？
  - whole: あれ⇒彼れ(アレ)
  - separate: あれ⇒あれ(アレ)
- わたる 11時方向！
  - whole: わたる⇒渡る(ワタル)
  - separate: わたる⇒ワタル(ワタル)
- えっ あ… あの
  - whole: あの⇒彼の(アノ)
  - separate: あの⇒あの(アノ)
- うっ… だから なんですか？
  - whole: な⇒だ(ダ) ん⇒の(ノ)
  - separate: なん⇒何(ナニ)
- ヤバッ　誰？　あれ
  - whole: あれ⇒彼れ(アレ)
  - separate: あれ⇒あれ(アレ)
- お… おいおい 乗せ過ぎだ
  - whole: おいおい⇒追い追い(オイオイ)
  - separate: おい⇒おい(オイ) おい⇒おい(オイ)
- クレラック クー シーナ
  - whole: ラック⇒ラック-rack(ラック)
  - separate: ラック⇒ＲＡＣ(ラック)
- たった１匹で この被害か
  - whole: で⇒で(デ)
  - separate: で⇒だ(ダ)
- だから俺は 架南島には行かない
  - whole: 架⇒架(カ)
  - separate: 架⇒掛かる(カカル)
- 分からん　だが…
  - whole: 分⇒分(ブン) から⇒から(カラ) ん⇒んー(ンー)
  - separate: 分から⇒分かる(ワカル) ん⇒ず(ズ)
- ん い… いいけど
  - whole: い⇒い(イ)
  - separate: い⇒いー(イー)
- 台パンは… その…
  - whole: その⇒其の(ソノ)
  - separate: その⇒その(ソノ)
- ねえ？　天海さん
  - whole: 天海⇒テンカイ(テンカイ)
  - separate: 天海⇒アマミ(アマミ)
- ね… ねえ 夕ちん
  - whole: ねえ⇒ね(ネ)
  - separate: ねえ⇒ねえ(ネエ)
- もう 最初の話し合いで それ？
  - whole: で⇒で(デ)
  - separate: で⇒だ(ダ)
- うん　頑張ったって 俺たち
  - whole: たって⇒たって(タッテ)
  - separate: た⇒た(タ) って⇒って(ッテ)
- ボーッとしてただけで おなかが
  - whole: で⇒で(デ)
  - separate: で⇒だ(ダ)
- やめ… ハハハハッ…
  - whole: ハハハハッ⇒?
  - separate: ハハハ⇒ははは(ハハハ) ハッ⇒はっ(ハッ)
- それは その…
  - whole: その⇒其の(ソノ)
  - separate: その⇒その(ソノ)
- フフフフッ フフフフ…
  - whole: フフフフッ⇒?
  - separate: フフフ⇒ふふふ(フフフ) フッ⇒ふ(フ)
- いきなり　なんだ。
  - whole: な⇒だ(ダ) ん⇒の(ノ)
  - separate: なん⇒何(ナニ)
- なに？　こいつは　うちの商品よ。
  - whole: うち⇒内(ウチ)
  - separate: うち⇒家(ウチ)
- じゃあ　中を見てみるか。
  - whole: 中⇒中(チュウ)
  - separate: 中⇒中(ナカ)
- 悪徳商人から　金を奪って➡
  - whole: 金⇒金(キン)
  - separate: 金⇒金(カネ)
- き　貴様のためではない
  - whole: き⇒キ(キ)
  - separate: き⇒き(キ)
- じゃあ　金もらって帰るか。
  - whole: 金⇒金(キン)
  - separate: 金⇒金(カネ)
- 北海道 赤れんが庁舎：スペシャルサポーター（雪ミク、2025年 - ）
  - whole: 赤⇒赤(セキ)
  - separate: 赤⇒赤(アカ)

## Half-width katakana

0 lines hold half-width katakana. Unknown tokens in them: 0 as written, 0 after conversion to full width.

## Proper noun tags

241420 tokens with Japanese script.

| Tag | Tokens |
| --- | --- |
| 名詞,固有名詞,人名 | 4364 |
| 名詞,固有名詞,地名 | 673 |
| 名詞,固有名詞,一般 | 470 |

### Person names

526 distinct surfaces.

Most frequent: ミク×430, フリーレン×393, ベル×291, 初音×286, 真樹×257, 前原×135, リュー×120, ロキ×119, ヘスティア×117, メロス×76, フェルン×76, 天海×67, ヒンメル×63, ヘルメス×47, 春姫×37, マナ×33, ミア×31, レフィーヤ×31, 馬渕×29, ダイダロス×29, 向坂×28, 朝凪×28, シル×27, アポロン×24, アストレア×23, ディオニュソス×23, 観月×20, 賢×18, ケン×18, 雪×18, ゼウス×17, 真島×16, 湊×16, オラリオ×16, ルカ×16, セリヌンティウス×15, シュティレ×15, エイナ×15, タケミカヅチ×15, ハフト×14, ゴライアス×14, ゲナウ×13, ニナ×13, ヴェルフ×13, リュグナー×12, ユーベル×12, 賢太×12, ゼノス×12, アイシャ×12, 後藤×11, バルカ×11, 新田×11, タル×11, アレス×11, カサンドラ×11, ラヴィーネ×10, リヒター×10, 新奈×10, アスフィ×10, アレン×10

Seeded sample of distinct surfaces: リン, 小若, メロス, 高原, ヴィトン, シルレル, ドラート, ラキア, シャルフ, タチ, アインザーム, 白石, 許, テル, 桃太郎, 森, クヴァール, フリュネ, ルナール, アイク, アレン, 早苗, 小柳, 新奈, 渉, ライス, 文, ウィクトリクス, ミリアルデ, レヴォルテ, 長壁, 春香, シーナ, ニナ, 康一, 上原, 谷, 小山, 矢樹, ひろ, テアサナーレ, 千結, 颯, 大原, 千香, ハフト, 白川, ヴァルマ, シル, キティ, 珠莉, エマ, ホッグ, 淳司, 王, 修, 村川, グゥ, 慎, 近衛, まえはら, 吉田, 拓, 木村, 久保, ヘスティア, フレーゼ, エーヴィヒ, さやか, 将人, オースティン, 岡本, ボアズ, アリス, クロエ, フォル, 飯田, 雪, 渡辺, アイスベア

## Verdicts on the phrase split sample

Judged by one reader, in the order of the list above. A verdict needs a spot check.

| Verdict | Lines | Examples |
| --- | --- | --- |
| Separate phrases better | 24 | 金 as カネ, 技 as ワザ, フリーレン as one name, かなっ as 適う, なん as 何 |
| Whole line better | 9 | で at the end of a phrase becomes だ (3), あの and あれ at the start of a phrase become fillers (4), 読み聞かせよう loses its ending |
| No difference | 10 | laughter, stutter, デンケン (the katakana join repairs it) |
