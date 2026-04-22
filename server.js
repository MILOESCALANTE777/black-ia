import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// ─── API Proxy routes ─────────────────────────────────────────────────────────

// OpenAI proxy
app.use('/api/openai', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: { '^/api/openai': '' },
  on: {
    error: (err, req, res) => {
      console.error('[OpenAI proxy error]', err.message);
      res.status(502).json({ error: 'OpenAI proxy error', message: err.message });
    },
  },
}));

// Twelve Data proxy
app.use('/api/twelve', createProxyMiddleware({
  target: 'https://api.twelvedata.com',
  changeOrigin: true,
  pathRewrite: { '^/api/twelve': '' },
  on: {
    error: (err, req, res) => {
      console.error('[TwelveData proxy error]', err.message);
      res.status(502).json({ error: 'TwelveData proxy error', message: err.message });
    },
  },
}));

// NewsAPI proxy
app.use('/api/news', createProxyMiddleware({
  target: 'https://newsapi.org',
  changeOrigin: true,
  pathRewrite: { '^/api/news': '' },
  on: {
    error: (err, req, res) => {
      console.error('[NewsAPI proxy error]', err.message);
      res.status(502).json({ error: 'NewsAPI proxy error', message: err.message });
    },
  },
}));

// ─── Serve static frontend build ──────────────────────────────────────────────

const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
