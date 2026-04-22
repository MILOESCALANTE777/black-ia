import axios from 'axios';

const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const NEWS_KEY   = import.meta.env.VITE_NEWS_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuantCandle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LogAnomalySignal {
  timestamp: string;
  logReturn: number;
  zScore: number;
  pValue: number;
  direction: 'LONG' | 'SHORT' | 'NONE';
  signalStrength: number;   // 0.0 - 1.0
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  isSignificant: boolean;   // p < 0.05
  isSignificant99: boolean; // p < 0.01
  rollingMean: number;
  rollingStd: number;
  upperThreshold: number;
  lowerThreshold: number;
}

export interface QuantMetrics {
  totalSignals: number;
  significantSignals: number;   // p < 0.05
  significantSignals99: number; // p < 0.01
  zScoreMax: number;
  zScoreMin: number;
  anomalyRate: number;          // % of bars with anomaly
  lastSignal: LogAnomalySignal | null;
  recentSignals: LogAnomalySignal[];
}

export interface NewsImpact {
  time: string;
  headline: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  importance: 'high' | 'medium' | 'low';
  source: string;
}

export interface QuantAnalysis {
  symbol: string;
  assetName: string;
  timestamp: string;
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;
  candles: QuantCandle[];
  signals: LogAnomalySignal[];
  metrics: QuantMetrics;
  newsImpacts: NewsImpact[];
  aiSummary: string;
  marketRegime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile';
  nextSignalWindow: string;
  lastUpdated: string;
  isMarketOpen: boolean;
  nyTime: string;
}

// ─── Model config (optimal params from README) ────────────────────────────────

const MODEL_CONFIG = {
  window: 30,           // rolling window for mean/std
  thresholdSigma: 2.5,  // ±2.5 standard deviations
  maxHoldingBars: 8,    // max 8 bars (2h in 15m)
  minPeriods: 5,
  confidenceLevel: 0.95,
};

// ─── Asset news queries ───────────────────────────────────────────────────────

