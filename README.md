# fallaudio-api

HTTP wrapper for [`@ai-native-solutions/fallaudio-sdk`](https://github.com/sjgant80-hub/fallaudio-sdk). POST a WAV, get a WAV back (or JSON stats). Express, one file, MIT.

## Install & run

```bash
npm install
npm start
# → listening on http://localhost:8787
```

Or with Docker:

```bash
docker compose up --build
```

## Endpoints

Every op takes a raw WAV body (`Content-Type: audio/wav`) and returns either a WAV or JSON.

| Method | Path | Query | Returns |
| --- | --- | --- | --- |
| GET  | `/` | – | JSON: name/version/endpoints |
| GET  | `/health` | – | `{ok:true, uptimeSec}` |
| POST | `/inspect` | – | JSON: sampleRate, channels, samples, duration, peak, peakDb, rms, rmsDb |
| POST | `/normalize` | `start`, `end` | WAV (header `X-Normalize-Gain-Db`) |
| POST | `/trim-silence` | `threshold` (default 0.01) | WAV |
| POST | `/fade` | `in` (sec), `out` (sec) | WAV |
| POST | `/gain` | `db`, `start`, `end` | WAV |
| POST | `/filter` | `type` (lowpass/highpass/bandpass), `freq` | WAV |
| POST | `/speed` | `factor` (0.5–2) | WAV |
| POST | `/reverse` | – | WAV |
| POST | `/trim` | `start`, `end` (samples) | WAV |

Response headers on WAV responses: `X-Sample-Rate`, `X-Samples`.

## curl

```bash
# inspect a wav
curl -s -X POST http://localhost:8787/inspect \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav | jq

# normalize
curl -X POST http://localhost:8787/normalize \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav -o out.wav

# 24 dB gain on samples 0..44100
curl -X POST "http://localhost:8787/gain?db=24&start=0&end=44100" \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav -o out.wav

# 300 Hz highpass
curl -X POST "http://localhost:8787/filter?type=highpass&freq=300" \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav -o out.wav

# 2x speed
curl -X POST "http://localhost:8787/speed?factor=2" \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav -o out.wav

# 200ms fade-in and 500ms fade-out
curl -X POST "http://localhost:8787/fade?in=0.2&out=0.5" \
  -H "Content-Type: audio/wav" \
  --data-binary @in.wav -o out.wav
```

## Environment

- `PORT` — default `8787`
- `MAX_BODY` — default `50mb` (raw body size limit)

## License

MIT · ai-nativesolutions.com
