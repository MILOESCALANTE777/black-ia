import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Yahoo Finance proxy (for indices: SPX, DJI, NDX) ────────────────────────
// Yahoo blocks direct browser requests — we proxy through the server

app.get('/api/yahoo/chart/:symbol', (req, res) => {
  const { symbol } = req.params;
  const { interval = '15m', range = '5d' } = req.query;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  };

  https.get(url, options, (yahooRes) => {
    let data = '';
    yahooRes.on('data', chunk => { data += chunk; });
    yahooRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  }).on('error', (err) => {
    console.error('[Yahoo proxy error]', err.message);
    res.status(502).json({ error: 'Yahoo Finance proxy error', message: err.message });
  });
});

// ─── API Proxy routes ─────────────────────────────────────────────────────────

// Groq proxy (reemplaza OpenAI - gratis)
app.use('/api/openai', createProxyMiddleware({
  target: 'https://api.groq.com',
  changeOrigin: true,
  pathRewrite: { '^/api/openai': '' },
  on: {
    error: (err, req, res) => {
      console.error('[Groq proxy error]', err.message);
      res.status(502).json({ error: 'Groq proxy error', message: err.message });
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
