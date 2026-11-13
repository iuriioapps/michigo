# Edge-case fixes measured on Lindera WASM with UniDic 2.1.2

Every fix is a pass over the text before the tokenizer or over its tokens after. The dictionary is not changed.

## Unknown content tokens after each fix

Columns add one fix at a time: part of speech only, then the letter-or-digit filter, then half-width katakana normalization, then joined Latin and digit runs. The last column is full NFKC instead of the targeted normalization.

| Text | Lines | Part of speech only | + letter or digit | + half-width katakana | + joined runs | Tokens removed by joining | Full NFKC, no joining |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lyrics-classic | 43 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 | 0 (0.0%) |
| lyrics | 65 | 69 (25.9%) | 42 (17.6%) | 42 (17.6%) | 42 (17.6%) | 94 | 42 (17.6%) |
| prose | 75 | 8 (0.3%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 | 0 (0.0%) |
| subs-1 | 10417 | 874 (3.1%) | 382 (1.4%) | 382 (1.4%) | 382 (1.4%) | 71 | 362 (1.3%) |
| subs-2 | 12245 | 484 (1.4%) | 407 (1.2%) | 407 (1.2%) | 407 (1.2%) | 146 | 392 (1.2%) |
| subs-3 | 5642 | 208 (1.3%) | 30 (0.2%) | 30 (0.2%) | 30 (0.2%) | 65 | 27 (0.2%) |
| subs-4 | 6622 | 311 (1.7%) | 72 (0.4%) | 72 (0.4%) | 72 (0.4%) | 23 | 59 (0.3%) |
| subs-5 | 1672 | 369 (7.3%) | 117 (2.4%) | 117 (2.4%) | 117 (2.4%) | 11 | 118 (2.4%) |
| subs-6 | 3235 | 654 (6.9%) | 193 (2.1%) | 45 (0.5%) | 45 (0.5%) | 21 | 41 (0.5%) |
| transcript | 694 | 5 (0.1%) | 5 (0.1%) | 5 (0.1%) | 5 (0.1%) | 79 | 5 (0.1%) |
| wiki-danmachi | 814 | 873 (2.9%) | 752 (2.5%) | 752 (2.5%) | 752 (2.6%) | 1178 | 752 (2.5%) |
| wiki-miku | 497 | 1014 (8.5%) | 763 (6.5%) | 763 (6.5%) | 763 (7.2%) | 1458 | 763 (6.5%) |

### What is still unknown after all fixes

禰豆×229, オラリオ×114, ヒンメル×92, ゼノス×81, MIKU×67, レフィーヤ×65, EXPO×43, シュティレ×42, ヴェルフ×28, エニュオ×24, HATSUNE×23, ウィーネ×22, ゾルトラーク×21, フリーレン×21, ラヴィーネ×21, アスフィ×21, VOCALOID×21, レヴィス×20, フェルズ×19, Project×19, メモリア・フレーゼ×18, リュグナー×17, ヨウキ×17, feat×17, デンケン×16, グラナト×15, ヘファイストス×15, ディックス×15, オイサースト×14, ゼンゼ×14, フォル×13, ラオフェン×13, ゾフィア×13, ピアプロキャラクターズ×13, ゴホッ×12, ティオネ×12, クヴァール×11, メレン×11, フェルン×10, YouTube×10, クロッゾ×10, リヴェリア×10, ONLINE×10, MEIKO×10, グアアア×9, アリィ×9, Google×9, ボカロ×9, DIVA×9, SUPER×9, SNOW×9, ジャッジャッ×8, レーヴェ×8, オッタル×8, ヒリュテ×8, episode×8, KAITO×8, ヒノカミ×7, ドラート×7, エッヘヘ×7

### Most frequent joined runs

10×127, Lv×91, 12×76, 11×55, 18×51, 20×39, 15×37, 16×36, 30×36, 14×34, 2025×34, 2017×32, 2019×31, 50×30, 13×30, 2023×30, 2024×29, 100×27, 2020×27, 24×26, 17×23, 19×22, 25×22, 2015×22, 27×21, 2016×21, 2018×21, 31×21, NT×20, 2014×19, GA×18, 2011×18, 80×17, 21×17, GT×16, 2026×15, 60×14, 2013×14, 2022×14, in×13

## Joining katakana runs
Joining every run of adjacent katakana tokens changes 1882 of 42021 lines (2352 joins, 654 distinct). Joining only when a piece is unknown or at most two characters long changes 1486 lines (1725 joins, 368 distinct).

### Most frequent joins under the narrow rule

フリーレン×324, フレイヤ×129, フェルン×121, ハア×107, ゼーリエ×31, フランメ×27, ミカナ×27, オラトリア×22, カナヲ×21, デンケン×21, ハハハッ×17, ヴィアベル×17, オッタル×17, ミアハ×16, アステリオス×16, エイン×16, ハハッ×15, コカコーラ×15, タナトス×15, ハーッ×13, アッハハハ×12, ティオナ×12, ヘヘッ×11, ユーベル×11, リヴィラ×11, ラキア×11, ハハハハッ×10, ニナ×10, イケロス×10, フンッ×9, リザードマン×9, ウダイオス×9, ガンガン×8, シャアアア×7, イストリア×7, ニイナ×7, アリィ×7, ダンメモ×7, ミク×7, ピアプロ×7, ハハ×6, クソガキ×6, アンデッド×6, オレオール×6, ウッフフ×6, ワーウルフ×6, クラネル×6, リリルカ×6, ウィーネ×6, アミッド×6, ルノア×6, ウウウウ×5, フフフフ×5, フフフフッ×5, ウフッ×5, クフッ×5, ブオン×5, ダンジョンボス×5, テルスキュラ×5, アルガナ×5

### Joins that only the wide rule makes

ランクアップ×47, ライトノベル×25, ジャガーノート×24, バーチャルシンガー×17, マジカルミライ×15, レベルアップ×14, フィルヴィス×14, ファミリアクロニクル×13, ポッドキャスト×10, デイリークエスト×9, メディアミックス×8, ドロップアイテム×8, プロジェクトセカイ×8, ダンジョンブレイク×7, テレビアニメ×7, テーマソング×7, インスタンスダンジョン×5, ギルドマスター×5, クリスマスパーティー×5, スマートフォン×5, ツインテール×5, ライブイベント×5, シリーズチャンピオン×5, パーティーメンバー×4, ランダムボックス×4, ジャージャン×4, ニーズホッグ×4, ボイスライブラリー×4, バーチャルアイドル×4, カラフルステージ×4, ミクフィギュアブーム×4, メルトショック×4, ジャンボベリースペシャル×3, カップラーメン×3, ブラウザゲーム×3, ファイアボルト×3, メインストリート×3, ロフトプラスワン×3, メジャーアップデート×3, リズムゲーム×3, グッドスマイルカンパニー×3, コロナウイルス×3, グッドスマイル×3, ファーストコンサート×3, ウガアアア×2, イッヒヒヒヒ×2, ウハハハハ×2, シードラット×2, メルクーアプリン×2, イケメンポーズ×2, クリーンエネルギー×2, メッセージボックス×2, ダメージディーラー×2, ナイトキラー×2, トップバッター×2, モザイクアート×2, カップルシート×2, フィレステーキ×2, フライセット×2, ハッピーバレンタイン×2

## User dictionary at 10,000 entries

| Measure | Value |
| --- | --- |
| Entries (unknown words from the texts, padded with synthetic names) | 348 real + 9652 synthetic |
| Time to compile the CSV into a user dictionary, ms | 66 |
| CSV size, KB | 376 |
| Lines whose segmentation changed | 802 of 42021 |
| Tokens from the user dictionary | 2529 |
| Unknown content tokens before | 2763 |
| Unknown content tokens after | 1057 |

Sample of changed lines (user-dictionary tokens in brackets):

- ウ·ア·アアア·！
  - [ウアア]·アア·！
- ウ·アアア·！
  - [ウアア]·ア·！
- ウ·アアア·！
  - [ウアア]·ア·！
- フフ·フフ·…
  - [フフフフ]·…
- ク·フフフッ
  - [クフフフ]·ッ
- フフ·フフ·！
  - [フフフフ]·！
- フフ·フフ·…
  - [フフフフ]·…
- フフ·フフッ
  - [フフフフッ]
- ガ·アア·！
  - [ガアア]·！
- ウ·ガ·アアア·！
  - [ウガアアア]·！
- ガ·アアア·！
  - [ガアアア]·！
- アッ·ハハハ·！
  - [アッハハ]·ハ·！

## Supplementary dictionary for colloquial forms

| Sentence | Without | With |
| --- | --- | --- |
| やべぇ、うるせぇよ。 | や べ ぇ 、 うるせぇ よ 。 | [やべぇ ⇒ やばい] 、 うるせぇ よ 。 |
| あっぶね、死ぬとこだった。 | あっ ぶね 、 死ぬ とこ だっ た 。 | [あっぶね ⇒ 危ない] 、 死ぬ とこ だっ た 。 |
| ほんまに知らんで。あかんやろ。 | ほんま に 知ら ん で 。 あ かん やろ 。 | ほんま に 知ら ん で 。 [あかん ⇒ あかん] やろ 。 |
| こいつ、つえぇな。 | こいつ 、 つえぇ な 。 | こいつ 、 [つえぇ ⇒ 強い] な 。 |
| すげーうめぇ！ | すげー うめ ぇ ！ | [すげー ⇒ 凄い] [うめぇ ⇒ 旨い] ！ |

5 of 42021 lines changed. Entries that fired: あっぶね×3, ヤベ×2.

Every changed line, up to 40, so false hits are visible:

- ヤベッ·！ → [ヤベ]·ッ·！
- あっ·ぶ·ねえ → [あっぶね]·え
- はあ·？　·アリ·は·ヤベ·えっ·て → はあ·？　·アリ·は·[ヤベ]·え·って
- あっ·ぶ·ねぇ → [あっぶね]·ぇ
- あっ·ぶね·。 → [あっぶね]·。

## Spaces inside a line
13080 lines contain a space between two phrases. Tokenizing each phrase separately changes the result in 1973 of them. Removing the spaces changes it in 2297.

Every 20th line where separate phrases differ (whole line, then separate phrases; only the tokens that differ):

- 兎追いし かの山
  - whole: し⇒為る(スル) か⇒か(カ) の⇒の(ノ)
  - separate: し⇒し(シ) かの⇒彼の(カノ)
- どうした！　どうしたんだ？
  - whole: ！　⇒！　
  - separate: ！⇒！()
- 速い… それに なんて力だ
  - whole: なんて⇒なんて(ナンテ)
  - separate: なん⇒何(ナニ) て⇒って(ッテ)
- え？　あっ…
  - whole: え⇒えー(エー) ？　⇒？　
  - separate: え⇒えっ(エッ) ？⇒？()
- では いってらっしゃいませ
  - whole: いっ⇒言う(イウ)
  - separate: いっ⇒行く(イク)
- ハア ハア…
  - whole: ハ⇒ハ(ハ) ア⇒ア(ア)
  - separate: 
- グハ！　ウッ…
  - whole: ！　⇒！　
  - separate: ！⇒！()
- どうした？　禰豆子
  - whole: ？　⇒？　
  - separate: ？⇒？()
- ハア ハア…
  - whole: ハ⇒ハ(ハ) ア⇒ア(ア)
  - separate: 
- や　め　ろ！
  - whole: や⇒や(ヤ) め⇒目(メ)
  - separate: や⇒嫌(イヤ) め⇒メ(メ)
- そうかい ごめんなさいね！
  - whole: かい⇒買う(カウ)
  - separate: か⇒か(カ) い⇒い(イ)
- 炭治郎 なあ 炭治郎
  - whole: なあ⇒な(ナ)
  - separate: なあ⇒なあ(ナア)
- 来ないで！　来ないでくれ！
  - whole: ！　⇒！　
  - separate: 
- あ そんなふうだから
  - whole: あ⇒あー(アー)
  - separate: あ⇒ア(ア)
- どけ！　おらあ！
  - whole: どけ⇒退ける(ドケル) ！　⇒！　
  - separate: どけ⇒とく(トク)
- はあん？　ナメるんじゃねえぞ！
  - whole: はあ⇒はあ(ハア) ん⇒んー(ンー) ？　⇒？　
  - separate: は⇒は(ハ) あん⇒餡(アン) ？⇒？()
- ３人とも あばらが折れてるとはな
  - whole: とも⇒共(トモ)
  - separate: も⇒も(モ)
- 誇り高く？　ご武運？
  - whole: ？　⇒？　
  - separate: 
- あ あ あ！
  - whole: あ⇒あー(アー)
  - separate: 
- ほら見ろ！　ほらほら！
  - whole: ！　⇒！　
  - separate: 

## N-best on ambiguous kana

| Text | Wanted | Top 3 paths | First path right | Right within 3 |
| --- | --- | --- | --- | --- |
| あゆみの のろい ものはない | のろい = 鈍い | のろい⇒呪い / のろい⇒呪い / のろい⇒鈍い | no | yes |
| あゆみののろいものはない | のろい = 鈍い | のろい⇒鈍い / のろい⇒鈍い / のろい⇒呪い | yes | yes |
| もしもし かめよ かめさんよ | かめ = 亀 | かめよ⇒噛む / かめよ⇒噛む / かめ⇒亀 | no | yes |
| あかんやろ | あかん = あかん | (cut differently) / (cut differently) / (cut differently) | no | no |
| はしをわたる | はし = 橋 | はし⇒箸 / はし⇒箸 / はし⇒橋 | no | yes |
| はしでたべる | はし = 箸 | はし⇒箸 / はし⇒箸 / はし⇒橋 | yes | yes |
| あめがふる | あめ = 雨 | あめ⇒飴 / あめ⇒飴 / あめ⇒雨 | no | yes |
| あめをなめる | あめ = 飴 | あめ⇒飴 / あめ⇒飴 / あめ⇒雨 | yes | yes |
| ふくをきる | きる = 着る | きる⇒切る / きる⇒切る / きる⇒着る | no | yes |
| かみをきる | きる = 切る | きる⇒切る / きる⇒切る / きる⇒切る | yes | yes |
| かみをきる | かみ = 髪 | かみ⇒髪 / かみ⇒紙 / かみ⇒嘉美 | yes | yes |
| うちにかえる | かえる = 帰る | かえる⇒返る / かえる⇒変える / かえる⇒孵る | no | no |
| かえるがなく | かえる = 蛙 | かえる⇒蛙 / かえる⇒蛙 / かえる⇒変える | yes | yes |
| おかねがいる | いる = 要る | いる⇒居る / いる⇒居る / いる⇒居る | no | no |
| きょうはあつい | あつい = 暑い | あつい⇒厚い / あつい⇒熱い / あつい⇒暑い | no | yes |
| このほんはあつい | あつい = 厚い | あつい⇒厚い / あつい⇒厚い / あつい⇒熱い | yes | yes |
| はながさく | はな = 花 | (cut differently) / (cut differently) / はな⇒ハナ | no | no |
| はなをかむ | はな = 鼻 | はな⇒端 / はな⇒端 / はな⇒ハナ | no | no |
| にわにはにわにわとりがいる | にわとり = 鶏 | にわ⇒庭 / にわ⇒庭 / にわ⇒庭 | no | no |
| せかいのうちに おまえほど | せかい = 世界 | せかい⇒世界 / せかい⇒世界 / せかい⇒世界 | yes | yes |

First path right: 8 of 20. Right within three paths: 14 of 20.
