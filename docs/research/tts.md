# Text to speech for Japanese

Research for issue #38: which text to speech (TTS) options can Michigo use for Japanese words and sentences, locally and in the cloud, and which of them produce a file that can go on an Anki card. Sources were checked on 2026-11-11. Prices and voice lists change, so recheck before committing to one.

## Summary

Every option below speaks Japanese. They split on two questions: can the audio be saved to a file, and may that file be kept and shared.

| Option | Where | Japanese voices | File output | Terms for stored audio |
| --- | --- | --- | --- | --- |
| Web Speech API in the renderer | All, via OS | Whatever the OS has | No | Inherits the OS voice terms |
| macOS `say` / `AVSpeechSynthesizer` | macOS | Kyoko plus several others | Yes (AIFF, WAVE, CAF, M4A) | Personal, non-commercial only; no public sharing |
| Windows SAPI / System.Speech | Windows | Haruka, Ayumi, Ichiro | Yes (WAV) | Not verified |
| speech-dispatcher | Linux | Depends on installed modules | Via the module, not via Chromium | Depends on the module |
| VOICEVOX engine | All (local HTTP server) | Many character voices | Yes (WAV) | Commercial use allowed; credit required; per-character terms |
| Open JTalk | All (native build) | HTS voices | Yes (WAV) | Modified BSD (engine) |
| Piper `ja_JP-hi_fi_captain` | All (ONNX) | 2 speakers | Yes | Dataset is CC BY-NC-SA 4.0 |
| Kokoro-82M | All (ONNX) | 5 voices, graded C- to C+ | Yes | Apache 2.0 weights |
| Google Cloud TTS | Cloud | Standard, WaveNet, Neural2, Chirp 3 HD | Yes | Output is customer data; no TTS-specific limit found |
| Azure AI Speech | Cloud | 7 neural, HD and multilingual | Yes | Responsible AI use rules; no storage limit found |
| Amazon Polly | Cloud | Mizuki, Takumi, Kazuha, Tomoko | Yes | Caching and replay explicitly allowed |
| OpenAI TTS | Cloud | 13 general voices, Japanese supported | Yes | Must disclose the voice is AI-generated |
| ElevenLabs | Cloud | Multilingual models | Yes | Free plan is non-commercial only |

## What Electron exposes

Electron has no TTS API of its own. The Electron API docs do not mention speech synthesis. What is available is Chromium's Web Speech API (`window.speechSynthesis`) in the renderer.

### Web Speech API cannot produce a file

`SpeechSynthesis` exposes `speak()`, `cancel()`, `pause()`, `resume()` and `getVoices()`. `speak()` plays on the device and returns nothing that holds audio. There is no buffer, blob or stream ([MDN SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)). **So the Web Speech API is fine for "play this word now" but cannot produce Anki audio.**

### Which OS engine Chromium uses

Chromium's platform backends are in `content/browser/speech/`:

- macOS uses `AVSpeechSynthesizer` ([tts_mac.mm](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/tts_mac.mm)).
- Windows uses SAPI `ISpVoice` and searches both the OneCore and the older SAPI voice registry keys ([tts_win.cc](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/tts_win.cc)).
- Linux loads `libspeechd.so.2` (speech-dispatcher), but only if the process was started with `--enable-speech-dispatcher`. Without that switch the platform reports itself unsupported ([tts_linux.cc](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/tts_linux.cc)).

On Linux, Michigo would have to append that switch in main (`app.commandLine.appendSwitch`) and the user would need speech-dispatcher plus a module that has a Japanese voice. Whether the switch works the same under Electron 44 was not tested.

## Local options per platform

### macOS

macOS ships Japanese system voices. On macOS 26.7, `say -v '?'` lists Kyoko plus Eddy, Flo, Grandma, Grandpa, Reed, Rocko, Sandy and Shelley for `ja_JP`. More voices can be downloaded in System Settings.

Two ways to get a file from main or the CLI:

- `say -o out.aiff` writes a file. `--file-format` takes AIFF, caff, m4af or WAVE, and `--data-format` takes linear PCM, AAC or ALAC (`man say` on macOS 26.7).
- `AVSpeechSynthesizer.write(_:toBufferCallback:)` "generates speech for the utterance and invokes the callback with the audio buffer", available since macOS 10.15 ([Apple docs](https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer/write(_:tobuffercallback:))). It needs native code (Swift helper or a Node addon); `say` needs only `child_process`.