const ASSET_NEWS: Record<string, { query: string; impactKeywords: Record<string, { impact: 'bullish' | 'bearish' | 'neutral'; reasoning: string }> }> = {
  'SPX': {
    query: 'S&P 500 SPX stock market Fed interest rates economy earnings',
    impactKeywords: {
      'rate cut': { impact: 'bullish', reasoning: 'Baja de tasas -> liquidez -> indices suben.' },
      'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> tasas altas -> indices bajan.' },
      'earnings beat': { impact: 'bullish', reasoning: 'Resultados superiores -> rally.' },
      'earnings miss': { impact: 'bearish', reasoning: 'Resultados inferiores -> caida.' },
      'recession': { impact: 'bearish', reasoning: 'Recesion -> caida de indices.' },
      'inflation': { impact: 'bearish', reasoning: 'Inflacion alta -> Fed sube tasas -> indices presionados.' },
      'gdp': { impact: 'bullish', reasoning: 'PIB fuerte -> economia solida -> indices suben.' },
      'tariff': { impact: 'bearish', reasoning: 'Aranceles -> guerra comercial -> indices bajan.' },
      'unemployment': { impact: 'bearish', reasoning: 'Desempleo alto -> economia debil.' },
      'nfp': { impact: 'neutral', reasoning: 'NFP fuerte puede ser alcista o bajista segun contexto Fed.' },
      'fomc': { impact: 'bearish', reasoning: 'FOMC hawkish presiona indices.' },
      'rally': { impact: 'bullish', reasoning: 'Momentum alcista en el mercado.' },
      'selloff': { impact: 'bearish', reasoning: 'Venta masiva en el mercado.' },
    }
  },
  'DJI': {
    query: 'Dow Jones DJI industrial stocks economy earnings',
    impactKeywords: {
      'rate cut': { impact: 'bullish', reasoning: 'Baja de tasas beneficia acciones industriales.' },
      'fed ': { impact: 'bearish', reasoning: 'Fed hawkish pesa sobre el Dow.' },
      'earnings': { impact: 'bullish', reasoning: 'Resultados corporativos impulsan el Dow.' },
      'recession': { impact: 'bearish', reasoning: 'Recesion golpea acciones industriales.' },
      'tariff': { impact: 'bearish', reasoning: 'Aranceles afectan empresas industriales del Dow.' },
    }
  },
  'NDX': {
    query: 'Nasdaq 100 NDX tech stocks AI semiconductor earnings',
    impactKeywords: {
      'rate cut': { impact: 'bullish', reasoning: 'Tasas bajas benefician valuaciones tech.' },
      'fed ': { impact: 'bearish', reasoning: 'Fed hawkish comprime valuaciones tech.' },
      'ai': { impact: 'bullish', reasoning: 'Noticias de IA impulsan acciones tech.' },
      'earnings': { impact: 'bullish', reasoning: 'Resultados tech impulsan el Nasdaq.' },
      'regulation': { impact: 'bearish', reasoning: 'Regulacion tech genera incertidumbre.' },
      'semiconductor': { impact: 'bullish', reasoning: 'Demanda de chips impulsa el sector.' },
    }
  },
  'XAU/USD': {
    query: 'gold XAU federal reserve inflation CPI FOMC dollar',
    impactKeywords: {
      'inflation': { impact: 'bullish', reasoning: 'Inflacion alta -> oro como cobertura sube.' },
      'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> USD fuerte -> oro baja.' },
      'dollar': { impact: 'bearish', reasoning: 'USD fuerte presiona al oro.' },
      'recession': { impact: 'bullish', reasoning: 'Recesion -> refugio en oro.' },
      'war': { impact: 'bullish', reasoning: 'Conflictos -> refugio en oro.' },
      'rate cut': { impact: 'bullish', reasoning: 'Baja de tasas -> USD debil -> oro sube.' },
    }
  },
  'BTC/USD': {
    query: 'bitcoin BTC crypto halving ETF regulation',
    impactKeywords: {
      'halving': { impact: 'bullish', reasoning: 'Halving reduce oferta -> historicamente alcista.' },
      'etf': { impact: 'bullish', reasoning: 'ETF aprobado -> flujo institucional.' },
      'regulation': { impact: 'bearish', reasoning: 'Regulacion mas estricta presiona cripto.' },
      'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> risk-off -> cripto baja.' },
    }
  },
};

function getNewsConfig(symbol: string) {
  return ASSET_NEWS[symbol] || ASSET_NEWS['SPX'];
}

// ─── NY time utilities ────────────────────────────────────────────────────────

function getNYTime(): { hours: number; minutes: number; timeStr: string; isMarketOpen: boolean } {
  const now = new Date();
  const nyStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyStr);
  const hours = nyDate.getHours();
  const minutes = nyDate.getMinutes();
  const timeStr = nyDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
  const isMarketOpen = (hours > 9 || (hours === 9 && minutes >= 30)) && hours < 16;
  return { hours, minutes, timeStr, isMarketOpen };
}

function getNextSignalWindow(): string {
  const { hours, minutes, isMarketOpen } = getNYTime();
  if (!isMarketOpen) {
    return 'Mercado cerrado. Proxima apertura: 9:30 AM NY';
  }
  // Next 15-min bar
  const nextMin = Math.ceil(minutes / 15) * 15;
  if (nextMin >= 60) {
    return `${String(hours + 1).padStart(2, '0')}:00 NY`;
  }
  return `${String(hours).padStart(2, '0')}:${String(nextMin).padStart(2, '0')} NY`;
}

// ─── Fetch candles ────────────────────────────────────────────────────────────

