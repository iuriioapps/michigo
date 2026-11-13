# Tokenizer spike: measured output

Node v24.22.1, macOS x64 (Intel). Token notation: `surface[lemma ⇒ grouping key]`. The grouping key appears only when it differs from the lemma. A `?` after the surface marks an unknown word.

## Startup, memory and speed

| Candidate | Starts under Node 24 | Startup ms | RSS after load MB | RSS after run MB | Tokens per second |
| --- | --- | --- | --- | --- | --- |
| lindera-unidic | yes | 421 | 653 | 761 | 55886 |
| lindera-sudachidict | yes | 1105 | 1783 | 1869 | 55796 |
| lindera-ipadic | yes | 183 | 214 | 296 | 69945 |
| kuromoji | yes | 383 | 443 | 566 | 130660 |
| sudachi-wasm | yes | 301 | 454 | 546 | 84442 |

## Hard cases

### Rare compound: 封魔鉱を採掘する。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | 封[封 ⇒ 封(フウ)] 魔[魔 ⇒ 魔(マ)] 鉱[鉱 ⇒ 鉱(コウ)] を[を ⇒ を(ヲ)] 採掘[採掘 ⇒ 採掘(サイクツ)] する[する ⇒ 為る(スル)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 封[封] 魔[魔] 鉱[鉱] を[を] 採掘[採掘] する[為る] 。[。] |
| lindera-ipadic | 封[封] 魔[魔] 鉱[鉱] を[を] 採掘[採掘] する[する] 。[。] |
| kuromoji | 封[封] 魔[魔] 鉱[鉱] を[を] 採掘[採掘] する[する] 。[。] |
| sudachi-wasm | 封[封] 魔[魔] 鉱[鉱] を[を] 採掘[採掘] する[する ⇒ 為る] 。[。] |


### Colloquial sound change: すげぇな、お前。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | すげぇ[すごい ⇒ 凄い(スゴイ)] な[な ⇒ な(ナ)] 、[、 ⇒ 、()] お前[お前 ⇒ 御前(オマエ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | すげぇ[凄い] な[な] 、[、] お前[御前] 。[。] |
| lindera-ipadic | すげ[すげる] ぇな?[ぇな] 、[、] お前[お前] 。[。] |
| kuromoji | すげ[すげる] ぇな?[ぇな] 、[、] お前[お前] 。[。] |
| sudachi-wasm | すげぇ[すげぇ ⇒ 凄い] な[な] 、[、] お前[お前 ⇒ 御前] 。[。] |


### Colloquial sound change: あっぶね、死ぬとこだった。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | あっ[あっ ⇒ あっ(アッ)] ぶね[ふね ⇒ 船(フネ)] 、[、 ⇒ 、()] 死ぬ[死ぬ ⇒ 死ぬ(シヌ)] とこ[とこ ⇒ 所(トコロ)] だっ[だ ⇒ だ(ダ)] た[た ⇒ た(タ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | あっ[あっ] ぶね[船] 、[、] 死ぬ[死ぬ] とこ[とこ] だっ[だ] た[た] 。[。] |
| lindera-ipadic | あっ[あっ] ぶ[ぶる] ね[ね] 、[、] 死ぬ[死ぬ] とこ[とこ] だっ[だ] た[た] 。[。] |
| kuromoji | あっ[あっ] ぶ[ぶる] ね[ね] 、[、] 死ぬ[死ぬ] とこ[とこ] だっ[だ] た[た] 。[。] |
| sudachi-wasm | あっ[あっ] ぶね[ぶね ⇒ 船] 、[、] 死ぬ[死ぬ] とこ[とこ] だっ[だ] た[た] 。[。] |


### Colloquial sound change: やべぇ、うるせぇよ。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | や[や ⇒ や(ヤ)] べ[べ ⇒ べい(ベイ)] ぇ[ぇ ⇒ ぇ()] 、[、 ⇒ 、()] うるせぇ[うるさい ⇒ 煩い(ウルサイ)] よ[よ ⇒ よ(ヨ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | や[や] べ[べい] ぇ[ぇ] 、[、] うるせぇ[煩い] よ[よ] 。[。] |
| lindera-ipadic | や[や] べ[べ] ぇ?[ぇ] 、[、] うる[うる] せ[せる] ぇよ?[ぇよ] 。[。] |
| kuromoji | や[や] べ[べ] ぇ?[ぇ] 、[、] うる[うる] せ[せる] ぇよ?[ぇよ] 。[。] |
| sudachi-wasm | や[や] べ[べ ⇒ べい] ぇ[ぇ] 、[、] うるせぇ[うるせぇ ⇒ 煩い] よ[よ] 。[。] |


### Contraction とく: 先に言っとくけど、買っといて。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | 先[先 ⇒ 先(サキ)] に[に ⇒ に(ニ)] 言っ[言う ⇒ 言う(イウ)] とく[とく ⇒ とく(トク)] けど[けど ⇒ けれど(ケレド)] 、[、 ⇒ 、()] 買っ[買う ⇒ 買う(カウ)] とい[とく ⇒ とく(トク)] て[て ⇒ て(テ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 先[先] に[に] 言っ[言う] とく[とく] けど[けれど] 、[、] 買っ[買う] とい[とく] て[て] 。[。] |
| lindera-ipadic | 先[先] に[に] 言っ[言う] とく[とく] けど[けど] 、[、] 買っ[買う] とい[とく] て[て] 。[。] |
| kuromoji | 先[先] に[に] 言っ[言う] とく[とく] けど[けど] 、[、] 買っ[買う] とい[とく] て[て] 。[。] |
| sudachi-wasm | 先[先] に[に] 言っ[言う] とく[とく] けど[けど ⇒ けれど] 、[、] 買っ[買う] とい[とく] て[て] 。[。] |


### Contraction ちゃう, てる: 忘れちゃった。見てる。食べなきゃ。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | 忘れ[忘れる ⇒ 忘れる(ワスレル)] ちゃっ[ちゃう ⇒ ちゃう(チャウ)] た[た ⇒ た(タ)] 。[。 ⇒ 。()] 見[見る ⇒ 見る(ミル)] てる[てる ⇒ てる(テル)] 。[。 ⇒ 。()] 食べ[食べる ⇒ 食べる(タベル)] なきゃ[ない ⇒ ない(ナイ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 忘れ[忘れる] ちゃっ[ちゃう] た[た] 。[。] 見[見る] てる[てる] 。[。] 食べ[食べる] なきゃ[ない] 。[。] |
| lindera-ipadic | 忘れ[忘れる] ちゃっ[ちゃう] た[た] 。[。] 見[見る] てる[てる] 。[。] 食べ[食べる] なきゃ[ない] 。[。] |
| kuromoji | 忘れ[忘れる] ちゃっ[ちゃう] た[た] 。[。] 見[見る] てる[てる] 。[。] 食べ[食べる] なきゃ[ない] 。[。] |
| sudachi-wasm | 忘れ[忘れる] ちゃっ[ちゃう] た[た] 。[。] 見[見る] てる[てる] 。[。] 食べ[食べる] なきゃ[ない] 。[。] |


### Kansai-ben: そうやけど、わからへん。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | そう[そう ⇒ そう(ソウ)] や[や ⇒ や(ヤ)] けど[けど ⇒ けれど(ケレド)] 、[、 ⇒ 、()] わから[わかる ⇒ 分かる(ワカル)] へん[へん ⇒ へん(ヘン)] 。[。 ⇒ 。()] |
| lindera-sudachidict | そう[そう] や[や] けど[けれど] 、[、] わから[分かる] へん[へん] 。[。] |
| lindera-ipadic | そう[そう] や[や] けど[けど] 、[、] わから[わかる] へん[へん] 。[。] |
| kuromoji | そう[そう] や[や] けど[けど] 、[、] わから[わかる] へん[へん] 。[。] |
| sudachi-wasm | そう[そう] や[や] けど[けど ⇒ けれど] 、[、] わから[わかる ⇒ 分かる] へん[へん] 。[。] |