The license is the constraint. The macOS Software License Agreement, section F, allows System Voices only "while running the Apple Software" and "to create your own original content and projects for your personal, non-commercial use". It then forbids "recording, publishing or redistribution of any of the System Voices ... in a profit, non-profit, public sharing or commercial context" (text from `OSXSoftwareLicense.rtf` shipped in macOS 26.7; the same agreement is published as [macOSTahoe.pdf](https://www.apple.com/legal/sla/docs/macOSTahoe.pdf)). **A learner's private Anki deck looks covered; a shared deck on AnkiWeb does not.**

### Windows

Windows lists Japanese standard voices Ichiro (male), Ayumi and Haruka (female), and natural voices Keita (male) and Nanami (female) ([Windows supported languages and voices](https://support.microsoft.com/en-us/windows/appendix-a-supported-languages-and-voices-4486e345-7730-53da-fcfe-55cc64300f01)). Natural voices are documented for Narrator; whether SAPI or Chromium can reach them was not verified.

`System.Speech.Synthesis.SpeechSynthesizer.SetOutputToWaveFile` writes WAV, with an optional sample rate and bit depth ([Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.setoutputtowavefile)). From Electron that means spawning PowerShell or a small helper, or a native addon. Windows license terms for stored voice output were not checked.

### Linux

There is no built-in Japanese voice. Chromium's path goes through speech-dispatcher (see above), and a file only comes from calling the underlying engine directly. Realistic engines are the cross-platform ones below.

### Cross-platform local engines

These run on all three platforms and all produce a file. They differ mostly in license and in how they would ship.

#### VOICEVOX

VOICEVOX is a Japanese TTS with many character voices. The engine is a local HTTP server on `127.0.0.1:50021`: `POST /audio_query` then `POST /synthesis` returns WAV ([voicevox_engine README](https://github.com/VOICEVOX/voicevox_engine)). `voicevox_core` is MIT licensed; the engine repo has no SPDX license GitHub can detect.

The software terms allow commercial and non-commercial use, require a credit showing VOICEVOX was used, and require following each voice library's own terms ([VOICEVOX terms](https://voicevox.hiroshiba.jp/term/)). Anyone the audio is passed on to must be held to the same terms, which matters for shared decks. The exact credit format per character was not checked.

#### Open JTalk

Open JTalk is the classic HMM Japanese TTS, released under the Modified BSD license, last release 1.11 in December 2018 ([Open JTalk](https://open-jtalk.sourceforge.net/)). It needs a dictionary and an HTS voice file, which have their own licenses (not checked). It is also the front end most neural Japanese TTS projects use for reading kanji.

#### Piper

Piper now has one Japanese voice, `ja_JP-hi_fi_captain-medium`: 2 speakers, 22,050 Hz, needs Piper 1.7.0 or later. Its dataset is licensed CC BY-NC-SA 4.0 ([model card](https://huggingface.co/rhasspy/piper-voices/blob/main/ja/ja_JP/hi_fi_captain/medium/MODEL_CARD)), so audio made with it is best treated as non-commercial.

#### Kokoro-82M

Kokoro has Apache 2.0 weights and five Japanese voices (`jf_alpha`, `jf_gongitsune`, `jf_nezumi`, `jf_tebukuro`, `jm_kumo`). The project grades them C- to C+, trained on 1 to 10 hours of Japanese, and lists them under CC BY with source text from the koniwa project ([VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)). Japanese uses `misaki[ja]`, a Python G2P.

For Node, `sherpa-onnx-node` (Apache 2.0, version 2.0.1, prebuilt for macOS, Windows and Linux on x64 and arm64) runs Kokoro, but its docs list only English and Chinese text support for the multi-language models ([sherpa-onnx Kokoro](https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/kokoro.html)). Japanese Kokoro from Node is therefore not a documented path.

## Cloud services

All cloud services return audio bytes, so all can produce a file.

### Google Cloud Text-to-Speech

ja-JP has 4 Standard, 4 WaveNet, 3 Neural2 and 30 Chirp 3 HD voices ([voice list](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)). Gemini TTS models are also offered, priced per token.

| Voice type | Free per month | Price per 1M characters |
| --- | --- | --- |
| Standard | 4M characters | $4 |
| WaveNet | 4M characters | $4 |
| Neural2 | 1M characters | $16 |
| Chirp 3 HD | 1M characters | $30 |
| Studio | 1M characters | $160 |

Billing is per character, not per byte, so a Japanese character counts once ([pricing](https://cloud.google.com/text-to-speech/pricing)). The Service Specific Terms have no Text-to-Speech section. For generative AI services they say "Generated Output is Customer Data" and Google asserts no ownership of it ([service terms](https://cloud.google.com/terms/service-terms)). Whether classic TTS voices count as a generative AI service under those terms is not stated.

### Azure AI Speech

ja-JP has seven neural voices (Nanami, Keita, Aoi, Daichi, Mayu, Naoki, Shiori), two HD voices (Nanami and Masaru `DragonHDLatestNeural`), one multilingual voice (Masaru) and two `MAI-Voice-2-Flash` voices ([language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)).

Prices from the Azure Retail Prices API (East US): neural $15 per 1M characters, Neural HD $22 per 1M ([prices.azure.com](https://prices.azure.com/api/retail/prices)). The free F0 tier gives 0.5M neural characters a month ([pricing page](https://azure.microsoft.com/en-us/pricing/details/speech/)). Microsoft's responsible AI guidance lists educational media as an appropriate use and forbids deception, impersonation and "unattributed content" ([responsible AI](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/disclosure-voice-talent)). No limit on storing output was found.

### Amazon Polly

ja-JP voices: Mizuki (standard), Takumi (standard and neural), Kazuha and Tomoko (neural). None is generative or long-form ([available voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)). Standard is $4 and neural $16 per 1M characters, with a free tier for the first 12 months ([pricing](https://aws.amazon.com/polly/pricing/)).

Polly has the clearest storage terms: "You can cache and replay Amazon Polly's generated speech at no additional cost", and "your Polly output belongs to you" ([FAQ](https://aws.amazon.com/polly/faqs/)).

### OpenAI TTS

`gpt-4o-mini-tts`, `tts-1` and `tts-1-hd` support Japanese and output MP3, Opus, AAC, FLAC, WAV or PCM. The voices are tuned for English. All three models are deprecated and shut down on January 6, 2027. The usage policies require "a clear disclosure to end users that the TTS voice they are hearing is AI-generated" ([TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech)). The pricing page returned 403, so prices are not recorded here.

### ElevenLabs

API prices are $0.04 per 1K characters for Flash/Turbo and $0.08 per 1K for Multilingual v2 and v3 ([API pricing](https://elevenlabs.io/pricing/api)). Free users "may only use the Services for non-commercial purposes", and the user retains rights in the output ([terms](https://elevenlabs.io/terms-of-use)). Japanese quality was not evaluated.

## API key handling

Any cloud call must run in the main process (or the CLI), never in the renderer. The renderer is a locked-down tab, and a key there is readable by any script in it. The key reaches main through an IPC channel that parses it with a zod schema, per `CLAUDE.md`.

Electron's `safeStorage` (main process only) encrypts strings with Keychain on macOS and DPAPI on Windows. On Linux it uses kwallet or libsecret, and when no secret store is available it falls back to a fixed password, so stored items are "unprotected". `safeStorage.getSelectedStorageBackend()` returns `basic_text` in that case ([safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)). Michigo should check that and warn.

## Getting audio onto Anki cards

Anki references audio as `[sound:file.mp3]`, and the file must sit in `collection.media` with no subfolders ([Anki manual](https://docs.ankiweb.net/importing/text-files.html)). Every option except the renderer's Web Speech API can produce such a file. The macOS system voices produce one but may not be shared publicly.

## Not verified

- Japanese voice quality was not listened to for any option; only vendor grades and voice counts are reported.
- Whether Windows natural voices (Nanami, Keita) are reachable through SAPI or Chromium, and Windows license terms for recorded voice output.
- Whether `--enable-speech-dispatcher` works in Electron 44 as it does in Chromium.
- Auth methods per cloud vendor (Polly needs AWS SigV4 credentials; the others take a key or token) were not checked against each vendor's docs in this pass.
- OpenAI TTS prices; VOICEVOX per-character credit formats; Open JTalk dictionary and voice licenses.

## Recommendation

This section is a recommendation, not a finding. The evidence does not leave a single option.

For instant playback, the Web Speech API costs nothing to add and needs no IPC. For Anki files, the choice is between a cloud service with clear storage terms (Polly states them most plainly; Google and Azure have more and newer Japanese voices) and a bundled local engine (VOICEVOX has the broadest Japanese voice set and permits commercial use with credit). macOS `say` is a cheap first step for private decks only, because of the license.