export async function fetchQuantCandles(symbol: string, interval = '15min', outputsize = 500): Promise<QuantCandle[]> {
  try {
    const res = await axios.get('/api/twelve/time_series', {
      params: { symbol, interval, outputsize, apikey: TWELVE_KEY, format: 'JSON' },
      timeout: 15000,
    });
    if (!res.data?.values?.length) throw new Error('no data');
    return res.data.values.map((v: Record<string, string>) => ({
      datetime: v.datetime,
      open: parseFloat(v.open), high: parseFloat(v.high),
      low: parseFloat(v.low), close: parseFloat(v.close),
      volume: parseFloat(v.volume || '0'),
    }));
  } catch {
    return [];
  }
}

// ─── Signal history persistence (localStorage) ────────────────────────────────

const HISTORY_KEY = 'quant_signal_history_v2';
const MAX_HISTORY = 200; // max signals to keep per symbol

export interface StoredSignal extends LogAnomalySignal {
  symbol: string;
  savedAt: string;
}

export function loadSignalHistory(symbol: string): StoredSignal[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const all: StoredSignal[] = JSON.parse(raw);
    return all.filter(s => s.symbol === symbol).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export function saveSignalsToHistory(symbol: string, newSignals: LogAnomalySignal[]): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all: StoredSignal[] = raw ? JSON.parse(raw) : [];

    // Get existing timestamps for this symbol to avoid duplicates
    const existingTimestamps = new Set(all.filter(s => s.symbol === symbol).map(s => s.timestamp));

    // Add only new signals
    const toAdd: StoredSignal[] = newSignals
      .filter(s => !existingTimestamps.has(s.timestamp))
      .map(s => ({ ...s, symbol, savedAt: new Date().toISOString() }));

    if (toAdd.length === 0) return;

    // Merge, keep latest MAX_HISTORY per symbol
    const otherSymbols = all.filter(s => s.symbol !== symbol);
    const thisSymbol = [...all.filter(s => s.symbol === symbol), ...toAdd]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify([...otherSymbols, ...thisSymbol]));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function clearSignalHistory(symbol?: string): void {
  try {
    if (!symbol) {
      localStorage.removeItem(HISTORY_KEY);
      return;
    }
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const all: StoredSignal[] = JSON.parse(raw);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.filter(s => s.symbol !== symbol)));
  } catch { /* ignore */ }
}

async function fetchCurrentPrice(symbol: string): Promise<{ price: number; change: number; pct: number }> {
  try {
    const [p, q] = await Promise.all([
      axios.get('/api/twelve/price', { params: { symbol, apikey: TWELVE_KEY }, timeout: 8000 }),
      axios.get('/api/twelve/quote', { params: { symbol, apikey: TWELVE_KEY }, timeout: 8000 }),
    ]);
    const price = parseFloat(p.data?.price || '0');
    const change = parseFloat(q.data?.change || '0');
    const pct = parseFloat(q.data?.percent_change || '0');
    if (price > 0) return { price, change, pct };
    throw new Error('invalid');
  } catch {
    const fallbacks: Record<string, number> = { 'SPX': 7100, 'DJI': 39800, 'NDX': 18200, 'XAU/USD': 3320, 'BTC/USD': 67000 };
    return { price: fallbacks[symbol] || 100, change: 0, pct: 0 };
  }
}

// ─── Log-Anomaly Model (replicates Python model exactly) ─────────────────────

function calcLogReturns(candles: QuantCandle[]): number[] {
  const reversed = [...candles].reverse(); // oldest first
  const returns: number[] = [NaN];
  for (let i = 1; i < reversed.length; i++) {
    if (reversed[i - 1].close > 0 && reversed[i].close > 0) {
      returns.push(Math.log(reversed[i].close / reversed[i - 1].close));
    } else {
      returns.push(NaN);
    }
  }
  return returns;
}