### Kansai-ben: ほんまに知らんで。あかんやろ。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | ほんま[ほんま ⇒ 本真(ホンマ)] に[に ⇒ に(ニ)] 知ら[知る ⇒ 知る(シル)] ん[ぬ ⇒ ず(ズ)] で[で ⇒ で(デ)] 。[。 ⇒ 。()] あ[あ ⇒ あー(アー)] かん[かん ⇒ 彼(カ)] やろ[や ⇒ や(ヤ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | ほんま[本真] に[に] 知ら[知る] ん[ず] で[で] 。[。] あ[あー] かん[彼] やろ[や] 。[。] |
| lindera-ipadic | ほんま[ほんま] に[に] 知ら[知る] ん[ん] で[で] 。[。] あかん[あかん] やろ[や] 。[。] |
| kuromoji | ほんま[ほんま] に[に] 知ら[知る] ん[ん] で[で] 。[。] あかん[あかん] やろ[や] 。[。] |
| sudachi-wasm | ほんま[ほんま ⇒ 本真] に[に] 知ら[知る] ん[ぬ ⇒ ず] で[で] 。[。] あか[あく] ん[ぬ ⇒ ず] やろ[や] 。[。] |


### Half-width katakana: ｽｺﾞｲ ｶﾞﾝﾀﾞﾑ ﾊﾝｶｸ

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] |
| lindera-sudachidict | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] |
| lindera-ipadic | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] |
| kuromoji | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] |
| sudachi-wasm | ｽｺﾞｲ[スゴイ ⇒ 凄い] ｶﾞﾝﾀﾞﾑ[ガンダム] ﾊﾝｶｸ[ハンカク] |


### Spelling variants: すごい人。凄い人。スゴイ人。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | すごい[すごい ⇒ 凄い(スゴイ)] 人[人 ⇒ 人(ヒト)] 。[。 ⇒ 。()] 凄い[凄い ⇒ 凄い(スゴイ)] 人[人 ⇒ 人(ヒト)] 。[。 ⇒ 。()] スゴイ[スゴイ ⇒ 凄い(スゴイ)] 人[人 ⇒ 人(ヒト)] 。[。 ⇒ 。()] |
| lindera-sudachidict | すごい[凄い] 人[人] 。[。] 凄い[凄い] 人[人] 。[。] スゴイ[凄い] 人[人] 。[。] |
| lindera-ipadic | すごい[すごい] 人[人] 。[。] 凄い[凄い] 人[人] 。[。] スゴイ?[スゴイ] 人[人] 。[。] |
| kuromoji | すごい[すごい] 人[人] 。[。] 凄い[凄い] 人[人] 。[。] スゴイ?[スゴイ] 人[人] 。[。] |
| sudachi-wasm | すごい[すごい ⇒ 凄い] 人[人] 。[。] 凄い[凄い] 人[人] 。[。] スゴイ[スゴイ ⇒ 凄い] 人[人] 。[。] |


### Spelling variants: 出来る。できる。分かる。わかる。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | 出来る[出来る ⇒ 出来る(デキル)] 。[。 ⇒ 。()] できる[できる ⇒ 出来る(デキル)] 。[。 ⇒ 。()] 分かる[分かる ⇒ 分かる(ワカル)] 。[。 ⇒ 。()] わかる[わかる ⇒ 分かる(ワカル)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 出来る[出来る] 。[。] できる[出来る] 。[。] 分かる[分かる] 。[。] わかる[分かる] 。[。] |
| lindera-ipadic | 出来る[出来る] 。[。] できる[できる] 。[。] 分かる[分かる] 。[。] わかる[わかる] 。[。] |
| kuromoji | 出来る[出来る] 。[。] できる[できる] 。[。] 分かる[分かる] 。[。] わかる[わかる] 。[。] |
| sudachi-wasm | 出来る[出来る] 。[。] できる[できる ⇒ 出来る] 。[。] 分かる[分かる] 。[。] わかる[わかる ⇒ 分かる] 。[。] |


### Spelling variants: 綺麗。きれい。キレイ。子供。子ども。

| Candidate | Tokens |
| --- | --- |
| lindera-unidic | 綺麗[綺麗 ⇒ 奇麗(キレイ)] 。[。 ⇒ 。()] きれい[きれい ⇒ 奇麗(キレイ)] 。[。 ⇒ 。()] キレイ[キレイ ⇒ 奇麗(キレイ)] 。[。 ⇒ 。()] 子供[子供 ⇒ 子供(コドモ)] 。[。 ⇒ 。()] 子ども[子ども ⇒ 子供(コドモ)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 綺麗[奇麗] 。[。] きれい[奇麗] 。[。] キレイ[奇麗] 。[。] 子供[子供] 。[。] 子ども[子供] 。[。] |
| lindera-ipadic | 綺麗[綺麗] 。[。] きれい[きれい] 。[。] キレイ[キレイ] 。[。] 子供[子供] 。[。] 子ども[子ども] 。[。] |
| kuromoji | 綺麗[綺麗] 。[。] きれい[きれい] 。[。] キレイ[キレイ] 。[。] 子供[子供] 。[。] 子ども[子ども] 。[。] |
| sudachi-wasm | 綺麗[綺麗 ⇒ 奇麗] 。[。] きれい[きれい ⇒ 奇麗] 。[。] キレイ[キレイ ⇒ 奇麗] 。[。] 子供[子供] 。[。] 子ども[子ども ⇒ 子供] 。[。] |

## Offsets

| Candidate | Hard-case offsets slice back to the surface | Output with the engine `unicode_normalize` filter | Surfaces equal the original slice |
| --- | --- | --- | --- |
| lindera-unidic | yes | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] 。[。 ⇒ 。()] ①[① ⇒ 一(イチ)] ㍍[㍍ ⇒ ㍍()] ＡＢＣ[ＡＢＣ ⇒ ＡＢＣ(エービーシー)] | yes |
| lindera-sudachidict | yes | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] 。[。] ①㍍?[①㍍] ＡＢＣ?[ＡＢＣ] | yes |
| lindera-ipadic | yes | ｽｺﾞｲ?[ｽｺﾞｲ] ｶﾞﾝﾀﾞﾑ?[ｶﾞﾝﾀﾞﾑ] ﾊﾝｶｸ?[ﾊﾝｶｸ] 。[。] ①㍍?[①㍍] ＡＢＣ[ＡＢＣ] | yes |
| kuromoji | yes | n/a | n/a |
| sudachi-wasm | yes | n/a | n/a |

Lines in the seven texts where raw offsets did not slice back to the surface (no normalization applied):

| Candidate | Lines with wrong offsets |
| --- | --- |
| lindera-unidic | 0 |
| lindera-sudachidict | 0 |
| lindera-ipadic | 0 |
| kuromoji | 2 |
| sudachi-wasm | 0 |


## NFKC applied in JavaScript before tokenizing

Offsets are mapped back with a per-cluster index table. Unknown counts are content tokens in the subtitle text.

