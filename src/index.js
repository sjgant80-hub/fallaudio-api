// fallaudio-api · Express HTTP wrapper around fallaudio-sdk · MIT · AI-Native Solutions
import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, tool: 'fallaudio', version: '1.0.0' }));

app.post('/loadConfig', async (req, res) => {
  try {
    const { loadConfig } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof loadConfig === 'function' ? await loadConfig(req.body) : { error: 'loadConfig not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/saveConfig', async (req, res) => {
  try {
    const { saveConfig } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof saveConfig === 'function' ? await saveConfig(req.body) : { error: 'saveConfig not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/$', async (req, res) => {
  try {
    const { $ } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof $ === 'function' ? await $(req.body) : { error: '$ not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/esc', async (req, res) => {
  try {
    const { esc } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof esc === 'function' ? await esc(req.body) : { error: 'esc not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/aiTier', async (req, res) => {
  try {
    const { aiTier } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof aiTier === 'function' ? await aiTier(req.body) : { error: 'aiTier not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/renderAiChip', async (req, res) => {
  try {
    const { renderAiChip } = await import('@ai-native-solutions/fallaudio-sdk');
    const out = typeof renderAiChip === 'function' ? await renderAiChip(req.body) : { error: 'renderAiChip not callable' };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('fallaudio-api listening on :' + PORT));