function normalCDF(z: number): number {
  // Approximation of the normal CDF
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function calcPValue(zScore: number): number {
  // Two-tailed p-value
  return 2 * (1 - normalCDF(Math.abs(zScore)));
}

export function runLogAnomalyModel(candles: QuantCandle[]): LogAnomalySignal[] {
  if (candles.length < MODEL_CONFIG.window + MODEL_CONFIG.minPeriods) return [];

  const reversed = [...candles].reverse(); // oldest first
  const logReturns = calcLogReturns(candles).reverse(); // match reversed order
  const signals: LogAnomalySignal[] = [];

  for (let i = MODEL_CONFIG.window; i < reversed.length; i++) {
    const windowReturns = logReturns.slice(i - MODEL_CONFIG.window, i).filter(r => !isNaN(r));
    if (windowReturns.length < MODEL_CONFIG.minPeriods) continue;

    const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
    const variance = windowReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowReturns.length;
    const std = Math.sqrt(variance);
    if (std === 0) continue;

    const currentReturn = logReturns[i];
    if (isNaN(currentReturn)) continue;

    const zScore = (currentReturn - mean) / std;
    const pValue = calcPValue(zScore);
    const upperThreshold = mean + MODEL_CONFIG.thresholdSigma * std;
    const lowerThreshold = mean - MODEL_CONFIG.thresholdSigma * std;
    const isAnomaly = Math.abs(zScore) >= MODEL_CONFIG.thresholdSigma;

    if (!isAnomaly) continue;

    const isUpper = zScore > 0; // price moved up anomalously -> SHORT (mean reversion)
    const isLower = zScore < 0; // price moved down anomalously -> LONG (mean reversion)

    const currentCandle = reversed[i];
    const entryPrice = currentCandle.close;
    const atr = reversed.slice(Math.max(0, i - 14), i).reduce((s, c) => s + (c.high - c.low), 0) / 14 || entryPrice * 0.003;

    // Mean reversion: TP = rolling mean price, SL = 1.5 ATR
    const meanPrice = reversed.slice(i - MODEL_CONFIG.window, i).reduce((s, c) => s + c.close, 0) / MODEL_CONFIG.window;

    let direction: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
    let stopLoss = entryPrice;
    let takeProfit = meanPrice;

    if (isLower && pValue < (1 - MODEL_CONFIG.confidenceLevel)) {
      direction = 'LONG';
      stopLoss = entryPrice - 1.5 * atr;
      takeProfit = meanPrice;
    } else if (isUpper && pValue < (1 - MODEL_CONFIG.confidenceLevel)) {
      direction = 'SHORT';
      stopLoss = entryPrice + 1.5 * atr;
      takeProfit = meanPrice;
    }

    // Signal strength: normalized |z-score| capped at 1.0
    const signalStrength = Math.min(1.0, (Math.abs(zScore) - MODEL_CONFIG.thresholdSigma) / MODEL_CONFIG.thresholdSigma);

    signals.push({
      timestamp: currentCandle.datetime,
      logReturn: parseFloat(currentReturn.toFixed(6)),
      zScore: parseFloat(zScore.toFixed(4)),
      pValue: parseFloat(pValue.toFixed(6)),
      direction,
      signalStrength: parseFloat(signalStrength.toFixed(4)),
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
      isSignificant: pValue < 0.05,
      isSignificant99: pValue < 0.01,
      rollingMean: parseFloat(mean.toFixed(6)),
      rollingStd: parseFloat(std.toFixed(6)),
      upperThreshold: parseFloat(upperThreshold.toFixed(6)),
      lowerThreshold: parseFloat(lowerThreshold.toFixed(6)),
    });
  }

  return signals;
}

function calcMetrics(signals: LogAnomalySignal[], totalBars: number): QuantMetrics {
  const significant = signals.filter(s => s.isSignificant);
  const significant99 = signals.filter(s => s.isSignificant99);
  const zScores = signals.map(s => s.zScore);
  const recent = [...signals].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);
  const lastSignal = recent[0] || null;

  return {
    totalSignals: signals.length,
    significantSignals: significant.length,
    significantSignals99: significant99.length,
    zScoreMax: zScores.length ? Math.max(...zScores) : 0,
    zScoreMin: zScores.length ? Math.min(...zScores) : 0,
    anomalyRate: totalBars > 0 ? parseFloat(((signals.length / totalBars) * 100).toFixed(1)) : 0,
    lastSignal,
    recentSignals: recent,
  };
}