| Candidate | Tokens | Mapped spans point at the original | Subtitle unknowns raw | Subtitle unknowns after NFKC |
| --- | --- | --- | --- | --- |
| lindera-unidic | スゴイ[スゴイ ⇒ 凄い(スゴイ)] ガンダム[ガンダム ⇒ ガンダム(ガンダム)] ハン[ハン ⇒ ハン(ハン)] カク[カク ⇒ カク(カク)] 。[。 ⇒ 。()] A[A ⇒ Ａ(エー)] B[B ⇒ Ｂ(ビー)] C[C ⇒ Ｃ(シー)] 1[1 ⇒ 一(イチ)] 2[2 ⇒ 二(ニ)] 3[3 ⇒ 三(サン)] ![! ⇒ ！()] | yes | 16 | 7 |
| lindera-sudachidict | スゴイ[凄い] ガンダム[ガンダム] ハン[ハン] カク[カク] 。[。] ABC?[ABC] 1[1] 2[2] 3[3] ![!] | yes | 186 | 6 |
| lindera-ipadic | スゴイ?[スゴイ] ガン[ガン] ダム[ダム] ハン[ハン] カク[カク] 。[。] ABC?[ABC] 123?[123] !?[!] | yes | 45 | 213 |
| kuromoji | スゴイ?[スゴイ] ガン[ガン] ダム[ダム] ハン[ハン] カク[カク] 。[。] ABC?[ABC] 123?[123] !?[!] | yes | 39 | 213 |
| sudachi-wasm | スゴイ[スゴイ ⇒ 凄い] ガンダム[ガンダム] ハンカク[ハンカク] 。[。] ABC[ABC] 123?[123] ![!] | yes | 17 | 17 |


## User dictionary for 封魔鉱 (Lindera only)

| Candidate | Tokens with a one-line user dictionary |
| --- | --- |
| lindera-unidic | 封魔鉱[封魔鉱] を[を ⇒ を(ヲ)] 採掘[採掘 ⇒ 採掘(サイクツ)] する[する ⇒ 為る(スル)] 。[。 ⇒ 。()] |
| lindera-sudachidict | 封魔鉱[封魔鉱] を[を] 採掘[採掘] する[為る] 。[。] |
| lindera-ipadic | 封魔鉱[封魔鉱] を[を] 採掘[採掘] する[する] 。[。] |

## Sudachi split modes (sudachi-wasm only)

| Text | Mode A | Mode C |
| --- | --- | --- |
| 封魔鉱を採掘する。 | 封 / 魔 / 鉱 / を / 採掘 / する / 。 | 封 / 魔 / 鉱 / を / 採掘 / する / 。 |
| 選挙管理委員会 | 選挙 / 管理 / 委員 / 会 | 選挙 / 管理 / 委員 / 会 |

## Text: subtitles

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 1865 | 1005 | 16 | 450 | 433 | 22 |
| lindera-sudachidict | 1832 | 1136 | 186 | 428 | 428 | 0 |
| lindera-ipadic | 1829 | 1034 | 45 | 462 | 462 | 0 |
| kuromoji | 1943 | 1033 | 39 | 462 | 462 | 0 |
| sudachi-wasm | 1955 | 979 | 17 | 447 | 429 | 19 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | あっ(アッ): あっ, あ; 勝つ(カツ): 勝つ, 勝てる; 匂い(ニオイ): におい, 臭い; 行く(イク): 行く, いく, いける; 切る(キル): 斬れる, 斬る; 遣る(ヤル): やれる, やる; 何(ナニ): 何, なん; そう(ソウ): そう, そ; 来る(クル): くる, 来る; 言う(イウ): いう, 言う; 皆(ミナ): 皆, みんな; 一(イチ): 一, 1, 壱 |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | あっ: あっ, あ; 勝つ: 勝つ, 勝てる; 行く: 行く, いく, いける; 無い: ない, ねえ; 切る: 斬れる, 斬る; 遣る: やれる, やる; 何: 何, なん; 御: ご, お; そう: そう, そ; 来る: くる, 来る; 言う: いう, 言う; 皆: 皆, みんな |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | ？　, 禰豆, ！　, ギャハ, ･, 肆, ガアア, 宍色, 宍毛 |
| lindera-sudachidict | …, ？　, ！, ？, ！　, ７, ギャハ, ギヤアア, ２, ･, 肆, ガアア, ２３, 宍色, １, クフフフッ, 宍毛, ５ |
| lindera-ipadic | ？　, 禰豆, ！　, ギャハ, ぐっ, ギヤアア, ･, 肆, ガアア, アア, 弐, アアアアア, アアアア, 47, 50, 11, 12, 14, フフフ, フフフフ, 宍色, クフフフッ, フフッ, フフフフッ, クソッ |
| kuromoji | 禰, ギャハ, ぐっ, ギヤアア, ･, 肆, ガアア, アア, 弐, アアアアア, アアアア, 47, 50, 11, 12, 14, フフフ, フフフフ, 宍, クフフフッ, フフッ, フフフフッ, クソッ, ビンタ |
| sudachi-wasm | 禰豆, 一, ギャハ, 肆, ガアア, 47, ２３, 50, 11, 12, 14, 宍色, クフフフッ, 宍毛 |

### Segmentation disagreement

