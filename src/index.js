#!/usr/bin/env node
// @ai-native-solutions/fallaudio-api
// HTTP API for fallaudio-sdk. Accepts raw WAV bodies, returns WAV or JSON.
// MIT · ai-nativesolutions.com

import express from 'express';
import {
  decodeWav, encodeWav,
  normalize, fadeIn, fadeOut, reverse, applyGainDb, trimSilence, trim,
  applyFilter, speed as speedOp, stats,
} from '@ai-native-solutions/fallaudio-sdk';

const app = express();
const PORT = process.env.PORT || 8787;
const MAX_BODY = process.env.MAX_BODY || '50mb';

app.use(express.raw({ type: 'audio/wav', limit: MAX_BODY }));
app.use(express.raw({ type: 'application/octet-stream', limit: MAX_BODY }));

function loadFromReq(req) {
  if (!req.body || !req.body.length) throw new Error('POST body must be a WAV file (Content-Type: audio/wav)');
  return decodeWav(req.body);
}
function sendWav(res, buffer, sampleRate, filename = 'out.wav') {
  const wav = encodeWav(buffer, sampleRate);
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Sample-Rate', String(sampleRate));
  res.setHeader('X-Samples', String(buffer.length));
  res.send(Buffer.from(wav));
}
function num(v, def) { const n = parseFloat(v); return isFinite(n) ? n : def; }
function int(v, def) { const n = parseInt(v, 10); return isFinite(n) ? n : def; }
function rangeFromQuery(q, len) {
  if (q.start == null && q.end == null) return null;
  return [Math.max(0, int(q.start, 0)), Math.min(len, int(q.end, len))];
}
function wrap(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch (e) { res.status(400).json({ error: e.message }); }
  };
}

// ── info ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    name: 'fallaudio-api',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /inspect (WAV in → JSON)',
      'POST /normalize?start&end (WAV → WAV)',
      'POST /trim-silence?threshold=0.01 (WAV → WAV)',
      'POST /fade?in=0&out=0 (seconds, WAV → WAV)',
      'POST /gain?db=-6&start&end (WAV → WAV)',
      'POST /filter?type=lowpass&freq=800 (WAV → WAV)',
      'POST /speed?factor=1.5 (WAV → WAV)',
      'POST /reverse (WAV → WAV)',
      'POST /trim?start=0&end=44100 (WAV → WAV)',
    ],
    upload: 'Content-Type: audio/wav · raw body',
  });
});

app.get('/health', (req, res) => res.json({ ok: true, uptimeSec: process.uptime() }));

// ── ops ─────────────────────────────────────────────────────────────────────

app.post('/inspect', wrap(async (req, res) => {
  const { buffer, sampleRate, channels, bitsPerSample } = loadFromReq(req);
  const s = stats(buffer);
  res.json({
    sampleRate, channels, bitsPerSample,
    samples: buffer.length,
    durationSec: buffer.length / sampleRate,
    peak: s.peak, peakDb: s.peakDb, rms: s.rms, rmsDb: s.rmsDb,
  });
}));

app.post('/normalize', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const r = rangeFromQuery(req.query, buffer.length);
  const { buffer: nb, gainDb } = normalize(buffer, r);
  res.setHeader('X-Normalize-Gain-Db', gainDb.toFixed(3));
  sendWav(res, nb, sampleRate, 'normalized.wav');
}));

app.post('/trim-silence', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const nb = trimSilence(buffer, num(req.query.threshold, 0.01));
  sendWav(res, nb, sampleRate, 'trimmed.wav');
}));

app.post('/fade', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  let nb = buffer;
  const inSec = num(req.query.in, 0);
  const outSec = num(req.query.out, 0);
  if (inSec > 0) {
    const n = Math.min(nb.length, Math.round(inSec * sampleRate));
    nb = fadeIn(nb, [0, n]);
  }
  if (outSec > 0) {
    const n = Math.min(nb.length, Math.round(outSec * sampleRate));
    nb = fadeOut(nb, [nb.length - n, nb.length]);
  }
  sendWav(res, nb, sampleRate, 'faded.wav');
}));

app.post('/gain', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const db = num(req.query.db, 0);
  const r = rangeFromQuery(req.query, buffer.length);
  sendWav(res, applyGainDb(buffer, db, r), sampleRate, 'gained.wav');
}));

app.post('/filter', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const type = String(req.query.type || 'lowpass');
  const freq = num(req.query.freq, 800);
  sendWav(res, applyFilter(buffer, sampleRate, type, freq), sampleRate, 'filtered.wav');
}));

app.post('/speed', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const factor = num(req.query.factor, 1);
  if (factor <= 0) throw new Error('factor must be > 0');
  const { buffer: nb } = speedOp(buffer, factor);
  sendWav(res, nb, sampleRate, 'speed.wav');
}));

app.post('/reverse', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  sendWav(res, reverse(buffer), sampleRate, 'reversed.wav');
}));

app.post('/trim', wrap(async (req, res) => {
  const { buffer, sampleRate } = loadFromReq(req);
  const start = int(req.query.start, 0);
  const end = int(req.query.end, buffer.length);
  sendWav(res, trim(buffer, [start, end]), sampleRate, 'trimmed.wav');
}));

app.listen(PORT, () => {
  console.log(`fallaudio-api listening on :${PORT}`);
});
