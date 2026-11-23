# Text and background colors for the reader

Research for the "Reading options" of the reader (issue 51 lists "Text color and Background (swatches)", and issue 116 asks where these options live). Question: which text and background pairs do established reading apps ship for light and dark modes, how do they tie them to the system theme, and what do readability research and contrast standards say? This note gathers facts and does not choose between the options on the table. Facts were gathered on 2026-11-22 from published source code (Firefox, Chromium, Calibre, Foliate, Readium CSS, Thorium), vendor help pages, W3C documents and PubMed abstracts.

## Summary

- Apps that publish their colors ship a short list of fixed text and background pairs. Sepia, a gray, a dark theme and a black high contrast theme recur in almost every list.
- Three ways to tie a list to the system theme exist in the sources. A "Default" or "Auto" entry follows the system and the others stay fixed (Firefox, Chrome, Calibre). Every named theme has a light and a dark version and the system picks one (Foliate, Readwise Reader, Apple Books). Or the app offers only page colors and follows dark mode on its own (Kindle, Google Play Books).
- Separate text and background controls are rare. Firefox has them behind a "Custom" tab, and Calibre lets a user save a custom pair. Kindle, Kobo, Google Play Books and Apple Books let the user pick only a page color or a theme.
- Every published pair passes WCAG AA (4.5:1). The lowest are Chrome "Low contrast dark" (4.72:1) and Foliate "Solarized light" (4.99:1). Several pairs fall below the APCA body text minimum of Lc 75 even though they pass WCAG.
- Research finds a consistent advantage for dark text on a light background, explained by higher display luminance rather than polarity itself. Readers with cloudy ocular media (for example cataract) read faster with light text on dark.
- Evidence for warm tinted backgrounds is one large online study. Evidence for colored overlays (Irlen) does not support them. The halation claim for astigmatism in dark mode has no primary study behind it that this search found.
- Apps that publish source code change selection and highlight colors per theme, not only text and background.

## How established apps offer colors

### Firefox Reader View