125 regions where at least one candidate cuts differently, covering 377 of 2878 characters (13.1%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 44 | 93 | 104 | 25 |
| lindera-sudachidict |  | 97 | 105 | 55 |
| lindera-ipadic |  |  | 11 | 82 |
| kuromoji |  |  |  | 81 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 8× 炭·治郎 / 炭治郎 / 炭·治郎 / 炭·治郎 / 炭·治郎
- 5× だろう / だろう / だろ·う / だろ·う / だろう
- 4× ！　 / ！　 / ！　 / ！·　 / ！·　
- 4× ２人 / ２·人 / ２·人 / ２·人 / ２人
- 4× 兄·ちゃん / 兄ちゃん / 兄ちゃん / 兄ちゃん / 兄·ちゃん
- 3× こんな·に / こんな·に / こんなに / こんなに / こんな·に
- 3× と·いう / と·いう / という / という / と·いう
- 3× 禰豆·子 / 禰豆子 / 禰豆·子 / 禰·豆·子 / 禰豆·子
- 3× 錆·兎 / 錆兎 / 錆·兎 / 錆·兎 / 錆·兎
- 3× ハ·ア / ハア / ハア / ハア / ハア
- 3× 何·だ / 何·だ / 何だ / 何だ / 何·だ
- 3× で·も / で·も / でも / でも / で·も
- 3× フフ·フフ / フフ·フフ / フフフフ / フフフフ / フフフフ
- 2× ？　 / ？　 / ？　 / ？·　 / ？·　
- 2× ギヤ·アア / ギヤアア / ギヤアア / ギヤアア / ギヤアア
- 2× 許·さん / 許·さん / 許さ·ん / 許さ·ん / 許·さん
- 2× 江戸·時代 / 江戸時代 / 江戸·時代 / 江戸·時代 / 江戸·時代
- 2× 5·0 / 5·0 / 50 / 50 / 50
- 2× か·も / か·も / かも / かも / か·も
- 1× 斬り込む / 斬り込む / 斬り·込む / 斬り·込む / 斬り込む
- 1× これ·から / これ·から / これから / これから / これ·から
- 1× ご·ちそう / ごちそう / ごちそう / ごちそう / ご·ちそう
- 1× 久し·ぶり / 久しぶり / 久しぶり / 久しぶり / 久し·ぶり
- 1× 食べ盛り / 食べ盛り / 食べ·盛り / 食べ·盛り / 食べ盛り
- 1× 力·も / 力·も / 力も / 力も / 力·も

### Lemma disagreement on identical spans

820 content tokens have the same span in all five candidates. The lemma string differs in 270 of them (32.9%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 22× いる / 居る / いる / いる / いる
- 18× する / 為る / する / する / する
- 9× お前 / 御前 / お前 / お前 / お前
- 9× この / 此の / この / この / この
- 8× なる / 成る / なる / なる / なる
- 8× あいつ / 彼奴 / あいつ / あいつ / あいつ
- 7× ここ / 此処 / ここ / ここ / ここ
- 7× 斬る / 切る / 斬る / 斬る / 斬る
- 7× また / 又 / また / また / また
- 6× その / 其の / その / その / その
- 6× うっ / うう / うる / うる / うっ
- 5× あ / あー / あ / あ / あ
- 5× くる / 来る / くる / くる / くる
- 5× やる / 遣る / やる / やる / やる
- 5× できる / 出来る / できる / できる / できる
- 4× とき / 時 / とき / とき / とき
- 4× 斬れる / 切る / 斬る / 斬る / 斬れる
- 4× それ / 其れ / それ / それ / それ
- 4× ハア / はあ / ハア / ハア / ハア
- 3× ない / 無い / ない / ない / ない
- 3× ありがとう / 有り難う / ありがとう / ありがとう / ありがとう
- 3× 厄除 / 厄除け / 厄除 / 厄除 / 厄除
- 3× 殺 / 殺 / 殺る / 殺る / 殺
- 3× ども / 共 / ども / ども / ども
- 3× フフフ / ふふふ / フフフ / フフフ / フフフ

## Text: transcript

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 8236 | 3641 | 5 | 704 | 687 | 29 |
| lindera-sudachidict | 7997 | 3480 | 24 | 692 | 692 | 0 |
| lindera-ipadic | 7652 | 3659 | 161 | 771 | 771 | 0 |
| kuromoji | 7652 | 3659 | 161 | 771 | 771 | 0 |
| sudachi-wasm | 8128 | 3596 | 53 | 729 | 698 | 31 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | 分かる(ワカル): わかる, 分かる; 痩せる(ヤセル): やせる, 痩せる; 居る(イル): いる, 居る; 皆(ミナ): 皆, みんな; 一(イチ): 1, 一; 取る(トル): 撮る, とる; 来る(クル): くる, 来る; 何(ナニ): なん, 何; 言う(イウ): いう, 言う; 余り(アマリ): あんまり, あまり, あんま; 行く(イク): いける, いく, 行く, イケる; 凄い(スゴイ): すごい, すっごい |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | 分かる: わかる, 分かる; 痩せる: やせる, 痩せる; 居る: いる, 居る; 皆: 皆, みんな; 来る: くる, 来る; えっ: え, えっ; 1: 1, 一; 何: なん, 何; 言う: いう, 言う; 余り: あんまり, あまり; 行く: いける, いく, 行く, イケる; 凄い: すごい, すっごい |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | YUYU, YouTube, パトレオン, Discord |
| lindera-sudachidict | YUYU, ？, A, B, C, ：, YouTube, パトレオン, Discord |
| lindera-ipadic | YUYU, ポッドキャスト, 2023, 10, 5, 1, 3, パトレオン, コラボ, ゃいけないことがすごく, ジェットラグ, ラグ, 13, 11, 30, 7, 2, 6, 78, kg, 69, 70, 8, 12, 15 |
| kuromoji | YUYU, ポッドキャスト, 2023, 10, 5, 1, 3, パトレオン, コラボ, ゃいけないことがすごく, ジェットラグ, ラグ, 13, 11, 30, 7, 2, 6, 78, kg, 69, 70, 8, 12, 15 |
| sudachi-wasm | YUYU, 2023, 10, 13, 11, 30, 78, 69, 70, 12, 一, 15, 177, 60, B, C, 20, YouTube, 85, 90, 80, 50, 100, パトレオン, Discord |

### Segmentation disagreement

646 regions where at least one candidate cuts differently, covering 2177 of 12708 characters (17.1%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 204 | 588 | 588 | 93 |
| lindera-sudachidict |  | 500 | 500 | 213 |
| lindera-ipadic |  |  | 0 | 510 |
| kuromoji |  |  |  | 510 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 59× と·か / と·か / とか / とか / と·か
- 43× って·いう / って·いう / っていう / っていう / って·いう
- 27× 日本·人 / 日本人 / 日本人 / 日本人 / 日本·人
- 26× なん·か / なん·か / なんか / なんか / なん·か
- 26× の·で / の·で / ので / ので / の·で
- 16× けど·も / けど·も / けども / けども / けど·も
- 14× な·の·で / な·の·で / なので / なので / な·の·で
- 13× 自転·車 / 自転車 / 自転車 / 自転車 / 自転·車
- 12× で·も / で·も / でも / でも / で·も
- 12× か·な·って / か·な·って / かなっ·て / かなっ·て / か·な·って
- 12× コカ·コーラ / コカコーラ / コカコーラ / コカコーラ / コカコーラ
- 10× ポッド·キャスト / ポッド·キャスト / ポッドキャスト / ポッドキャスト / ポッド·キャスト
- 9× Y·U·Y·U / YUYU / YUYU / YUYU / YUYU
- 9× 皆·さん / 皆·さん / 皆さん / 皆さん / 皆·さん
- 9× k·g / kg / kg / kg / kg
- 8× そう·いう / そう·いう / そういう / そういう / そう·いう
- 7× 1·0 / 1·0 / 10 / 10 / 10
- 7× は·ね / は·ね / はね / はね / は·ね
- 7× お·母·さん / お母さん / お母さん / お母さん / お·母·さん
- 7× だろう / だろう / だろ·う / だろ·う / だろう
- 6× 日本·語 / 日本語 / 日本語 / 日本語 / 日本·語
- 6× と·し·て / と·し·て / として / として / と·し·て
- 5× 本当·に / 本当·に / 本当に / 本当に / 本当·に
- 5× と·いう / と·いう / という / という / と·いう
- 5× 考え·方 / 考え方 / 考え方 / 考え方 / 考え·方

### Lemma disagreement on identical spans

2821 content tokens have the same span in all five candidates. The lemma string differs in 886 of them (31.4%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 129× ま / まー / ま / ま / ま
- 82× する / 為る / する / する / する
- 81× いる / 居る / いる / いる / いる
- 61× その / 其の / その / その / その
- 46× ある / 有る / ある / ある / ある
- 33× なる / 成る / なる / なる / なる
- 25× いう / 言う / いう / いう / いう
- 20× お / 御 / お / お / お
- 20× すごい / 凄い / すごい / すごい / すごい
- 18× もの / 物 / もの / もの / もの
- 15× ちょっと / 一寸 / ちょっと / ちょっと / ちょっと
- 14× いい / 良い / いい / いい / いい
- 14× それ / 其れ / それ / それ / それ
- 13× ない / 無い / ない / ない / ない
- 12× やっぱ / 矢張り / やっぱ / やっぱ / やっぱ
- 12× やっぱり / 矢張り / やっぱり / やっぱり / やっぱり
- 11× やる / 遣る / やる / やる / やる
- 11× ところ / 所 / ところ / ところ / ところ
- 10× ヶ月 / 箇月 / ヶ月 / ヶ月 / ヶ月
- 10× これ / 此れ / これ / これ / これ
- 9× この / 此の / この / この / この
- 9× できる / 出来る / できる / できる / できる
- 9× しまう / 仕舞う / しまう / しまう / しまう
- 9× たち / 達 / たち / たち / たち
- 8× くる / 来る / くる / くる / くる

## Text: lyrics

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 665 | 266 | 69 | 161 | 161 | 2 |
| lindera-sudachidict | 543 | 392 | 165 | 170 | 170 | 0 |
| lindera-ipadic | 552 | 427 | 231 | 189 | 189 | 0 |
| kuromoji | 698 | 427 | 231 | 188 | 188 | 0 |
| sudachi-wasm | 718 | 309 | 47 | 169 | 168 | 2 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | 何(ナニ): なん, 何に; 時(トキ): 時, とき |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | 何: なん, 何に; 時: 時, とき |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | Here, ,, buddy, aah, amazing, ？) , everyday,  (, What, gonna, EBiDAN, ),, chotokkyu, Genin, Jibun, Tsumi, Batsu, Kiss, Hayato, Sano, Jinto, Yoshida, Yeah, Wow, People |
| lindera-sudachidict | Here, ,, (, Aah, ！, ), ？) , ？), ？, Ooh,  (, Ah, What, Da, Do, Yes, EBiDAN, ),, chotokkyu, M, LK, Genin, Jibun, Aru, Tsumi |
| lindera-ipadic | Here, we, go, ,, buddy, (, Aah, aah, ザ, ザッツ, ), amazing, ？) , ？), デコボコ, everyday, メイビー, Ooh,  (, Ah, What, you, gonna, do, ? |
| kuromoji | Here, we, go, ,, buddy, (, Aah, aah, ザ, ザッツ, ), amazing, ) , デコボコ, everyday, メイビー, Ooh,  (, Ah, What, you, gonna, do, ?, Da |
| sudachi-wasm | we, buddy, Aah, aah, amazing, everyday, Ooh, Ah, gonna, EBiDAN, chotokkyu, LK, Genin, Jibun, Aru, Tsumi, Batsu, Ame, Hayato, Sano, Jinto, Yoshida, Yeah, Wow, wow |

### Segmentation disagreement

110 regions where at least one candidate cuts differently, covering 304 of 1108 characters (27.4%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 87 | 98 | 97 | 74 |
| lindera-sudachidict |  | 28 | 31 | 21 |
| lindera-ipadic |  |  | 3 | 34 |
| kuromoji |  |  |  | 32 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 9× D·o / Do / Do / Do / Do
- 9× Y·e·s / Yes / Yes / Yes / Yes
- 8× D·a / Da / Da / Da / Da
- 8× m·y / my / my / my / my
- 7× d·o / do / do / do / do
- 6× w·o·w / wow / wow / wow / wow
- 4× だ·から / だ·から / だから / だから / だ·から
- 3× 超常 / 超常 / 超·常 / 超·常 / 超常
- 3× y·o·u / you / you / you / you
- 3× t·o / to / to / to / to
- 2× g·o / go / go / go / go
- 2× ？·) / ？) / ？) / ？·) / ？·)
- 2× なん·だ·かん·だ / なんだかんだ / なんだかんだ / なんだかんだ / なん·だ·かん·だ
- 2× 何に / 何に / 何·に / 何·に / 何に
- 2× O·o·h / Ooh / Ooh / Ooh / Ooh
- 2× A·h / Ah / Ah / Ah / Ah
- 2× だ·って / だ·って / だって / だって / だ·って
- 2× ), / ), / ), / ), / )·,
- 2× L·K / LK / LK / LK / LK
- 2× 鳴ら·せ / 鳴ら·せ / 鳴らせ / 鳴らせ / 鳴ら·せ
- 2× y·e·s / yes / yes / yes / yes
- 1× w·e / we / we / we / we
- 1× A·a·h / Aah / Aah / Aah / Aah
- 1× aah / aa·h / aah / aah / aah
- 1× なん·か / なん·か / なんか / なんか / なん·か

