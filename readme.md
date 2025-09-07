### Install
```shell
npm install
npm link
```

### Usage
Copy `.env.example` to `.env` and setup needed params.

Seed API key:
```
app seed
```


If needed, convert a source book file (epub, fb2) to txt:
```
app convert
app split
app process
```

Convert wav to mp3:
```
app encode
```

---

### Google GenAI TTS API free tier limits:

| Model                         | RPM |    TPM | RPD |
|:------------------------------|----:|-------:|----:|
| Gemini 2.5 Flash Preview TTS  |   3 | 10,000 |  15 |

- RPM - Requests per minute
- TPM - Tokens per minute (input)
- RPD - Requests per day
---