The Colors menu has two tabs (`COLORS_MENU_TABS = ["fxtheme", "customtheme"]` in [AboutReader.sys.mjs](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/components/reader/AboutReader.sys.mjs)). The theme tab offers Auto, Light, Dark, Sepia, Contrast and Gray, and the default is Auto (`reader.color_scheme` and `reader.color_scheme.values` in [all.js](https://github.com/mozilla-firefox/firefox/blob/main/modules/libpref/init/all.js)). Auto resolves to Dark or Light from `matchMedia("(prefers-color-scheme: dark)")` and listens for changes. Sepia, Gray and Contrast stay the same in both system themes.

The Custom tab has five color inputs: text, background, unvisited links, visited links and selection highlight (`CUSTOM_THEME_COLOR_INPUTS`). The custom defaults are white background and `#15141a` text, with `#ffffcc` as the selection highlight. When the OS forces colors (Windows high contrast), Reader View switches to an `hcm` scheme built from system colors and hides the whole Colors menu.

Colors come from [aboutReader.css](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/themes/shared/aboutReader.css). The Gray background is the design token `--color-gray-30`, which is `#bac2ca` in [tokens-shared.css](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/themes/shared/design-system/dist/tokens-shared.css), and `#b7b6ba` under the pref-gated "Nova" redesign.

### Chrome reading mode

The color menu lists Default, Light, Dark, Yellow, Blue, High contrast, Low contrast light and Low contrast dark (string IDs in [read_anything_untrusted_ui.cc](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/webui/side_panel/read_anything/read_anything_untrusted_ui.cc)). Default resolves to the Light or Dark values from the browser's dark mode. All other themes are fixed, and the source says why: "The Read Anything themes need to be hard coded because they do not change with the chrome theme, which is the purpose of the Read Anything feature" ([chrome_color_mixer.cc](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/color/chrome_color_mixer.cc)). Named Google colors resolve through [color_palette.h](https://github.com/chromium/chromium/blob/main/ui/gfx/color_palette.h). There is no custom color picker.

### Calibre viewer

Built-in schemes are System, White, Black, Sepia light and Sepia dark ([globals.pyj](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/globals.pyj)). System is `#000` on `#fff`, and becomes `#ddd` on `#111` when `prefers-color-scheme: dark` matches. The others are fixed. Users can create named custom schemes, and a custom scheme is only valid when it has both a foreground and a background ([colors.pyj](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/prefs/colors.pyj)). So custom colors are saved as pairs.

### Foliate

Each of nine themes (Default, Gray, Sepia, Grass, Cherry, Sky, Solarized, Gruvbox, Nord) defines a `light` and a `dark` pair, each with text, background and link colors ([themes.js](https://github.com/johnfactotum/foliate/blob/gtk4/src/themes.js)). The viewer adds an `is-dark` class when the libadwaita style manager reports dark, which follows the system or the app's own color scheme setting ([book-viewer.js](https://github.com/johnfactotum/foliate/blob/gtk4/src/book-viewer.js)). Users add themes as JSON files in the config folder, again with a light and a dark pair.

### Readium CSS and Thorium Reader

Readium CSS 1.x shipped a sepia mode and a night mode with fixed colors ([night](https://github.com/readium/css/blob/v1.2.0/css/src/modules/ReadiumCSS-night_mode.css), [sepia](https://github.com/readium/css/blob/v1.2.0/css/src/modules/ReadiumCSS-sepia_mode.css)). Version 2 removed both and offers `--USER__backgroundColor` and `--USER__textColor` instead, leaving themes "to consumers' discretion" ([migration guide](https://github.com/readium/css/blob/develop/docs/CSS28-migration_guide.md)). Its user preference notes say "the vast majority of users will say they prefer basic settings (themes, typeface, and font size)" over customizable themes, which came "at a distant second place", with a warning that the survey sample was likely biased ([CSS15](https://github.com/readium/css/blob/develop/docs/CSS15-user_pref_insights.md)).

Thorium Reader, built on Readium, offers Neutral, Sepia, Night, Paper and four Contrast themes, all fixed pairs ([computeReadiumCssJsonMessage.ts](https://github.com/edrlab/thorium-reader/blob/develop/src/common/computeReadiumCssJsonMessage.ts)). Its theme list has no entry that follows the system ([Themes.tsx](https://github.com/edrlab/thorium-reader/blob/develop/src/renderer/reader/components/ReaderSettings/Themes.tsx)).

### Apple Books

Themes are Original, Quiet, Paper, Bold, Calm and Focus. Apple's guide says to "tap a page theme such as Quiet or Bold" and separately to "adjust the background mode" from an Appearance button ([iPhone guide](https://support.apple.com/en-sg/guide/iphone/iphc1af7c57/ios); [Mac guide](https://support.apple.com/guide/books/ibks8923126d/mac) names Light, Dark or Automatic). Customize changes font, bold text, spacing and margins; neither guide describes a text or background color control. TidBITS reports that the themes "combine font, size, color, and background settings", are "the only way to change the background color", and that the mode choices include Match Device and Match Surroundings, which uses the ambient light sensor ([TidBITS, 2022](https://tidbits.com/2022/10/03/apples-books-ios-16/), secondary). Apple publishes no hex values.

### Kindle, Kobo and Google Play Books

Kindle apps for iOS, Android, Mac and the web offer "Page Color: Choose between white, sepia, light green, and black", and the PC app offers white, sepia and black. On iOS and Android, "If you use Dark mode on your device, Kindle apps ... display Dark mode as well". No text color setting is mentioned ([Amazon help](https://digprjsurvey.amazon.com/csad/help/node/TABlJ4ot69emTO8jJG)). Amazon publishes no hex values.

The Kobo iOS app has "Page Colour: Tap the reading theme you want to use" and names only the Night theme, "white letters on a black background" ([Kobo help](https://help.kobo.com/hc/en-us/articles/360017708014-Adjust-screen-brightness-and-page-appearance-on-the-Kobo-Books-app-for-iOS)).

Google Play Books: "To change the color scheme, tap Light, Sepia, or Dark", and "If you change your phone's theme, it changes the color in Play Books" ([Google help](https://support.google.com/googleplay/answer/9755756)). No hex values.

### Safari Reader and Edge Immersive Reader

Safari Reader lets the user "choose a background theme", a font and a size ([Apple guide](https://support.apple.com/guide/safari/hide-ads-when-reading-sfri32632/mac)). The page does not name the themes or mention dark mode, and Reader's CSS is not open source.

Edge Immersive Reader offers "a variety of page themes and color options", including "themes inspired by Irlen Spectral Filters for people with Irlen Syndrome". A theme changes "the background and overall look of the page" ([Microsoft support](https://support.microsoft.com/en-us/topic/78a7a17d-52e1-47ee-b0ac-eff8539015e1)). No hex values and no separate text color control are documented.

### Readwise Reader and Instapaper

Readwise Reader has Light, Dark and Auto, where Auto detects "the theme of the operating system". Its reading themes are Crisp (default), Sepia, Soft, Slate, Ink and Night. "Each theme has a light and a dark version that follows your light or dark mode setting", "The Night theme stays dark in both versions", and themes "change the background, text, and highlight colors" ([Readwise docs](https://docs.readwise.io/reader/docs/faqs/appearance)). No hex values.

Instapaper has no current help page on themes. Reviews from 2012 and 2019 describe automatic switching to dark at sunset and later with iOS dark mode ([iMore](https://www.imore.com/instapaper-gains-support-ios-13s-dark-mode), secondary). Pocket is not covered.

## Established pairs and their contrast

WCAG is the WCAG 2.x contrast ratio. APCA is Lc from SAPC-APCA 0.0.98G-4g, where a negative value means light text on a dark background. Both were computed with a script outside the repo, checked against known values (21:1 and Lc 106.0 for black on white, 4.54:1 for `#767676` on white). Rello and Bigham's own reported ratios (14.35, 15.17, 19.4, 16.05) match the computed ones. The Michigo rows convert the OKLCH tokens in `apps/desktop/src/index.css` to sRGB and are approximate.

All hex values below come from published source code or the paper, except the two Michigo rows. No primary source publishes hex values for Apple Books, Kindle, Kobo, Google Play Books, Safari Reader, Edge or Readwise, so they are absent.

| App | Theme | Background | Text | WCAG | APCA Lc | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Firefox Reader View | Light | `#ffffff` | `#15141a` | 18.31:1 | +105.0 | [aboutReader.css](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/themes/shared/aboutReader.css) |
| Firefox Reader View | Dark | `#1c1b22` | `#fbfbfe` | 16.54:1 | -103.8 | same |
| Firefox Reader View | Sepia | `#f4ecd8` | `#5b4636` | 7.51:1 | +79.2 | same |
| Firefox Reader View | Gray | `#bac2ca` | `#15141a` | 10.16:1 | +69.3 | same, plus tokens-shared.css |
| Firefox Reader View | Contrast | `#000000` | `#ffffff` | 21.00:1 | -107.9 | same |
| Chrome reading mode | Light (Default in light) | `#ffffff` | `#1f1f1f` | 16.48:1 | +103.4 | [chrome_color_mixer.cc](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/color/chrome_color_mixer.cc) |
| Chrome reading mode | Dark (Default in dark) | `#202124` | `#e3e3e3` | 12.54:1 | -87.5 | same, plus color_palette.h |
| Chrome reading mode | Yellow | `#feefc3` | `#1f1f1f` | 14.40:1 | +94.3 | same |
| Chrome reading mode | Blue | `#d2e3fc` | `#1f1f1f` | 12.66:1 | +86.1 | same |
| Chrome reading mode | High contrast | `#202124` | `#ffff00` | 14.99:1 | -100.4 | same |
| Chrome reading mode | Low contrast light | `#dcd2cb` | `#624e41` | 5.26:1 | +61.9 | same |
| Chrome reading mode | Low contrast dark | `#302b26` | `#9b958d` | 4.72:1 | -41.3 | same |
| Calibre viewer | System (light), White | `#ffffff` | `#000000` | 21.00:1 | +106.0 | [globals.pyj](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/globals.pyj) |
| Calibre viewer | System (dark) | `#111111` | `#dddddd` | 13.90:1 | -85.5 | same |
| Calibre viewer | Black | `#000000` | `#ffffff` | 21.00:1 | -107.9 | same |
| Calibre viewer | Sepia light | `#f6f3e9` | `#39322b` | 11.36:1 | +91.4 | same |
| Calibre viewer | Sepia dark | `#39322b` | `#f6f3e9` | 11.36:1 | -94.1 | same |
| Foliate | Default, light | `#ffffff` | `#000000` | 21.00:1 | +106.0 | [themes.js](https://github.com/johnfactotum/foliate/blob/gtk4/src/themes.js) |
| Foliate | Default, dark | `#222222` | `#e0e0e0` | 12.05:1 | -85.5 | same |
| Foliate | Gray, light | `#e0e0e0` | `#222222` | 12.05:1 | +84.7 | same |
| Foliate | Gray, dark | `#444444` | `#c6c6c6` | 5.70:1 | -61.0 | same |
| Foliate | Sepia, light | `#f1e8d0` | `#5b4636` | 7.24:1 | +76.8 | same |
| Foliate | Sepia, dark | `#342e25` | `#ffd595` | 9.72:1 | -80.2 | same |
| Foliate | Grass, light | `#d7dbbd` | `#232c16` | 10.22:1 | +78.6 | same |
| Foliate | Grass, dark | `#333627` | `#d8deba` | 8.88:1 | -78.1 | same |
| Foliate | Cherry, light | `#f0d1d5` | `#4e1609` | 10.25:1 | +78.2 | same |
| Foliate | Cherry, dark | `#462f32` | `#e5c4c8` | 7.62:1 | -69.1 | same |
| Foliate | Sky, light | `#cedef5` | `#262d48` | 9.92:1 | +79.8 | same |
| Foliate | Sky, dark | `#282e47` | `#babee1` | 7.34:1 | -63.7 | same |
| Foliate | Solarized, light | `#fdf6e3` | `#586e75` | 4.99:1 | +71.6 | same |
| Foliate | Solarized, dark | `#002b36` | `#93a1a1` | 5.61:1 | -46.4 | same |
| Foliate | Gruvbox, light | `#fbf1c7` | `#3c3836` | 10.22:1 | +88.1 | same |
| Foliate | Gruvbox, dark | `#282828` | `#ebdbb2` | 10.75:1 | -81.9 | same |
| Foliate | Nord, light | `#eceff4` | `#2e3440` | 10.84:1 | +88.7 | same |
| Foliate | Nord, dark | `#2e3440` | `#d8dee9` | 9.25:1 | -80.3 | same |
| Readium CSS 2 | Default | `#ffffff` | `#121212` | 18.73:1 | +105.3 | [CSS-Variables.md](https://github.com/readium/css/blob/develop/css/vars/CSS-Variables.md) |
| Readium CSS 1.2 | Sepia mode | `#faf4e8` | `#121212` | 17.10:1 | +99.0 | [sepia_mode.css](https://github.com/readium/css/blob/v1.2.0/css/src/modules/ReadiumCSS-sepia_mode.css) |
| Readium CSS 1.2 | Night mode | `#000000` | `#fefefe` | 20.82:1 | -107.2 | [night_mode.css](https://github.com/readium/css/blob/v1.2.0/css/src/modules/ReadiumCSS-night_mode.css) |
| Thorium Reader | Neutral | `#ffffff` | `#121212` | 18.73:1 | +105.3 | [computeReadiumCssJsonMessage.ts](https://github.com/edrlab/thorium-reader/blob/develop/src/common/computeReadiumCssJsonMessage.ts) |
| Thorium Reader | Sepia | `#faf4e8` | `#000000` | 19.17:1 | +99.8 | same |
| Thorium Reader | Night | `#121212` | `#ffffff` | 18.73:1 | -107.3 | same |
| Thorium Reader | Paper | `#e9ddc8` | `#000000` | 15.64:1 | +86.8 | same |
| Thorium Reader | Contrast 1 | `#000000` | `#ffffff` | 21.00:1 | -107.9 | same |
| Thorium Reader | Contrast 2 | `#000000` | `#ffff00` | 19.56:1 | -102.7 | same |
| Thorium Reader | Contrast 3 | `#181842` | `#ffffff` | 16.82:1 | -106.0 | same |
| Thorium Reader | Contrast 4 | `#c5e7cd` | `#000000` | 15.69:1 | +87.0 | same |
| Rello and Bigham 2017 | Peach (study stimulus) | `#edd1b0` | `#000000` | 14.35:1 | +81.7 | [paper](https://doi.org/10.1145/3132525.3132546) |
| Rello and Bigham 2017 | Orange (study stimulus) | `#eddd6e` | `#000000` | 15.17:1 | +85.0 | same |
| Rello and Bigham 2017 | Yellow (study stimulus) | `#f8fd89` | `#000000` | 19.40:1 | +100.6 | same |
| Rello and Bigham 2017 | Blue Grey (study stimulus) | `#dbe1f1` | `#000000` | 16.05:1 | +88.4 | same |
| Michigo app theme | Light (approximate) | `#f5f8fa` | `#1a1e26` | 15.66:1 | +99.2 | `apps/desktop/src/index.css` |
| Michigo app theme | Dark (approximate) | `#0f1219` | `#f2f4f7` | 17.00:1 | -99.9 | same |

### What the numbers show

- Sepia themes differ a lot. Firefox and Foliate use brown text on cream (7.2 to 7.5:1). Readium, Thorium and Calibre use near-black text on cream (11 to 19:1).
- Most dark themes avoid pure black. They use backgrounds from `#111111` to `#222222` and off-white text. Pure black appears in Firefox Contrast, Calibre Black, Thorium Contrast 1 and 2, and Readium 1.2 night mode.
- Pairs that pass WCAG AA but fall below APCA Lc 75: Firefox Gray (Lc 69.3), Foliate Solarized light (71.6) and dark (-46.4), Foliate Gray dark, Cherry dark and Sky dark, and both Chrome "Low contrast" themes. Chrome labels its two as low contrast on purpose.
- In the Rello and Bigham paper the RGB triplets in the stimulus list are shifted by one line against the hex values. The hex values match the reported ratios, so the table uses them.

## Japanese readers

Little primary material exists. BOOK☆WALKER's 2026 viewer renewal lets the reader change text size and background color with live preview, adds a "カスタム" button for finer background adjustment, and lets vertical text works switch to horizontal layout ([BOOK☆WALKER](https://bookwalker.jp/info/2026viewer_renewal/)). It names no colors and says nothing about dark mode or text color. The ebookjapan viewer puts its settings behind a gear icon and does not list colors ([ebookjapan](https://ebookjapan.yahoo.co.jp/app/update/setting.html)). No Japanese-specific color convention turned up.

Readium CSS ships separate stylesheets for CJK horizontal and vertical text, but colors are not language-specific there. Japan's web accessibility standard JIS X 8341-3:2016 is identical to ISO/IEC 40500:2012, which is WCAG 2.0 ([WAIC](https://waic.jp/docs/jis2016/understanding/201604/)), so the same 4.5:1 threshold applies. WCAG 1.4.8 sets a line width of 40 characters for CJK text, against 80 otherwise.

## Readability research

### Polarity: dark text on light

Buchner and Baumgartner (2007) found proofreading "consistently better with positive polarity", independent of ambient lighting (darkness or office light) and of chromaticity; "colour contrast (red text on green background) could not compensate for a lack of luminance contrast" ([Ergonomics 50(7)](https://pubmed.ncbi.nlm.nih.gov/17510822/)). Buchner, Mayr and Brandt (2009) equated overall display luminance and found "No positive polarity advantage", only "an effect of display luminance", and concluded that "Display polarity per se does not affect readability" ([Ergonomics 52(7)](https://pubmed.ncbi.nlm.nih.gov/19562598/)).

Piepenbrock and colleagues found the advantage in younger and older adults alike ([2013](https://pubmed.ncbi.nlm.nih.gov/23654206/)), linked it to smaller pupils ([2014](https://pubmed.ncbi.nlm.nih.gov/25135324/)), and found it "linearly increased with decreasing character size": "Especially with small font sizes, negative polarity displays should be avoided" ([Human Factors 2014](https://pubmed.ncbi.nlm.nih.gov/25141597/)). All these studies used black on white against white on black, in Latin script. Small kana in furigana would be the small-text case, but no study tested Japanese.

### Dark mode

Low vision is the known exception to the polarity advantage. Legge and colleagues found cloudy ocular media one of two factors explaining reading rates ([1985](https://pubmed.ncbi.nlm.nih.gov/4013092/)). Rubin and Legge (1989) found five of 19 low vision observers read white on black faster, four of them with cloudy media, which they attribute to light scatter ([Vision Research 29(1)](https://pubmed.ncbi.nlm.nih.gov/2788957/)).

A 2025 study of 30 tablet users found "No statistically significant difference in visual fatigue" between light and dark mode ([IJERPH 22(4)](https://pubmed.ncbi.nlm.nih.gov/40283833/)). Nielsen Norman Group's review of the research does not recommend dark mode as a default but says applications for long-form reading should let users switch to it ([NN/g, 2020](https://www.nngroup.com/articles/dark-mode/), secondary).

### Halation and astigmatism

The claim that light text on dark blurs for people with astigmatism appears in vendor blogs (for example [Level Access](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/)) without a study. This search found no primary study that tests it. The pupil finding above (larger pupils with dark displays) is a plausible mechanism, not evidence about astigmatism.

### Sepia, cream and tinted backgrounds

Rello and Bigham (2017) tested 341 participants (89 with dyslexia) reading black text on 10 background colors, measuring reading time and mouse distance. "Warm background colors, Peach, Orange and Yellow, significantly improved reading performance over cool background colors, Blue, Blue Grey and Green", with a comparable effect in both groups ([ASSETS 2017](https://doi.org/10.1145/3132525.3132546), [PDF](https://www.changedyslexia.org/publications/pdfs/2017-ASSETS-Good%20Background%20Colors.pdf)). **The study did not include a white or off-white background**, and the authors list that comparison as future work. Participants were Spanish speakers reading Spanish online.

No study found tests the sepia themes of reading apps directly. An inference, not a finding: by Buchner and colleagues' luminance result, a darker sepia or gray background lowers display luminance, which is the factor their studies tie to performance.

### Dyslexia guidance

The British Dyslexia Association's 2023 style guide advises "dark (not black) text on a light (not white) background", to "avoid using contrast colours", and suggests "less contrasted colours, such as cream-black" (quoted by [Dyslexia Scotland](https://dyslexiascotland.org.uk/contrasting-advice-what-colours-are-best-for-accessibility/); the [BDA PDF](https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf) refused automated download, so the wording is secondhand). Rello and Bigham cite the BDA as recommending cream. Dyslexia Scotland itself recommends "dark blue text on cream, pastel or off-white backgrounds" and notes this conflicts with high contrast guidance.

### Colored overlays and Irlen

A systematic review of 51 items found that studies at lower risk of bias give less support, and concluded that colored lenses or overlays "cannot be endorsed" and that reported benefits "are likely to be the result of placebo, practice or Hawthorne effects" ([Griffiths et al. 2016](https://pubmed.ncbi.nlm.nih.gov/27580753/)). An overview of four systematic reviews found three concluding the evidence is insufficient ([Suttle et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29633383/)). A Cochrane review of low vision aids found "no good evidence to support the use of filters" ([Virgili et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29664159/)). Edge still ships Irlen-inspired themes.

### Very high contrast

The polarity studies above used pure black on pure white and found it best for proofreading. The advice against pure black on white comes from dyslexia organizations and from web sources that Rello and Bigham cite (Perron, Bradford), not from controlled studies this search found. WCAG sets no maximum contrast. APCA sets a maximum only for large text (below).

## Contrast standards

### WCAG 2.x

SC 1.4.3 (AA) requires 4.5:1 for text, 3:1 for large text, and SC 1.4.6 (AAA) requires 7:1. The ratios are thresholds and must not be rounded: "4.499:1 would not meet the 4.5:1 threshold" ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

User-chosen pairs do not have to meet the ratio. Understanding 1.4.3 says "Some people with cognitive disabilities require color combinations or hues that have low contrast", and allows and encourages "mechanisms to adjust the foreground and background colors", "provided there is a mechanism that will return to the required values". Technique G174 covers a control that switches to a sufficient contrast presentation.

SC 1.4.8 Visual Presentation (AAA) requires that "Foreground and background colors can be selected by the user" ([Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)). The mechanism "can be provided by the browser or other user agent". Setting a foreground color without a background color, or the reverse, is failure F24.

SC 1.4.11 Non-text Contrast (AA) requires 3:1 against adjacent colors for graphical objects needed to understand the content ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). This would cover the underlines that carry meaning in the reader.

### APCA

The APCA Readability Criterion, Bronze simple mode, sets body text at "Minimum Contrast: Lc 75" and "Preferred Contrast: Lc 90". Other content text needs Lc 60. Large text over 36px has a maximum of "Lc 90 (Large Only)" ([ARC Bronze](https://readtech.org/ARC/tests/bronze-simple-mode/?tn=criterion)). The resource calls itself beta and draft, and APCA is not part of a published WCAG version.

## Marks over the text across themes

The reader draws four marks: a light blue fill on unknown words, a dashed gray underline on unrecognized pieces, a double amber underline on grammar patterns, and optional colored underlines by JLPT level. None of these has a color token in `apps/desktop/src/index.css` yet. What the sources show about such marks:

- Chrome reading mode defines its read aloud highlight per theme, all at alpha 46 of 255 (about 18%), with a different tint per theme: dark navy on Light, Yellow and Blue, near white on Dark, yellow on High contrast, brown and gray on the two Low contrast themes. Line focus colors are also per theme ([chrome_color_mixer.cc](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/color/chrome_color_mixer.cc)).
- Firefox uses a 30% blue selection (`rgba(0, 97, 224, 0.3)`) in light themes and a 30% cyan (`rgba(0, 221, 255, 0.3)`) in Dark and Contrast. The Custom tab exposes the selection highlight as a fifth color ([aboutReader.css](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/themes/shared/aboutReader.css)).
- Thorium sets a selection color per theme, for example `rgb(155, 179, 240)` for Sepia and Paper and `rgb(100, 122, 177)` for Night and the dark Contrast themes, and draws highlights behind the text ([computeReadiumCssJsonMessage.ts](https://github.com/edrlab/thorium-reader/blob/develop/src/common/computeReadiumCssJsonMessage.ts)).
- Foliate draws highlights in the active variant's link color, so every theme and mode has its own ([themes.js](https://github.com/johnfactotum/foliate/blob/gtk4/src/themes.js)).
- Readwise Reader's themes change "the background, text, and highlight colors" ([Readwise docs](https://docs.readwise.io/reader/docs/faqs/appearance)).
- Apple Books and Kindle do not document how highlight colors change in dark mode.

Two standards apply to the marks. Text inside the blue fill still needs its contrast against the fill (1.4.3), and the underlines need 3:1 against the background they sit on (1.4.11). Buchner and Baumgartner's finding that color contrast "could not compensate for a lack of luminance contrast" was about text. An inference, not a finding: JLPT colors that differ only in hue, at similar luminance, may be hard to tell apart.

## Open points

- Apple Books, Kindle, Kobo, Google Play Books, Safari Reader, Edge and Readwise publish no hex values. Measuring them would need screenshots, which are not primary sources.
- No study compares sepia or gray reading themes with white directly, and none tests polarity or tinted backgrounds with Japanese text.
- The BDA wording is secondhand because the PDF refused automated download.
