### Usage
Copy `.env.example` to `.env` and setup needed params.

If needed, convert a source book file (epub, fb2) to txt:
```
npm run convert
```
Run the split action:
```
npm run split
```
Run the main script:
```
npm run start
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