// ─── Fetch news ───────────────────────────────────────────────────────────────

async function fetchNewsImpacts(symbol: string): Promise<NewsImpact[]> {
  const config = getNewsConfig(symbol);
  try {
    const res = await axios.get('/api/news/v2/everything', {
      params: { q: config.query, language: 'en', sortBy: 'publishedAt', pageSize: 12, apiKey: NEWS_KEY },
      timeout: 10000,
    });
    if (!res.data?.articles?.length) throw new Error('no articles');

    return res.data.articles
      .filter((a: Record<string, string>) => a.title && a.publishedAt)
      .slice(0, 10)
      .map((a: Record<string, string>) => {
        const text = (a.title + ' ' + (a.description || '')).toLowerCase();
        let impact: NewsImpact['impact'] = 'neutral';
        let reasoning = 'Impacto indirecto en el activo.';

        for (const [kw, data] of Object.entries(config.impactKeywords)) {
          if (text.includes(kw)) {
            impact = data.impact;
            reasoning = data.reasoning;
            break;
          }
        }

        const isHigh = ['fomc', 'fed ', 'nfp', 'cpi', 'earnings', 'rate decision', 'powell', 'inflation', 'gdp'].some(k => text.includes(k));
        const isMed = ['dollar', 'oil', 'china', 'tariff', 'unemployment', 'revenue'].some(k => text.includes(k));

        const pub = new Date(a.publishedAt);
        const timeLabel = pub.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ' ' +
          pub.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        return {
          time: timeLabel,
          headline: a.title.length > 90 ? a.title.slice(0, 90) + '...' : a.title,
          impact,
          reasoning,
          importance: isHigh ? 'high' : isMed ? 'medium' : 'low',
          source: a.source?.name || '',
        } as NewsImpact;
      });
  } catch {
    return [];
  }
}

// ─── GPT-4o summary ───────────────────────────────────────────────────────────

