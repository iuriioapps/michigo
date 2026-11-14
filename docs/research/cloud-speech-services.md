# What the four cloud speech services need from Michigo

Research for [What do the four cloud speech services need from Michigo?](https://github.com/iuriioapps/michigo/issues/77). It serves [How does TTS work in the reader and on cards?](https://github.com/iuriioapps/michigo/issues/50) and follows [Which TTS options speak Japanese, local and cloud?](https://github.com/iuriioapps/michigo/issues/38).

All pages were read on 2026-11-13. Every claim links to the page that owns it. This document reports evidence and options. It chooses nothing.

## How the facts were gathered

- Vendor pages were downloaded and read as text. Quotes are verbatim.
- Three live probes were made without any account: the Google voices endpoint with an invalid key, the ElevenLabs voices endpoint with no key, and the Azure Retail Prices API.
- npm metadata comes from `npm view <package>` on the same day.
- No audio was generated. No account was used. All file sizes are computed from documented bitrates, not measured.

## Comparison

| Point | AWS Polly | Azure AI Speech | Google Cloud Text-to-Speech | ElevenLabs |
| --- | --- | --- | --- | --- |
| What the learner enters | Access key ID, secret access key, region | Resource key, region (or resource endpoint) | API key, or a service account JSON file | API key |
| Request form | Signed request (AWS Signature Version 4) | Plain HTTPS, key in a header | Plain HTTPS with an API key. A service account needs a signed JWT first | Plain HTTPS, key in a header |
| SDK needed | No, if Michigo signs requests itself | No | No | No |
| List voices | `GET /v1/voices` | `GET /tts/cognitiveservices/voices/list` | `GET /v1/voices` | `GET /v2/voices`, `GET /v1/shared-voices` |
| Language filter on the list | Yes, `LanguageCode=ja-JP` | None documented, filter on `Locale` in the client | Yes, `languageCode=ja-JP` | Yes, `language`, but it matches a label, see the ElevenLabs section |
| Gender in the list | Yes, `Gender` | Yes, `Gender` | Yes, `ssmlGender` | Yes, `labels.gender` |
| ja-JP voices | 4: 2 standard, 3 neural (Takumi is in both) | 12: 7 neural, 2 Neural HD, 1 multilingual, 2 Neural HD Flash | 41: 4 Standard, 4 WaveNet, 3 Neural2, 30 Chirp 3 HD | No Japanese voice set. 3 of 21 default voices are verified for Japanese |
| Speech endpoint | `POST /v1/speech` | `POST /cognitiveservices/v1` | `POST /v1/text:synthesize` | `POST /v1/text-to-speech/{voice_id}` |
| Input limit per request | 3,000 billed characters, 6,000 total | 10 minutes of audio. No character limit is stated for the REST API | 5,000 bytes (about 1,666 Japanese characters in UTF-8) | 5,000 to 40,000 characters by model |
| Reading control for Japanese | `phoneme` with `x-amazon-yomigana` or `x-amazon-pron-kana`, `sub` | `phoneme` with the `sapi` kana set, `sub` | `phoneme` with `yomigana`, `sub` | None for Japanese. `phoneme` works on one English model only |
| Default output | None, `OutputFormat` is required. MP3 at 24 kHz for neural, about 48 kbps | None, the format header is required | None, `audioEncoding` is required. MP3 is 32 kbps | `mp3_44100_128` (MP3, 44.1 kHz, 128 kbps) |
| Price per 1M characters | Standard $4, neural $16 | Neural $15, Neural HD $22. A kanji counts as two characters | Standard $4, WaveNet $4, Neural2 $16, Chirp 3 HD $30 | Flash and Turbo $40, Multilingual v2, v3 and v4 $80 |
| Free allowance | Standard 5M per month. Neural 1M per month for 12 months | 0.5M per month (F0 tier) | Standard and WaveNet 4M per month. Neural2 and Chirp 3 HD 1M per month | 10,000 credits per month |
| Store and keep the audio | Yes, stated | No statement that limits it. No statement that grants it | No statement in the Text-to-Speech terms | Yes, but the learner must export it |
| Share in a deck | Output is the customer's content. No sentence names distribution | Allowed with a duty to disclose that the voice is synthetic | No statement. One limit: not for building a competing model | Paid: yes. Free: non-commercial only, with attribution |
| 4 second sentence | 24 kB | 24 kB at 48 kbps MP3, up to 192 kB as WAV | 16 kB | 64 kB |
| 1 second word | 6 kB | 6 kB at 48 kbps MP3, up to 48 kB as WAV | 4 kB | 16 kB |

## File sizes and the cache figure

The decision in [How does TTS work in the reader and on cards?](https://github.com/iuriioapps/michigo/issues/50) assumes 50 KB per sentence, so 500 MB holds about 10,000 sentences. Nobody measured that figure. This section computes it.

### Arithmetic

A constant bitrate file has `bitrate / 8` bytes per second. Container headers are ignored. They add under 1 kB to an MP3. Here 1 kB is 1,000 bytes and 500 MB is 500,000 kB.

| Service and format | Bytes per second | Sentence, 4 s | Word, 1 s | Sentences in 500 MB |
| --- | --- | --- | --- | --- |
| Polly, MP3 at about 48 kbps | 48,000 / 8 = 6,000 | 24 kB | 6 kB | 500,000 / 24 = 20,833 |
| Azure, `audio-24khz-48kbitrate-mono-mp3` | 6,000 | 24 kB | 6 kB | 20,833 |
| Azure, `audio-24khz-96kbitrate-mono-mp3` | 96,000 / 8 = 12,000 | 48 kB | 12 kB | 10,416 |
| Azure, `audio-24khz-160kbitrate-mono-mp3` | 160,000 / 8 = 20,000 | 80 kB | 20 kB | 6,250 |
| Azure, `riff-24khz-16bit-mono-pcm` (WAV) | 24,000 x 2 = 48,000 | 192 kB | 48 kB | 2,604 |
| Google, `MP3` at 32 kbps | 32,000 / 8 = 4,000 | 16 kB | 4 kB | 31,250 |
| ElevenLabs, `mp3_44100_128` | 128,000 / 8 = 16,000 | 64 kB | 16 kB | 7,812 |

### Whether 10,000 sentences in 500 MB holds

It holds for Polly, for Google, and for Azure at 48 or 96 kbps MP3. **It does not hold for the ElevenLabs default format, which gives about 7,800 sentences.** It also fails for Azure at 160 kbps or as WAV.

ElevenLabs offers `mp3_44100_64` and `mp3_22050_32` on the same endpoint. At 64 kbps a sentence is 32 kB, and 500 MB holds 15,625 sentences.

The 4 second length is the assumption of the ticket. A longer sentence scales every row by the same factor.

### Polly states no bitrate

No Polly page states the MP3 bitrate in kbps. The value of about 48 kbps is derived from a table on the [Polly features page](https://aws.amazon.com/polly/features/) that gives the size of one sample in each format:

| Sampling rate | MP3 size | OGG size | PCM size  |
| ------------- | -------- | -------- | --------- |
| 24.00 kHz     | 19.31 kB | 18.11 kB | N/A       |
| 22.05 kHz     | 19.33 kB | 17.62 kB | N/A       |
| 16.05 kHz     | 16.22 kB | 15.48 kB | 100.68 kB |
| 8.00 kHz      | 13.26 kB | 9.72 kB  | 50.34 kB  |

PCM is 16 bit mono, so 16 kHz is 32,000 bytes per second. The sample is 100,680 / 32,000 = 3.146 seconds long. The 8 kHz row agrees: 50,340 / 16,000 = 3.146 seconds. The 24 kHz MP3 is then 19,310 x 8 / 3.146 = 49,100 bits per second. That is a 48 kbps stream plus a header. This is a derivation from a marketing page, not a documented value.

## AWS Polly

### Authentication

The learner enters an access key ID, a secret access key and a region. Polly has one endpoint per region, in the form `https://polly.<region>.amazonaws.com` ([endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/pol.html)). Neural voices exist in 19 of the regions, among them `us-east-1`, `eu-central-1` and `ap-northeast-1` ([neural voices](https://docs.aws.amazon.com/polly/latest/dg/neural-voices.html)).

Every request must carry an AWS Signature Version 4, with the algorithm `AWS4-HMAC-SHA256` ([common parameters](https://docs.aws.amazon.com/polly/latest/APIReference/CommonParameters.html)). A plain `fetch` with a key in a header does not work. No Polly page mentions a plain API key.

The IAM user needs the `polly:DescribeVoices` permission for the list ([DescribeVoices](https://docs.aws.amazon.com/polly/latest/APIReference/API_DescribeVoices.html)) and `polly:SynthesizeSpeech` for speech.

### Options for signing

| Option | Package | Version | License | Unpacked size | Note |
| --- | --- | --- | --- | --- | --- |
| Sign in Michigo with `node:crypto` | none |  |  | 0 | SigV4 is HMAC-SHA256 over a canonical request |
| Official signer only | `@smithy/signature-v4` | 5.7.5 | Apache-2.0 | 107 kB | Depends on `@smithy/core`, `@smithy/types`, `tslib` |
| Third-party signer | `aws4fetch` | 1.0.20 | MIT | 66 kB | No dependencies. Not an AWS package |
| Official SDK client | `@aws-sdk/client-polly` | 3.1169.0 | Apache-2.0 | 434 kB | Has 10 direct dependencies. The size of the full tree was not measured |

### Voice list

`GET /v1/voices?LanguageCode=ja-JP&Engine=neural`. Both parameters are optional filters. Each voice has `Id`, `Name`, `Gender`, `LanguageCode`, `LanguageName`, `AdditionalLanguageCodes` and `SupportedEngines`. The list is paged with `NextToken` ([DescribeVoices](https://docs.aws.amazon.com/polly/latest/APIReference/API_DescribeVoices.html)).

### Japanese voices today

| Voice  | Gender | Standard | Neural | Long-form | Generative |
| ------ | ------ | -------- | ------ | --------- | ---------- |
| Mizuki | Female | Yes      | No     | No        | No         |
| Takumi | Male   | Yes      | Yes    | No        | No         |
| Kazuha | Female | No       | Yes    | No        | No         |
| Tomoko | Female | No       | Yes    | No        | No         |

That is 2 standard and 3 neural voices, 4 distinct. Japanese has no generative and no long-form voice ([available voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)).

### Speech request

`POST /v1/speech` with a JSON body. `OutputFormat`, `Text` and `VoiceId` are required. `Engine` defaults to `standard`, so a neural voice needs `Engine: "neural"`. The body of the response is the audio itself ([SynthesizeSpeech](https://docs.aws.amazon.com/polly/latest/APIReference/API_SynthesizeSpeech.html)).

- Formats: `mp3`, `ogg_opus`, `ogg_vorbis`, `pcm`, `mulaw`, `alaw`, and `json` for speech marks.
- Sample rate for MP3: 8000, 16000, 22050, 24000, 44100 or 48000. "The default value for standard voices is "22050". The default value for neural voices is "24000"."
- Limits: "The size of the input text can be up to 3000 billed characters (6000 total characters). SSML tags are not counted as billed characters." The audio stream is limited to 10 minutes ([quotas](https://docs.aws.amazon.com/polly/latest/dg/limits.html)).
- Rate: 8 requests per second for neural voices, 80 for standard voices.

### Readings in SSML

Polly has two Japanese alphabets for `phoneme`. "Japanese uses Yomigana and Pronunciation Kana." ([phoneme tag](https://docs.aws.amazon.com/polly/latest/dg/phoneme-tag.html))

```xml
<speak>
  名前は<phoneme alphabet="x-amazon-yomigana" ph="ひろかず">浩一</phoneme>です。
  名前は<phoneme alphabet="x-amazon-pron-kana" ph="ヒロ'カズ">浩一</phoneme>です。
</speak>
```

The pronunciation kana form carries an accent mark. `phoneme` and `sub` have "Full availability" for neural voices ([supported tags](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html)).

### Price

From the [pricing page](https://aws.amazon.com/polly/pricing/): standard voices are "$4.00 per 1 million characters", neural voices "$16.00 per 1 million characters". The free tier is 5 million characters per month for standard voices, and 1 million characters per month for neural voices "for the first 12 months". New accounts since July 15, 2025 get credits instead, on a free plan that lasts 6 months.

### Terms for the audio

The [FAQ](https://aws.amazon.com/polly/faqs/) says:

- "You can cache and replay Amazon Polly's generated speech at no additional cost."
- "with no restrictions on storing and reusing generated speech."
- "As between you and AWS, your Polly output belongs to you."

The [AWS Service Terms](https://aws.amazon.com/service-terms/) (last updated November 5, 2026) list Amazon Polly as an AI Service. Section 50.2 says: "The output that you generate using AI Services is Your Content."

No AWS page has a sentence that names distribution or sharing of Polly output. No page ties the right to keep the audio to an active account. Free and paid use have the same terms.

Section 50.3 lets AWS "use and store AI Content that is processed by" Polly "to develop and improve the applicable AI Service". That concerns the text the learner sends, not the audio file.

## Azure AI Speech

### Authentication

The learner enters the resource key and the region of the Speech resource. Requests are plain HTTPS. The key goes in the `Ocp-Apim-Subscription-Key` header. A bearer token is the alternative: a `POST` to `issueToken` trades the key for a token that is "valid for 10 minutes" ([REST reference](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech)).

The page says to use the REST API "only in cases where you can't use the Speech SDK". The SDK is not required. For reference, `microsoft-cognitiveservices-speech-sdk` 1.53.0 is MIT and 5.6 MB unpacked.

The page is not consistent on one point. Its authentication table says the key header works for text to speech. Its header table for synthesis lists only `Authorization` as required. Which one a synthesis request accepts was not tested.

### Voice list

`GET https://<resource>.cognitiveservices.azure.com/tts/cognitiveservices/voices/list`. The page documents no query parameter, so there is no language filter. The response is one array with every voice, and Michigo filters on `Locale`. Each voice has `ShortName`, `DisplayName`, `LocalName`, `Gender`, `Locale`, `VoiceType`, `Status` (such as `GA`), `SampleRateHertz` and `WordsPerMinute`.

A multilingual voice of another locale lists `ja-JP` in `SecondaryLocaleList`. A filter on `Locale` alone leaves those out.

The page shows the list URL only in the resource endpoint form. The synthesis endpoints are shown per region.

### Japanese voices today

From the [language support table](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts):

| Tier | Count | Voices |
| --- | --- | --- |
| Standard (neural) | 7 | Nanami (F), Keita (M), Aoi (F), Daichi (M), Mayu (F), Naoki (M), Shiori (F) |
| Neural HD | 2 | `ja-JP-Nanami:DragonHDLatestNeural` (F), `ja-JP-Masaru:DragonHDLatestNeural` (M) |
| Multilingual | 1 | `ja-JP-MasaruMultilingualNeural` (M), public preview |
| Neural HD Flash | 2 | `ja-JP-Haruto:MAI-Voice-2-Flash` (M), `ja-JP-Sakura:MAI-Voice-2-Flash` (F), public preview |

Microsoft calls its neural voices "Standard". Preview voices and Neural HD voices exist only in some regions.

### Speech request

`POST https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`. The body is always SSML, with the content type `application/ssml+xml`. The voice is named inside the SSML. The headers `X-Microsoft-OutputFormat` and `User-Agent` are required, so there is no default format.

- MP3 formats: `audio-16khz-32kbitrate-mono-mp3`, `audio-16khz-64kbitrate-mono-mp3`, `audio-16khz-128kbitrate-mono-mp3`, `audio-24khz-48kbitrate-mono-mp3`, `audio-24khz-96kbitrate-mono-mp3`, `audio-24khz-160kbitrate-mono-mp3`, `audio-48khz-96kbitrate-mono-mp3`, `audio-48khz-192kbitrate-mono-mp3`.
- Other formats: Opus in Ogg and WebM, raw PCM, and WAV as `riff-*`. The sample request on the page uses `riff-24khz-16bit-mono-pcm`.
- Limit: "the audio length can't exceed 10 minutes". The REST page states no character limit.
- Rate: 20 requests per 60 seconds on the free tier, 30 per second on the standard tier ([quotas](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits)).

### Readings in SSML

`phoneme` takes the alphabets `ipa`, `sapi`, `ups` and `x-sampa`. For Japanese the `sapi` set is kana: "The Speech service phone set for ja-JP is based on the native phone Kana set." ([phonetic sets](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets))

`sub` replaces the spoken text: `<sub alias="…">…</sub>` ([pronunciation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation)). The ja-JP voices carry no footnote that excludes phonemes. Whether the Neural HD and the MAI voices honor `phoneme` is not stated.

### Price

The [pricing page](https://azure.microsoft.com/en-us/pricing/details/speech/) fills in its prices with a script, so they were read from the [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) for East US:

| Meter                               | Price per 1M characters |
| ----------------------------------- | ----------------------- |
| S1 Neural Text To Speech Characters | $15                     |
| Neural HD Text to Speech Characters | $22                     |

The API has no meter with "Flash" or "MAI" in its name. The price of the two Neural HD Flash voices was not found.

The free F0 tier gives "0.5 million characters free per month" for neural voices.

Japanese text costs more than its length suggests: "Each Chinese character is counted as two characters for billing, including kanji used in Japanese" ([billable characters](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech)). SSML tags other than the `speak` and `voice` wrapper are billed too.

### Terms for the audio

Microsoft does not keep the audio: "Microsoft doesn't store audio or video content generated with the real-time synthesis API." ([data, privacy and security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/data-privacy-security))

The [code of conduct](https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/tts-code-of-conduct) binds every customer. It requires customers to "Disclose when the output, decisions, or actions are generated by AI, including the synthetic nature of generated voices". It also says: "All content released through a customer's use, or integration, of any Microsoft AI Service must be originally created by the publisher, appropriately licensed from the third-party rights holder, used as permitted by the rights holder, or used as otherwise permitted by law."

No page that was read limits storing the audio, keeping it after the subscription ends, or sharing it. No page that was read grants those rights in words either. The Microsoft Product Terms are the contract. Their page was too large to fetch, so they were not read. The free and the standard tier share the same code of conduct.

## Google Cloud Text-to-Speech

### Authentication

Two forms work.

An API key is the simple one. It goes in the `x-goog-api-key` header or the `key` query parameter ([API keys](https://cloud.google.com/docs/authentication/api-keys-use)). That page warns that "Not all Google Cloud APIs accept API keys", and the Text-to-Speech authentication page names only Application Default Credentials. A probe settled it: the voices endpoint answered an invalid key with `API_KEY_INVALID`, so the service evaluates API keys.

A service account JSON file is the other. Michigo would sign a JWT with the private key in the file (RS256, possible with `node:crypto`) and trade it for an access token. `google-auth-library` 11.3.4 does this, is Apache-2.0 and 785 kB unpacked. The full client `@google-cloud/text-to-speech` 7.2.0 is Apache-2.0 and 1.9 MB unpacked, plus `google-gax`.

The project must have billing enabled, also for the free allowance ([pricing](https://cloud.google.com/text-to-speech/pricing)).

### Voice list

`GET https://texttospeech.googleapis.com/v1/voices?languageCode=ja-JP`. The filter is "Optional. Recommended." Each voice has `name`, `languageCodes`, `ssmlGender` and `naturalSampleRateHertz` ([voices.list](https://cloud.google.com/text-to-speech/docs/reference/rest/v1/voices/list)). The tier is not a field. It is part of the name, as in `ja-JP-Neural2-B`.

### Japanese voices today

From the [voice table](https://cloud.google.com/text-to-speech/docs/list-voices-and-types):

| Tier       | Count | Names                                                                |
| ---------- | ----- | -------------------------------------------------------------------- |
| Standard   | 4     | `ja-JP-Standard-A` to `-D`                                           |
| WaveNet    | 4     | `ja-JP-Wavenet-A` to `-D`                                            |
| Neural2    | 3     | `ja-JP-Neural2-B`, `-C`, `-D`                                        |
| Chirp 3 HD | 30    | `ja-JP-Chirp3-HD-Achernar`, `-Aoede`, `-Charon`, `-Kore` and 26 more |

Japanese has no Studio voice. Gemini-TTS models are a separate family, priced by token. They were not examined.

### Speech request

`POST https://texttospeech.googleapis.com/v1/text:synthesize` with `input`, `voice` and `audioConfig`. The response is JSON, and `audioContent` holds the audio in base64 ([text.synthesize](https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize)).

- `audioConfig.audioEncoding` is required: `LINEAR16`, `MP3`, `OGG_OPUS`, `MULAW` or `ALAW`. The reference says "MP3 audio at 32kbps." ([AudioEncoding](https://cloud.google.com/text-to-speech/docs/reference/rest/v1/AudioEncoding))
- Limit: 5,000 "Total bytes per request", with the note "In some locales (for example ja-JP), a single character is made up of multiple bytes." Kana and kanji take 3 bytes each in UTF-8, so the limit is about 1,666 Japanese characters ([quotas](https://cloud.google.com/text-to-speech/quotas)).
- Rate: 1,000 requests per minute for Neural2 and the default, 200 for Chirp 3.

### Readings in SSML

`phoneme` takes `ipa` or `x-sampa`. "The only exceptions are Japanese, which must be specified as yomigana". `sub` works too, and the page gives a Japanese example ([SSML](https://cloud.google.com/text-to-speech/docs/ssml)):

```xml
<sub alias="にっぽんばし">日本橋</sub>
```

Chirp 3 HD voices accept a short list of tags in synchronous requests, and `phoneme`, `sub` and `say-as` are on it. "Any tags that are not on this list will be ignored" ([Chirp 3 HD](https://cloud.google.com/text-to-speech/docs/chirp3-hd)).

### Price

From the [pricing page](https://cloud.google.com/text-to-speech/pricing):

| Tier       | Free per month       | Price per 1M characters |
| ---------- | -------------------- | ----------------------- |
| Standard   | 4 million characters | $4                      |
| WaveNet    | 4 million characters | $4                      |
| Neural2    | 1 million characters | $16                     |
| Chirp 3 HD | 1 million characters | $30                     |

A Japanese character counts once: "you are only charged for one character, not multiple bytes." SSML tags count as characters, except `mark`.

### Terms for the audio

The [Service Specific Terms](https://cloud.google.com/terms/service-terms) (last modified November 11, 2026) have no section for Text-to-Speech. No sentence in them mentions caching, storing or distributing synthesized speech.

The [services summary](https://cloud.google.com/terms/services) lists Text-to-Speech under "AI/ML Services". One rule for that group applies: "Customer will not, and will not allow End Users to, use output from an AI/ML Service (including Generated Output) to: (i) substitute, replace, or circumvent the use of a Google Model, directly or indirectly, or (ii) create or improve models similar to a Google Model."

The ownership sentence belongs to another group: "Generated Output is Customer Data. As between Customer and Google, Google does not assert any ownership rights in any new intellectual property created in the Generated Output." It covers "Generative AI Services". Text-to-Speech is not in that list, but the list ends with "Generative AI Services also includes any generative AI features or functionality of a Service." Whether a Text-to-Speech voice is such a feature is not stated anywhere.

So for storing, keeping and sharing the audio there is no statement. The free allowance has no terms of its own.

## ElevenLabs

### Authentication

The learner enters one API key. It goes in the `xi-api-key` header, and requests are plain HTTPS ([authentication](https://elevenlabs.io/docs/api-reference/authentication)). The official `@elevenlabs/elevenlabs-js` 2.78.0 is MIT and 29.5 MB unpacked. It is not needed.

### Voice list

ElevenLabs has no Japanese voice set in the sense of the other three. A multilingual model speaks Japanese with any voice. This matters for the voice picker.

`GET https://api.elevenlabs.io/v2/voices` lists the voices of the account, 10 per page by default and at most 100. It filters by `language`, `gender`, `category` and `voice_type`. The language filter is "based on the voice's 'language' label" ([voices search](https://elevenlabs.io/docs/api-reference/voices/search)).

A probe of `GET /v1/voices` without a key returned the 21 default voices. Every one has the label `language: en`, so a filter on `ja` returns none of them. Each voice also has a `verified_languages` array. Three default voices list `ja` there, for `eleven_multilingual_v2`: George (male), Alice (female), Jessica (female).

`GET https://api.elevenlabs.io/v1/shared-voices?language=ja` lists community voices from the Voice Library, with `gender` on each ([shared voices](https://elevenlabs.io/docs/api-reference/voices/voice-library/get-shared)). The probe returned Japanese voices without a key. Their total count was not established. Whether a free account may use a library voice through the API was not checked.

### Models that speak Japanese

From the [models page](https://elevenlabs.io/docs/overview/models). `ja` is in the language list of `eleven_multilingual_v2`, and `eleven_flash_v2_5` supports all of those languages. `eleven_v3` and `eleven_v4` list 70+ and 90+ languages.

| Model                                  | Character limit per request | Price per 1M characters |
| -------------------------------------- | --------------------------- | ----------------------- |
| `eleven_flash_v2_5`                    | 40,000                      | $40                     |
| `eleven_multilingual_v2` (the default) | 10,000                      | $80                     |
| `eleven_v3`                            | 5,000                       | $80                     |
| `eleven_v4`                            | 10,000                      | $80                     |

### Speech request

`POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with `text` and an optional `model_id`. The response body is the audio ([convert](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)).

- `output_format` is a query parameter, "default: mp3_44100_128". Other MP3 values: `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_192`. Opus, PCM and WAV exist too.
- "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above."
- `language_code` forces a language, but "This parameter is not supported for multilingual_v2 models."

### Readings

There is no SSML control for Japanese. "Phoneme tags are only compatible with the `eleven_flash_v2` model", with the CMU Arpabet and IPA alphabets ([best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)). That model is English.

Two paths remain: send the reading as kana in the text, or use a pronunciation dictionary with alias rules. The page offers alias tags for "Multilingual v2, which doesn't support phoneme tags".

### Price

From the [API pricing page](https://elevenlabs.io/pricing/api): "$0.04" per 1K characters for Flash and Turbo, "$0.08" per 1K characters for Multilingual v2, v3 and v4. That is $40 and $80 per 1M characters. The Free plan has "10k credits per month" ([plans](https://elevenlabs.io/pricing)). The Starter plan is $6 per month with 30k credits.

### Terms for the audio

From the [Terms of Service](https://elevenlabs.io/terms-of-use) (last updated 09 October 2026):

- "as between you and ElevenLabs, you retain all rights in and to your Output."
- "if you access or use our Services free of charge (such a user, a "Free User"), you may only use the Services for non-commercial purposes"
- "We may enable you to download Output from some (but not all) of the Services; in such cases, you are permitted to use such Output outside of the Services"
- "You are responsible for exporting any Content you wish to retain before your access to a Service ends."

The help center adds the rules for publishing ([publish](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)): "If you publish content generated using our Services on a free plan or without being signed-in to your account, you must attribute it to ElevenLabs by including "elevenlabs.io" or "11.ai" in the title". And: "Content created outside of a paid subscription (before or after) cannot be used commercially and always requires attribution when shared non-commercially."

After a paid plan ends ([subscription end](https://elevenlabs.io/docs/help-center/account/general/what-happens-to-my-content-after-my-subscription-ends)): "Once your subscription ends, you will still have a commercial license to use whatever you generated during that subscription forever."

So a learner on the Free plan may store the audio and may share a free deck, with the attribution. Whether a free shared Anki deck counts as "non-commercial" is not defined in the terms. How to put "elevenlabs.io" in the "title" of a deck is not stated either.

## Options the evidence leaves open

These are the choices the facts allow. None is chosen here.

### Polly signing

Michigo can sign with `node:crypto`, bundle a signer of about 66 to 107 kB, or bundle the SDK client. All three bundle into the app, since nothing here is a native module.

### Google credentials

An API key keeps the form to one field and needs no signing. A service account JSON is the form Google's own page describes, and it needs a JWT step or `google-auth-library`.

### Output format

Three of the four services have no default, so Michigo must name a format. MP3 exists on all four. The lowest common setting near 48 kbps is `mp3` at 24 kHz on Polly, `audio-24khz-48kbitrate-mono-mp3` on Azure and `mp3_24000_48` on ElevenLabs. Google MP3 is fixed at 32 kbps.

### The ElevenLabs voice picker

"The Japanese voices the service reports" has no direct answer on ElevenLabs. The options are the voices of the account with `ja` in `verified_languages`, all voices of the account, or the shared library filtered by `language=ja`.

### Sending a reading

Polly, Azure and Google accept a kana reading through `phoneme` or `sub`. ElevenLabs does not, so a reading can only replace the text.

### One line per settings row

The decision asks for the restriction in one line per Audio Source. The evidence supports these: Polly has none. Azure requires disclosure of the synthetic voice. Google has no stated rule beyond not training models. ElevenLabs Free is non-commercial with attribution.

## Not verified

- No request was made with a real account, so no voice list and no file size was observed.
- The Microsoft Product Terms were not read.
- The price of the Azure Neural HD Flash voices.
- Whether Azure synthesis accepts the key header, given the two tables that disagree.
- The total number of Japanese voices in the ElevenLabs Voice Library, and whether a free account may use them through the API.
- How ElevenLabs credits map to characters per model.
- Japanese voice quality. Nothing was listened to.