### Lemma disagreement on identical spans

192 content tokens have the same span in all five candidates. The lemma string differs in 102 of them (53.1%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 8× バディ / バディー / バディ / バディ / バディ
- 6× Yeah / Yeah / Yeah / Yeah / yeah
- 5× いい / 良い / いい / いい / いい
- 4× Wow / Wow / Wow / Wow / wow
- 3× What / What / What / What / what
- 3× gonna / ガナ / gonna / gonna / gonna
- 3× 信ずる / 信じる / 信じる / 信じる / 信ずる
- 3× 気づく / 気付く / 気づく / 気づく / 気づく
- 3× すべて / 全て / すべて / すべて / すべて
- 3× その / 其の / その / その / その
- 3× なる / 成る / なる / なる / なる
- 2× buddy / バディー / buddy / buddy / buddy
- 2× かなり / 可成 / かなり / かなり / かなり
- 2× めちゃくちゃ / 目茶苦茶 / めちゃくちゃ / めちゃくちゃ / めちゃくちゃ
- 2× ない / 無い / ない / ない / ない
- 2× ホシ / 星 / ホシ / ホシ / ホシ
- 2× 掴める / 掴む / 掴める / 掴める / 掴める
- 2× people / ピープル / people / people / People
- 2× しまう / 仕舞う / しまう / しまう / しまう
- 2× いる / 居る / いる / いる / いる
- 1× amazing / アメージング / amazing / amazing / amazing
- 1× する / 為る / する / する / する
- 1× ハマる / 嵌まる / ハマる / ハマる / ハマる
- 1× すぎる / 過ぎる / すぎる / すぎる / すぎる
- 1× みる / 見る / みる / みる / みる

## Text: lyrics-classic

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 280 | 162 | 0 | 103 | 102 | 3 |
| lindera-sudachidict | 277 | 160 | 0 | 101 | 101 | 0 |
| lindera-ipadic | 280 | 168 | 1 | 108 | 108 | 0 |
| kuromoji | 336 | 168 | 1 | 108 | 108 | 0 |
| sudachi-wasm | 333 | 163 | 2 | 104 | 105 | 1 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | 兎(ウサギ): 兎, うさぎ; 来る(クル): くる, 来る; 先(サキ): 先, さき |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | 来る: くる, 来る |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | none |
| lindera-sudachidict | none |
| lindera-ipadic | 恙 |
| kuromoji | 恙 |
| sudachi-wasm | 十五, 一 |

### Segmentation disagreement

30 regions where at least one candidate cuts differently, covering 98 of 446 characters (22.0%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 3 | 28 | 28 | 3 |
| lindera-sudachidict |  | 29 | 29 | 6 |
| lindera-ipadic |  |  | 0 | 27 |
| kuromoji |  |  |  | 27 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 6× ましょう / ましょう / ましょ·う / ましょ·う / ましょう
- 2× か·の / か·の / かの / かの / かの
- 2× 夕焼·小焼 / 夕焼小焼 / 夕·焼·小·焼 / 夕·焼·小·焼 / 夕焼·小焼
- 1× 小鮒 / 小鮒 / 小·鮒 / 小·鮒 / 小鮒
- 1× 恙な·し / 恙な·し / 恙·なし / 恙·なし / 恙な·し
- 1× いずる / いずる / い·ずる / い·ずる / いずる
- 1× 清·き / 清·き / 清き / 清き / 清·き
- 1× 小籠 / 小籠 / 小·籠 / 小·籠 / 小籠
- 1× まぼろし·か / まぼろし·か / ま·ぼろ·しか / ま·ぼろ·しか / まぼろし·か
- 1× 十·五 / 十·五 / 十·五 / 十·五 / 十五
- 1× お·里 / お·里 / お里 / お里 / お·里
- 1× 絶え·はて / 絶え·はて / 絶えはて / 絶えはて / 絶え·はて
- 1× お·腰 / お·腰 / お腰 / お腰 / お·腰
- 1× 黍·団子 / 黍団子 / 黍·団子 / 黍·団子 / 黍·団子
- 1× 一·つ / 一·つ / 一つ / 一つ / 一·つ
- 1× これ·から / これ·から / これから / これから / これ·から
- 1× つい·て·行く / つい·て·行く / ついて行く / ついて行く / つい·て·行く
- 1× に·つい·て / に·つい·て / について / について / に·つい·て
- 1× せかい / せかい / せ·かい / せ·かい / せかい
- 1× どう·し·て / どう·し·て / どうして / どうして / どう·し·て
- 1× そんな·に / そんな·に / そんなに / そんなに / そんな·に
- 1× なん·と / なん·と / なんと / なんと / なん·と
- 1× むこう / むこう / むこ·う / むこ·う / むこう

### Lemma disagreement on identical spans

128 content tokens have the same span in all five candidates. The lemma string differs in 32 of them (25.0%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 3× やる / 遣る / やる / やる / やる
- 2× いる / 居る / いる / いる / いる
- 2× 赤とんぼ / 赤蜻蛉 / 赤とんぼ / 赤とんぼ / 赤とんぼ
- 2× おまえ / 御前 / おまえ / おまえ / おまえ
- 1× 釣り / 釣り / 釣る / 釣る / 釣り
- 1× めぐる / 巡る / めぐる / めぐる / めぐる
- 1× がたし / 難い / がたい / がたい / がたし
- 1× くる / 来る / くる / くる / くる
- 1× 思い / 思い / 思う / 思う / 思い
- 1× はたして / 果たして / はたして / はたして / はたして
- 1× 青し / 青い / 青い / 青い / 青し
- 1× 姐 / 姉 / 姐 / 姐 / 姐
- 1× わたし / 私 / わたし / わたし / わたし
- 1× あなた / 貴方 / あなた / あなた / あなた
- 1× なる / 成る / なる / なる / なる
- 1× かめる / 噛む / かめよ / かめよ / かめる
- 1× のろい / 呪い / のろい / のろい / のろい
- 1× もの / 物 / もの / もの / もの
- 1× ない / 無い / ない / ない / ない
- 1× のろい / 鈍い / のろい / のろい / のろい
- 1× おっしゃる / 仰る / おっしゃる / おっしゃる / おっしゃる
- 1× うさぎ / 兎 / うさぎ / うさぎ / うさぎ
- 1× そん / 其れ / そん / そん / そん
- 1× かけくらべ / 駆け競べ / かけくらべ / かけくらべ / かけくらべ
- 1× ふもと / 麓 / ふもと / ふもと / ふもと

## Text: prose

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 6465 | 2912 | 8 | 1160 | 1111 | 57 |
| lindera-sudachidict | 6411 | 2887 | 16 | 1101 | 1101 | 0 |
| lindera-ipadic | 6389 | 3010 | 127 | 1192 | 1192 | 0 |
| kuromoji | 6403 | 3004 | 118 | 1190 | 1190 | 0 |
| sudachi-wasm | 6466 | 2904 | 34 | 1161 | 1100 | 54 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | 成る(ナル): なる, なれる; 有る(アル): ある, 在る; 一(イチ): 一, いち; 此の(コノ): 此の, この; 無い(ナイ): 無い, ない; 事(コト): 事, こと; 居る(イル): いる, 居る; 御(ゴ): 御, ご; 歩く(アルク): 歩く, あるく, 歩ける; 今(イマ): 今, いま; 此れ(コレ): 此, これ; 見る(ミル): みる, 見る |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | 有る: ある, 在る; 此の: 此の, この; 無い: 無い, ない; 居る: いる, 居る; 御: 御, お, ご; 歩く: 歩く, あるく, 歩ける; 此れ: 此, これ; 見る: みる, 見る; 行く: 行く, いける, ゆく; 既に: 既に, すでに; 何: なん, 何, なに; 暢気: のんき, 呑気 |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | ！　, ？　 |
| lindera-sudachidict | ！」, ？」, ！　, ？　, （, ） |
| lindera-ipadic | メロス, 此, シラクス, セリヌンティウス, アレキス, 警吏, ディオニス, 賤, 悧巧, ――」, 怺, 互, ！　, ざんぶと, 韋駄, ？　, 哉, ――, 潺々, 裂目, 颯, フィロストラトス, 吏, ぱだかじゃないか, シルレル |
| kuromoji | メロス, 此, シラクス, セリヌンティウス, アレキス, 警, 吏, ディオニス, 賤, 悧, 怺, 互, ざんぶと, 韋, 哉, 潺, 裂, 颯, フィロストラトス, ぱだかじゃないか, シルレル |
| sudachi-wasm | 一, 十, 十六, 二, 六, 三, 百 |

### Segmentation disagreement

294 regions where at least one candidate cuts differently, covering 914 of 9814 characters (9.3%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 48 | 254 | 267 | 15 |
| lindera-sudachidict |  | 260 | 272 | 53 |
| lindera-ipadic |  |  | 14 | 267 |
| kuromoji |  |  |  | 264 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 10× それ·から / それ·から / それから / それから / それ·から
- 10× で·も / で·も / でも / でも / で·も
- 7× そう·し·て / そう·し·て / そうして / そうして / そう·し·て
- 7× ！　 / ！　 / ！　 / ！·　 / ！·　
- 6× 結婚·式 / 結婚式 / 結婚式 / 結婚式 / 結婚·式
- 6× と·いう / と·いう / という / という / と·いう
- 6× だろう / だろう / だろ·う / だろ·う / だろう
- 5× けれど·も / けれど·も / けれども / けれども / けれど·も
- 5× と·し·て / と·し·て / として / として / と·し·て
- 5× ！·」 / ！」 / ！·」 / ！·」 / ！·」
- 4× 二人 / 二人 / 二·人 / 二·人 / 二人
- 4× これ·から / これ·から / これから / これから / これ·から
- 4× 王·様 / 王様 / 王様 / 王様 / 王·様
- 3× だ·って / だ·って / だって / だって / だ·って
- 3× 一人 / 一人 / 一·人 / 一·人 / 一人
- 3× やろう / やろう / やろ·う / やろ·う / やろう
- 3× 佳·き / 佳·き / 佳き / 佳き / 佳·き
- 3× 神々 / 神々 / 神·々 / 神·々 / 神々
- 3× 一·つ / 一·つ / 一つ / 一つ / 一·つ
- 3× だ·の / だ·の / だの / だの / だ·の
- 2× 此の / 此の / 此·の / 此·の / 此の
- 2× やっ·て·来 / やっ·て·来 / やって来 / やって来 / やっ·て·来
- 2× 十·六 / 十·六 / 十·六 / 十·六 / 十六
- 2× 竹馬·の·友 / 竹馬の友 / 竹馬·の·友 / 竹馬·の·友 / 竹馬·の·友
- 2× なん·だ·か / なん·だ·か / なんだか / なんだか / なん·だ·か

### Lemma disagreement on identical spans

2550 content tokens have the same span in all five candidates. The lemma string differs in 754 of them (29.6%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 71× する / 為る / する / する / する
- 53× いる / 居る / いる / いる / いる
- 38× なる / 成る / なる / なる / なる
- 21× その / 其の / その / その / その
- 21× くれる / 呉れる / くれる / くれる / くれる
- 20× おまえ / 御前 / おまえ / おまえ / おまえ
- 12× この / 此の / この / この / この
- 12× やる / 遣る / やる / やる / やる
- 11× それ / 其れ / それ / それ / それ
- 11× 信ずる / 信じる / 信じる / 信じる / 信ずる
- 11× いい / 良い / いい / いい / いい
- 10× ここ / 此処 / ここ / ここ / ここ
- 10× もの / 物 / もの / もの / もの
- 9× たち / 達 / たち / たち / たち
- 8× ある / 有る / ある / ある / ある
- 8× お / 御 / お / お / お
- 8× すぐ / 直ぐ / すぐ / すぐ / すぐ
- 7× しまう / 仕舞う / しまう / しまう / しまう
- 7× おくれる / 遅れる / おくれる / おくれる / おくれる
- 7× 群衆 / 群集 / 群衆 / 群衆 / 群衆
- 6× さま / 様 / さま / さま / さま
- 6× 挙げる / 上げる / 挙げる / 挙げる / 挙げる
- 6× よい / 良い / よい / よい / よい
- 6× 身代り / 身代わり / 身代り / 身代り / 身代り
- 5× みる / 見る / みる / みる / みる

## Text: wiki-miku

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 20149 | 11951 | 1014 | 2417 | 2395 | 49 |
| lindera-sudachidict | 18372 | 11368 | 1488 | 2606 | 2606 | 0 |
| lindera-ipadic | 17964 | 11269 | 2728 | 2649 | 2649 | 0 |
| kuromoji | 19063 | 11275 | 2725 | 2646 | 2646 | 0 |
| sudachi-wasm | 19690 | 10944 | 1123 | 2553 | 2477 | 75 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | ミク(ミク): ミク, みく; 称する(ショウスル): 称す, 称する; 様々(サマザマ): 様々, さまざま; 言う(イウ): いう, 言える, 言う; 二(ニ): 2, 二; 一(イチ): 1, 一; 評する(ヒョウスル): 評す, 評する; 達(タチ): 達, たち; 共(トモ): 共, とも; 他(ホカ): ほか, 他; 事(コト): こと, 事; 歌う(ウタウ): 歌う, 歌える |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | フューチャー: フューチャー, future; メディア: メディア, Media; バーチャル: バーチャル, Virtual; キャラクター: キャラクター, Character; 称する: 称す, 称する; 様々: 様々, さまざま; 言う: いう, 言える, 言う; 評する: 評す, 評する; 達: 達, たち; 共: 共, とも; 8: 8, 8.0; ソフト: ソフト, soft |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | Hatsune, Miku, ピアプロキャラクターズ, ボカロ, MEIKO, KAITO, 2007, YouTube, bilibili, VOCALOID, Sweet, Dark, Light, Vivid, Solid, English, Piapro, Studio, ORIGINAL, SWEET, DARK, SOLID, CHINESE, POPPRO, DECO |
| lindera-sudachidict | （, Hatsune, Miku, ）, クリプトン・フューチャー・メディア, ピアプロキャラクターズ, MEIKO, KAITO, キャラクター・ボーカル・シリーズ, （→#, ）。, /, （→, SNS, YouTube, bilibili, CGM, UGC, ：, VOCALOID, NT, CV, （#, ）、, V |
| lindera-ipadic | Hatsune, Miku, クリプトン・フューチャー・メディア, バーチャルシンガーソフトウェア, ピアプロキャラクターズ, ボカロ, 21, MEIKO, KAITO, 2007, 8, 31, 1, クリエイター, ムーブメント, （→#, 2021, /, SNS, YouTube, 474, bilibili, 437, 381, 2026 |
| kuromoji | Hatsune, Miku, クリプトン・フューチャー・メディア, バーチャルシンガーソフトウェア, ピアプロキャラクターズ, ボカロ, 21, MEIKO, KAITO, 2007, 8, 31, 1, クリエイター, ムーブメント, （→#, →#, 2021, /, SNS, YouTube, 474, bilibili, 437, 381 |
| sudachi-wasm | Hatsune, ピアプロキャラクターズ, ボカロ, 21, MEIKO, KAITO, 2007, 31, 一, 2021, YouTube, 474万, bilibili, 437万, 381万, 2026, 11, 2012, 10万, CGM, UGC, 二, 2025, VOCALOID, wat |

### Segmentation disagreement

2488 regions where at least one candidate cuts differently, covering 9982 of 35136 characters (28.4%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 1490 | 1508 | 1502 | 948 |
| lindera-sudachidict |  | 1999 | 1999 | 1782 |
| lindera-ipadic |  |  | 23 | 739 |
| kuromoji |  |  |  | 734 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 254× 初音·ミク / 初音ミク / 初音·ミク / 初音·ミク / 初音·ミク
- 66× と·し·て / と·し·て / として / として / と·し·て
- 36× 1·2 / 1·2 / 12 / 12 / 12
- 33× ）·。 / ）。 / ）·。 / ）·。 / ）·。
- 31× 1·0 / 1·0 / 10 / 10 / 10
- 31× 雪·ミク / 雪ミク / 雪·ミク / 雪·ミク / 雪·ミク
- 28× と·いう / と·いう / という / という / と·いう
- 24× 1·1 / 1·1 / 11 / 11 / 11
- 24× 2·0·2·5 / 2·0·2·5 / 2025 / 2025 / 2025
- 21× 3·1 / 3·1 / 31 / 31 / 31
- 21× 2·0·2·4 / 2·0·2·4 / 2024 / 2024 / 2024
- 20× N·T / NT / NT / NT / NT
- 19× に·よる / に·よる / による / による / に·よる
- 18× 2·0·2·0 / 2·0·2·0 / 2020 / 2020 / 2020
- 18× 2·0·1·1 / 2·0·1·1 / 2011 / 2011 / 2011
- 17× 2·0·1·7 / 2·0·1·7 / 2017 / 2017 / 2017
- 17× feat / fe·at / feat / feat / feat
- 16× G·T / GT / GT / GT / GT
- 15× マジカル·ミライ / マジカルミライ / マジカルミライ / マジカルミライ / マジカル·ミライ
- 15× ニコニコ·動画 / ニコニコ動画 / ニコニコ·動画 / ニコニコ·動画 / ニコニコ·動画
- 14× 3·0 / 3·0 / 30 / 30 / 30
- 13× 2·0·1·6 / 2·0·1·6 / 2016 / 2016 / 2016
- 13× に·おけ·る / に·おけ·る / における / における / に·おけ·る
- 13× V·e·r / Ver / Ver / Ver / Ver
- 12× と·共·に / と·共·に / と共に / と共に / と·共·に

### Lemma disagreement on identical spans

7170 content tokens have the same span in all five candidates. The lemma string differs in 1490 of them (20.8%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 450× する / 為る / する / する / する
- 126× いる / 居る / いる / いる / いる
- 68× なる / 成る / なる / なる / なる
- 67× MIKU / MIKU / MIKU / MIKU / miku
- 23× HATSUNE / HATSUNE / HATSUNE / HATSUNE / hatsune
- 21× VOCALOID / VOCALOID / VOCALOID / VOCALOID / vocaloid
- 18× この / 此の / この / この / この
- 18× ある / 有る / ある / ある / ある
- 13× および / 及び / および / および / および
- 12× これ / 此れ / これ / これ / これ
- 11× アーティスト / アーチスト / アーティスト / アーティスト / アーティスト
- 10× MEIKO / MEIKO / MEIKO / MEIKO / meiko
- 10× いく / 行く / いく / いく / いく
- 10× ため / 為 / ため / ため / ため
- 10× もの / 物 / もの / もの / もの
- 9× やる / 遣る / やる / やる / やる
- 9× その / 其の / その / その / その
- 9× DIVA / DIVA / DIVA / DIVA / diva
- 9× SUPER / SUPER / SUPER / SUPER / super
- 9× SNOW / SNOW / SNOW / SNOW / Snow
- 8× リン / 燐 / リン / リン / リン
- 8× KAITO / KAITO / KAITO / KAITO / kaito
- 8× いう / 言う / いう / いう / いう
- 8× ない / 無い / ない / ない / ない
- 8× それ / 其れ / それ / それ / それ

## Text: wiki-danmachi

| Candidate | Tokens | Content tokens | Unknown content tokens | Unique lemmas | Unique grouping keys | Keys that merge 2+ lemma spellings |
| --- | --- | --- | --- | --- | --- | --- |
| lindera-unidic | 54100 | 30292 | 873 | 5170 | 5088 | 178 |
| lindera-sudachidict | 51543 | 29137 | 1463 | 5234 | 5234 | 0 |
| lindera-ipadic | 50977 | 28959 | 4070 | 5307 | 5307 | 0 |
| kuromoji | 51329 | 28994 | 4079 | 5302 | 5302 | 0 |
| sudachi-wasm | 52748 | 29093 | 1506 | 5231 | 5072 | 158 |

### Merged spellings (up to 12 per candidate)

| Candidate | Examples |
| --- | --- |
| lindera-unidic | 出会い(デアイ): 出会い, であい; 求める(モトメル): 求める, もとめる; 間違う(マチガウ): 間違う, まちがう; 二(ニ): 2, ニ, 二; 一(イチ): 1, 一; 三(サン): 3, 三; 四(ヨン): 4, 四; 五(ゴ): 5, 五; 六(ロク): 6, 六; 為る(スル): する, す; 村(ムラ): むら, 村; 漫画(マンガ): 漫画, マンガ |
| lindera-sudachidict | none |
| lindera-ipadic | none |
| kuromoji | none |
| sudachi-wasm | 出会い: 出会い, であい; 求める: 求める, もとめる; 間違う: 間違う, まちがう; 居る: いる, おる; 年: 年, 歳; 1: 1, 一; 他: 他, ほか; 5: 5, 五; 為る: する, す; 村: むら, 村; 漫画: 漫画, マンガ; 眷属: 眷族, 眷属 |

### Unknown words (up to 25 per candidate)

| Candidate | Unknown surfaces |
| --- | --- |
| lindera-unidic | ヤスダスズヒト, オラリオ, メモリア・フレーゼ, ストーリ, TUEEE, シル・フローヴァ, ヘファイストス, ヘファイストス・ファミリア, リリルカ・アーデ, オッタル, ヴェルフ・クロッゾ, ヴェルフ, ナァーザ・エリスイス, ナァーザ, ディアンケヒト・ファミリア, アスフィ・アル・アンドロメダ, モルド, アスフィ, クロッゾ, ヒュアキントス・クリオ, アイシャ・ベルカ, フリュネ・ジャミール, フィン・ディムナ, ベオル, ウィーネ |
| lindera-sudachidict | 』（, ）, GA, （, SB, ヤスダスズヒト, オラリオ, ベル・クラネル, ソード・オラトリア, クロス・イストリア, メモリア・フレーゼ, ストーリ, TUEEE, シル・フローヴァ, ヘファイストス, ガネーシャ・ファミリア, ヘファイストス・ファミリア, リリルカ・アーデ, オッタル, ヘスティア・ファミリア, Lv, ）」, ヴェルフ・クロッゾ, ヴェルフ, ミアハ・ファミリア |
| lindera-ipadic | ダンジョン, 2013, 1, GA, SB, 45, 21, 16, 14, 2026, 5, ヤスダスズヒト, ニリツ, オラリオ, ベル・クラネル, ソード・オラトリア, アイズ・ヴァレンシュタイン, 2014, 2017, 2015, ヘスティア, ブラウザゲーム, クロス・イストリア, メモリア・フレーゼ, 2019 |
| kuromoji | ダンジョン, 2013, 1, GA, SB, 45, 21, 16, 14, 2026, 5, ヤスダスズヒト, ニリツ, オラリオ, ベル・クラネル, ソード・オラトリア, アイズ・ヴァレンシュタイン, 2014, 2017, 2015, ヘスティア, ブラウザゲーム, クロス・イストリア, メモリア・フレーゼ, 2019 |
| sudachi-wasm | 2013, 45, 21, 16, 14, 2026, ヤスダスズヒト, ニリツ, オラリオ, 2014, 2017, 2015, 2019, 千, 15, ストーリ, TUEEE, 二, フローヴァ, ヘファイストス, リリルカ, オッタル, ヴェルフ, クロッゾ, 三 |

### Segmentation disagreement

4478 regions where at least one candidate cuts differently, covering 17985 of 88841 characters (20.2%).

Regions where the pair cuts differently:

|  | lindera-sudachidict | lindera-ipadic | kuromoji | sudachi-wasm |
| --- | --- | --- | --- | --- |
| lindera-unidic | 1870 | 3220 | 3214 | 1411 |
| lindera-sudachidict |  | 3697 | 3694 | 2507 |
| lindera-ipadic |  |  | 37 | 2286 |
| kuromoji |  |  |  | 2281 |

Most frequent regions, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 123× 冒険·者 / 冒険者 / 冒険·者 / 冒険·者 / 冒険·者
- 110× と·し·て / と·し·て / として / として / と·し·て
- 110× に·より / に·より / により / により / に·より
- 110× フレイ·ヤ / フレイ·ヤ / フレイヤ / フレイヤ / フレイヤ
- 91× L·v / Lv / Lv / Lv / Lv
- 71× 異端·児 / 異端児 / 異端·児 / 異端·児 / 異端·児
- 62× に·よる / に·よる / による / による / に·よる
- 51× ロキ·・·ファミリア / ロキ·・·ファミリア / ロキ・ファミリア / ロキ・ファミリア / ロキ·・·ファミリア
- 49× と·共·に / と·共·に / と共に / と共に / と·共·に
- 47× ランク·アップ / ランクアップ / ランク·アップ / ランク·アップ / ランク·アップ
- 46× と·いう / と·いう / という / という / と·いう
- 46× ヘルメス / ヘルメス / ヘル·メス / ヘル·メス / ヘルメス
- 43× ヘスティア·・·ファミリア / ヘスティア·・·ファミリア / ヘスティア・ファミリア / ヘスティア・ファミリア / ヘスティア·・·ファミリア
- 39× ダンジョン·に·出会い·を·求める·の·は·間違っ·て·いる·だろう·か / ダンジョンに出会いを求めるのは間違っているだろうか / ダンジョン·に·出会い·を·求める·の·は·間違っ·て·いる·だろ·う·か / ダンジョン·に·出会い·を·求める·の·は·間違っ·て·いる·だろ·う·か / ダンジョン·に·出会い·を·求める·の·は·間違っ·て·いる·だろう·か
- 39× 階·層 / 階層 / 階層 / 階層 / 階層
- 37× 春姫 / 春姫 / 春·姫 / 春·姫 / 春姫
- 36× 二·つ / 二·つ / 二つ / 二つ / 二·つ
- 36× 一人 / 一人 / 一·人 / 一·人 / 一人
- 34× 神々 / 神々 / 神·々 / 神·々 / 神々
- 34× 1·0 / 1·0 / 10 / 10 / 10
- 34× 1·2 / 1·2 / 12 / 12 / 12
- 33× 1·8 / 1·8 / 18 / 18 / 18
- 27× 魔剣 / 魔剣 / 魔·剣 / 魔·剣 / 魔剣
- 24× ライト·ノベル / ライトノベル / ライト·ノベル / ライト·ノベル / ライト·ノベル
- 24× に·おい·て / に·おい·て / において / において / に·おい·て

### Lemma disagreement on identical spans

22140 content tokens have the same span in all five candidates. The lemma string differs in 4517 of them (20.4%).

Most frequent, in the order lindera-unidic / lindera-sudachidict / lindera-ipadic / kuromoji / sudachi-wasm:

- 1828× する / 為る / する / する / する
- 345× いる / 居る / いる / いる / いる
- 225× ため / 為 / ため / ため / ため
- 222× なる / 成る / なる / なる / なる
- 200× たち / 達 / たち / たち / たち
- 116× その / 其の / その / その / その
- 95× ある / 有る / ある / ある / ある
- 80× 眷族 / 眷属 / 眷族 / 眷族 / 眷族
- 65× ヘスティア / ヘスティアー / ヘスティア / ヘスティア / ヘスティア
- 58× この / 此の / この / この / この
- 57× これ / 此れ / これ / これ / これ
- 52× できる / 出来る / できる / できる / できる
- 42× また / 又 / また / また / また
- 37× ない / 無い / ない / ない / ない
- 36× しまう / 仕舞う / しまう / しまう / しまう
- 34× ステイタス / ステータス / ステイタス / ステイタス / ステイタス
- 32× かつて / 嘗て / かつて / かつて / かつて
- 30× ら / 等 / ら / ら / ら
- 28× パーティ / パーティー / パーティ / パーティ / パーティ
- 24× 穢れる / 汚れる / 穢れる / 穢れる / 穢れる
- 22× アビリティ / アビリティー / アビリティ / アビリティ / アビリティ
- 21× すごい / 凄い / すごい / すごい / すごい
- 20× くる / 来る / くる / くる / くる
- 20× ディオニュソス / ディオニューソス / ディオニュソス / ディオニュソス / ディオニュソス
- 15× もらう / 貰う / もらう / もらう / もらう