async function generateAISummary(params: {
  symbol: string; assetName: string; currentPrice: number;
  metrics: QuantMetrics; newsImpacts: NewsImpact[];
  isMarketOpen: boolean; nyTime: string;
}): Promise<{ summary: string; regime: QuantAnalysis['marketRegime'] }> {
  const { symbol, assetName, currentPrice, metrics, newsImpacts, isMarketOpen, nyTime } = params;
  const lastSig = metrics.lastSignal;

  const prompt = `Eres un analista cuantitativo experto. Analiza los datos del modelo Log-Anomaly para ${symbol} (${assetName}).

HORA NY: ${nyTime} | MERCADO: ${isMarketOpen ? 'ABIERTO' : 'CERRADO'}
PRECIO ACTUAL: ${currentPrice.toLocaleString()}

METRICAS DEL MODELO (ventana 30 barras, umbral ±2.5σ):
- Total anomalias detectadas: ${metrics.totalSignals}
- Significativas al 95%: ${metrics.significantSignals}
- Significativas al 99%: ${metrics.significantSignals99}
- Z-Score maximo: ${metrics.zScoreMax.toFixed(4)}
- Z-Score minimo: ${metrics.zScoreMin.toFixed(4)}
- Tasa de anomalia: ${metrics.anomalyRate}%

ULTIMA SEÑAL DETECTADA:
${lastSig ? `${lastSig.timestamp} | ${lastSig.direction} | Z-Score: ${lastSig.zScore} | p-value: ${lastSig.pValue} | Fuerza: ${(lastSig.signalStrength * 100).toFixed(0)}% | Entrada: ${lastSig.entryPrice} | SL: ${lastSig.stopLoss} | TP: ${lastSig.takeProfit}` : 'Ninguna reciente'}

SEÑALES RECIENTES (ultimas 5):
${metrics.recentSignals.map(s => `${s.timestamp}: ${s.direction} Z=${s.zScore.toFixed(2)} p=${s.pValue.toFixed(4)} fuerza=${(s.signalStrength*100).toFixed(0)}%`).join('\n') || 'Ninguna'}

NOTICIAS RECIENTES:
${newsImpacts.slice(0, 5).map(n => `[${n.impact.toUpperCase()}] ${n.headline}`).join('\n')}

LOGICA DEL MODELO:
- Detecta anomalias en rendimientos logaritmicos cuando |Z-Score| >= 2.5σ
- LONG cuando precio cae anomalamente (Z < -2.5) -> espera reversion a la media
- SHORT cuando precio sube anomalamente (Z > +2.5) -> espera reversion a la media
- TP = media movil de 30 barras (precio de reversion)
- SL = 1.5 x ATR(14) desde entrada
- Solo opera señales con p-value < 0.05 (significancia estadistica)

Responde en JSON:
{
  "summary": "3-4 oraciones: estado actual del modelo, ultima señal, contexto de noticias y que esperar",
  "regime": "trending_up" | "trending_down" | "ranging" | "volatile"
}`;

  try {
    const res = await axios.post('/api/openai/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }, {
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      timeout: 25000,
    });
    return JSON.parse(res.data.choices[0].message.content);
  } catch {
    return {
      summary: 'Modelo cuantitativo activo. Monitoreando anomalias en rendimientos logaritmicos con umbral ±2.5σ.',
      regime: 'ranging',
    };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runQuantAnalysis(symbol = 'SPX'): Promise<QuantAnalysis> {
  const assetNames: Record<string, string> = {
    'SPX': 'S&P 500', 'DJI': 'Dow Jones', 'NDX': 'Nasdaq 100',
    'XAU/USD': 'Oro', 'BTC/USD': 'Bitcoin', 'ETH/USD': 'Ethereum',
    'EUR/USD': 'EUR/USD', 'GBP/USD': 'GBP/USD', 'AAPL': 'Apple', 'NVDA': 'NVIDIA',
  };
  const assetName = assetNames[symbol] || symbol;

  const nyInfo = getNYTime();

  // Fetch data in parallel
  const [priceData, candles15m] = await Promise.all([
    fetchCurrentPrice(symbol),
    fetchQuantCandles(symbol, '15min', 100),
  ]);

  const { price: currentPrice, change, pct } = priceData;

  // Run log-anomaly model
  const signals = candles15m.length >= MODEL_CONFIG.window + MODEL_CONFIG.minPeriods
    ? runLogAnomalyModel(candles15m)
    : [];

  // Persist new signals to localStorage history
  if (signals.length > 0) {
    saveSignalsToHistory(symbol, signals);
  }

  const metrics = calcMetrics(signals, candles15m.length);

  // Fetch news
  const newsImpacts = await fetchNewsImpacts(symbol);

  // GPT-4o summary
  const aiResult = await generateAISummary({
    symbol, assetName, currentPrice, metrics, newsImpacts,
    isMarketOpen: nyInfo.isMarketOpen, nyTime: nyInfo.timeStr,
  });

  return {
    symbol, assetName,
    timestamp: new Date().toISOString(),
    currentPrice, priceChange: change, priceChangePct: pct,
    candles: candles15m.slice(0, 50),
    signals,
    metrics,
    newsImpacts,
    aiSummary: aiResult.summary,
    marketRegime: aiResult.regime,
    nextSignalWindow: getNextSignalWindow(),
    lastUpdated: nyInfo.timeStr + ' NY',
    isMarketOpen: nyInfo.isMarketOpen,
    nyTime: nyInfo.timeStr,
  };
}
