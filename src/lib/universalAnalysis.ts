import axios from 'axios';
import { openaiPost, parseModelJSON } from './openai';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const NEWS_KEY   = import.meta.env.VITE_NEWS_API_KEY;

export type Timeframe = '15min' | '30min' | '1h' | '2h' | '3h' | '4h' | '1day' | '1week';
export type AssetType = 'gold' | 'crypto' | 'forex' | 'stock' | 'commodity' | 'index';

export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  price: number;
  high: number;
  low: number;
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

// ─── Statistical Edge Reversion signal ───────────────────────────────────────
// BB(20,2) + RSI(14) + Volume > 150% MA20 + ATR(14) stop 1.5x

export interface StatEdgeSignal {
  active: boolean;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: number;
  sl: number;
  tp: number;           // reversion to SMA20
  rr: string;
  conditions: {
    bbTouch: boolean;
    rsiExtreme: boolean;
    volumeAnomaly: boolean;
    notFreefall: boolean;
  };
  indicators: {
    sma20: number;
    bbUpper: number;
    bbLower: number;
    rsi: number;
    atr: number;
    volumeRatio: number;
    ema20: number;
    ema50: number;
    ema200: number;
  };
  description: string;
}

export interface TimeframeSignal {
  timeframe: Timeframe;
  label: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
  orderBlocks: OrderBlock[];
  statEdge: StatEdgeSignal;
  summary: string;
}

export interface NewsEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual: string;
  forecast: string;
  previous: string;
  assetImpact: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  source?: string;
}

export interface UniversalAnalysis {
  symbol: string;
  assetType: AssetType;
  assetName: string;
  timestamp: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePct: number;
  overallBias: 'bullish' | 'bearish' | 'neutral';
  biasStrength: number;
  aiReasoning: string;
  marketContext: string;
  fundamentalSummary: string;
  newsEvents: NewsEvent[];
  signals: TimeframeSignal[];
  keyLevels: { support: number[]; resistance: number[]; weeklyPivot: number };
  topStatEdge: StatEdgeSignal | null;
}

// ─── Asset catalog ────────────────────────────────────────────────────────────

export const ASSET_CATALOG: Record<string, { name: string; type: AssetType; twelveSymbol: string; newsQuery: string }> = {
  'XAU/USD': { name: 'Oro',           type: 'gold',      twelveSymbol: 'XAU/USD', newsQuery: 'gold XAU "federal reserve" inflation CPI FOMC' },
  'BTC/USD': { name: 'Bitcoin',       type: 'crypto',    twelveSymbol: 'BTC/USD', newsQuery: 'bitcoin BTC crypto halving ETF regulation' },
  'ETH/USD': { name: 'Ethereum',      type: 'crypto',    twelveSymbol: 'ETH/USD', newsQuery: 'ethereum ETH crypto DeFi regulation SEC' },
  'EUR/USD': { name: 'Euro / Dolar',  type: 'forex',     twelveSymbol: 'EUR/USD', newsQuery: 'EUR/USD euro ECB "european central bank" interest rate' },
  'GBP/USD': { name: 'Libra / Dolar', type: 'forex',     twelveSymbol: 'GBP/USD', newsQuery: 'GBP/USD pound "bank of england" BOE inflation UK' },
  'USD/JPY': { name: 'Dolar / Yen',   type: 'forex',     twelveSymbol: 'USD/JPY', newsQuery: 'USD/JPY yen "bank of japan" BOJ intervention' },
  'AAPL':    { name: 'Apple Inc.',    type: 'stock',     twelveSymbol: 'AAPL',    newsQuery: 'Apple AAPL earnings revenue iPhone quarterly results' },
  'TSLA':    { name: 'Tesla Inc.',    type: 'stock',     twelveSymbol: 'TSLA',    newsQuery: 'Tesla TSLA earnings deliveries Elon Musk EV' },
  'NVDA':    { name: 'NVIDIA',        type: 'stock',     twelveSymbol: 'NVDA',    newsQuery: 'NVIDIA NVDA earnings AI chips GPU data center' },
  'SPX':     { name: 'S&P 500',       type: 'index',     twelveSymbol: 'SPX',     newsQuery: 'S&P 500 SPX stock market Fed interest rates economy' },
  'DJI':     { name: 'Dow Jones',     type: 'index',     twelveSymbol: 'DJI',     newsQuery: 'Dow Jones DJI stock market economy earnings' },
  'NDX':     { name: 'Nasdaq 100',    type: 'index',     twelveSymbol: 'NDX',     newsQuery: 'Nasdaq 100 NDX tech stocks Fed interest rates' },
  'XAG/USD': { name: 'Plata',         type: 'commodity', twelveSymbol: 'XAG/USD', newsQuery: 'silver XAG gold inflation industrial demand' },
  'WTI':     { name: 'Petroleo WTI',  type: 'commodity', twelveSymbol: 'WTI',     newsQuery: 'oil WTI crude OPEC production supply demand' },
};

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15min': '15 Min', '30min': '30 Min', '1h': '1 Hora',
  '2h': '2 Horas',  '3h': '3 Horas',   '4h': '4 Horas',
  '1day': 'Diario', '1week': 'Semanal',
};

// ─── Fundamental keywords ─────────────────────────────────────────────────────

const FUNDAMENTAL_KEYWORDS: Record<AssetType, Record<string, { impact: 'bullish' | 'bearish' | 'neutral'; reasoning: string }>> = {
  gold: {
    'inflation': { impact: 'bullish', reasoning: 'Inflacion alta -> Oro como cobertura sube.' },
    'cpi': { impact: 'bullish', reasoning: 'CPI alto confirma inflacion -> Oro sube.' },
    'fomc': { impact: 'bearish', reasoning: 'FOMC hawkish presiona al oro.' },
    'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> USD fuerte -> Oro presionado.' },
    'interest rate': { impact: 'bearish', reasoning: 'Subida de tasas -> USD sube -> Oro baja.' },
    'nfp': { impact: 'bearish', reasoning: 'NFP fuerte -> USD sube -> Oro baja.' },
    'gdp': { impact: 'bearish', reasoning: 'PIB fuerte -> Risk-on -> Oro pierde atractivo.' },
    'unemployment': { impact: 'bullish', reasoning: 'Desempleo alto -> Economia debil -> Oro sube.' },
    'dollar': { impact: 'bearish', reasoning: 'USD fuerte es inversamente correlacionado con el oro.' },
    'gold': { impact: 'bullish', reasoning: 'Noticia directamente relacionada con el oro.' },
    'safe haven': { impact: 'bullish', reasoning: 'Demanda de activos refugio beneficia al oro.' },
    'recession': { impact: 'bullish', reasoning: 'Riesgo de recesion impulsa la demanda de oro.' },
    'crisis': { impact: 'bullish', reasoning: 'Crisis financiera -> Demanda de oro como refugio.' },
    'tariff': { impact: 'bullish', reasoning: 'Aranceles -> Incertidumbre comercial -> Oro sube.' },
    'war': { impact: 'bullish', reasoning: 'Conflictos belicos -> Refugio en oro.' },
    'powell': { impact: 'bearish', reasoning: 'Declaraciones hawkish de Powell presionan al oro.' },
  },
  crypto: {
    'halving': { impact: 'bullish', reasoning: 'Halving reduce oferta -> Historicamente alcista.' },
    'etf': { impact: 'bullish', reasoning: 'Aprobacion de ETF -> Flujo institucional -> Precio sube.' },
    'sec': { impact: 'bearish', reasoning: 'Accion regulatoria de la SEC genera incertidumbre.' },
    'regulation': { impact: 'bearish', reasoning: 'Regulacion mas estricta presiona precios cripto.' },
    'ban': { impact: 'bearish', reasoning: 'Prohibicion de cripto -> Venta masiva.' },
    'adoption': { impact: 'bullish', reasoning: 'Adopcion institucional es alcista.' },
    'hack': { impact: 'bearish', reasoning: 'Hackeo de exchange -> Panico vendedor.' },
    'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> Risk-off -> Cripto baja.' },
    'inflation': { impact: 'bullish', reasoning: 'Inflacion alta -> Bitcoin como reserva de valor.' },
    'interest rate': { impact: 'bearish', reasoning: 'Tasas altas -> Risk-off -> Salida de cripto.' },
  },
  forex: {
    'interest rate': { impact: 'bullish', reasoning: 'Subida de tasas del banco central -> Moneda sube.' },
    'rate hike': { impact: 'bullish', reasoning: 'Alza de tasas -> Diferencial favorable.' },
    'rate cut': { impact: 'bearish', reasoning: 'Baja de tasas -> Moneda se debilita.' },
    'inflation': { impact: 'bullish', reasoning: 'Inflacion alta puede forzar subida de tasas.' },
    'gdp': { impact: 'bullish', reasoning: 'PIB fuerte -> Economia solida -> Moneda sube.' },
    'unemployment': { impact: 'bearish', reasoning: 'Desempleo alto -> Economia debil -> Moneda baja.' },
    'nfp': { impact: 'bearish', reasoning: 'NFP fuerte -> USD sube -> Par EUR/USD baja.' },
    'cpi': { impact: 'bullish', reasoning: 'CPI alto -> Banco central puede subir tasas.' },
    'ecb': { impact: 'neutral', reasoning: 'BCE hawkish -> EUR sube. Dovish -> EUR baja.' },
    'boe': { impact: 'neutral', reasoning: 'BoE hawkish -> GBP sube. Dovish -> GBP baja.' },
  },
  stock: {
    'earnings': { impact: 'bullish', reasoning: 'Resultados superiores a expectativas -> Accion sube.' },
    'beat': { impact: 'bullish', reasoning: 'Superar estimaciones -> Rally post-earnings.' },
    'miss': { impact: 'bearish', reasoning: 'No alcanzar estimaciones -> Venta masiva.' },
    'buyback': { impact: 'bullish', reasoning: 'Recompra de acciones -> Precio sube.' },
    'layoff': { impact: 'bearish', reasoning: 'Despidos masivos -> Señal de problemas.' },
    'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> Tasas altas -> Valuaciones comprimen.' },
    'interest rate': { impact: 'bearish', reasoning: 'Tasas altas -> Costo de capital sube.' },
    'recession': { impact: 'bearish', reasoning: 'Recesion -> Menores ingresos corporativos.' },
    'ai': { impact: 'bullish', reasoning: 'Noticias de IA impulsan acciones tecnologicas.' },
  },
  commodity: {
    'opec': { impact: 'bullish', reasoning: 'OPEC recorta produccion -> Precio del petroleo sube.' },
    'supply': { impact: 'bearish', reasoning: 'Mayor oferta -> Precio de commodity baja.' },
    'demand': { impact: 'bullish', reasoning: 'Mayor demanda -> Precio de commodity sube.' },
    'china': { impact: 'bullish', reasoning: 'Demanda china de commodities es estructuralmente alta.' },
    'inflation': { impact: 'bullish', reasoning: 'Inflacion -> Commodities como cobertura suben.' },
    'dollar': { impact: 'bearish', reasoning: 'USD fuerte -> Commodities en USD se encarecen.' },
    'recession': { impact: 'bearish', reasoning: 'Recesion -> Menor demanda industrial.' },
  },
  index: {
    'fed ': { impact: 'bearish', reasoning: 'Fed hawkish -> Tasas altas -> Indices bajan.' },
    'rate cut': { impact: 'bullish', reasoning: 'Baja de tasas -> Liquidez -> Indices suben.' },
    'earnings': { impact: 'bullish', reasoning: 'Temporada de resultados positiva -> Indices suben.' },
    'recession': { impact: 'bearish', reasoning: 'Recesion -> Caida de indices.' },
    'inflation': { impact: 'bearish', reasoning: 'Inflacion alta -> Fed sube tasas -> Indices presionados.' },
    'gdp': { impact: 'bullish', reasoning: 'PIB fuerte -> Economia solida -> Indices suben.' },
    'tariff': { impact: 'bearish', reasoning: 'Aranceles -> Guerra comercial -> Indices bajan.' },
  },
};

function classifyNewsForAsset(text: string, assetType: AssetType): { impact: 'bullish' | 'bearish' | 'neutral'; reasoning: string } {
  const lower = text.toLowerCase();
  const keywords = FUNDAMENTAL_KEYWORDS[assetType] || FUNDAMENTAL_KEYWORDS.gold;
  for (const [kw, data] of Object.entries(keywords)) {
    if (lower.includes(kw)) return data;
  }
  return { impact: 'neutral', reasoning: 'Impacto indirecto. Monitorear reaccion del precio.' };
}

// ─── Technical calculations ───────────────────────────────────────────────────

function calcSMA(candles: Candle[], period: number): number {
  if (candles.length < period) return candles[0]?.close || 0;
  return candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
}

function calcEMA(candles: Candle[], period: number): number {
  if (candles.length < period) return candles[0]?.close || 0;
  const k = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  for (let i = period - 1; i >= 0; i--) {
    ema = candles[i].close * k + ema * (1 - k);
  }
  return parseFloat(ema.toFixed(6));
}

function calcRSI(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 50;
  const rev = [...candles].reverse();
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = rev[i].close - rev[i - 1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
}

function calcBollinger(candles: Candle[], period = 20): { upper: number; middle: number; lower: number; std: number } {
  if (candles.length < period) {
    const c = candles[0]?.close || 0;
    return { upper: c * 1.02, middle: c, lower: c * 0.98, std: c * 0.01 };
  }
  const slice = candles.slice(0, period);
  const mean = slice.reduce((s, c) => s + c.close, 0) / period;
  const variance = slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((mean + 2 * std).toFixed(6)),
    middle: parseFloat(mean.toFixed(6)),
    lower: parseFloat((mean - 2 * std).toFixed(6)),
    std: parseFloat(std.toFixed(6)),
  };
}

function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < period) return candles[0]?.close * 0.003 || 1;
  return candles.slice(0, period).reduce((s, c) => s + (c.high - c.low), 0) / period;
}

function calcVolumeRatio(candles: Candle[], period = 20): number {
  if (candles.length < period + 1) return 1;
  const avgVol = candles.slice(1, period + 1).reduce((s, c) => s + c.volume, 0) / period;
  if (avgVol === 0) return 1;
  return parseFloat((candles[0].volume / avgVol).toFixed(2));
}

// ─── Statistical Edge Reversion engine ───────────────────────────────────────
// Exact replication of the quant model:
// LONG:  price <= BB_Lower AND RSI < 30 AND Volume > 150% MA20 AND price > SMA20 * 0.95
// SHORT: price >= BB_Upper AND RSI > 70 AND Volume > 150% MA20 AND price < SMA20 * 1.05
// SL:    1.5 * ATR(14) from entry
// TP:    reversion to SMA20

function calcStatEdge(candles: Candle[], currentPrice: number): StatEdgeSignal {
  const sma20  = calcSMA(candles, 20);
  const bb     = calcBollinger(candles, 20);
  const rsi    = calcRSI(candles, 14);
  const atr    = calcATR(candles, 14);
  const volRatio = calcVolumeRatio(candles, 20);
  const ema20  = calcEMA(candles, 20);
  const ema50  = calcEMA(candles, 50);
  const ema200 = calcEMA(candles, 200);

  const dec = currentPrice < 10 ? 5 : currentPrice < 100 ? 4 : 2;
  const fmt = (v: number) => parseFloat(v.toFixed(dec));

  // Long conditions
  const longBBTouch    = currentPrice <= bb.lower;
  const longRSI        = rsi < 30;
  const longVolume     = volRatio > 1.5;
  const longNotFall    = currentPrice > sma20 * 0.95;

  // Short conditions
  const shortBBTouch   = currentPrice >= bb.upper;
  const shortRSI       = rsi > 70;
  const shortVolume    = volRatio > 1.5;
  const shortNotSpike  = currentPrice < sma20 * 1.05;

  const isLong  = longBBTouch  && longRSI  && longVolume  && longNotFall;
  const isShort = shortBBTouch && shortRSI && shortVolume && shortNotSpike;

  // Partial signals (2 of 3 main conditions) for confidence scoring
  const longPartial  = [longBBTouch, longRSI, longVolume].filter(Boolean).length;
  const shortPartial = [shortBBTouch, shortRSI, shortVolume].filter(Boolean).length;

  let bias: StatEdgeSignal['bias'] = 'neutral';
  let confidence = 0;
  let entry = currentPrice;
  let sl = 0;
  let tp = sma20;
  let description = '';
  let conditions = { bbTouch: false, rsiExtreme: false, volumeAnomaly: false, notFreefall: false };

  if (isLong) {
    bias = 'bullish';
    confidence = 90;
    sl = fmt(entry - 1.5 * atr);
    tp = fmt(sma20);
    description = 'SEÑAL LONG activa: precio en BB inferior + RSI sobreventa + volumen anomalo. Objetivo: reversion a SMA20.';
    conditions = { bbTouch: true, rsiExtreme: true, volumeAnomaly: true, notFreefall: true };
  } else if (isShort) {
    bias = 'bearish';
    confidence = 90;
    sl = fmt(entry + 1.5 * atr);
    tp = fmt(sma20);
    description = 'SEÑAL SHORT activa: precio en BB superior + RSI sobrecompra + volumen anomalo. Objetivo: reversion a SMA20.';
    conditions = { bbTouch: true, rsiExtreme: true, volumeAnomaly: true, notFreefall: true };
  } else if (longPartial >= 2) {
    bias = 'bullish';
    confidence = 40 + longPartial * 10;
    sl = fmt(entry - 1.5 * atr);
    tp = fmt(sma20);
    description = `Señal LONG parcial (${longPartial}/3 condiciones). Esperar confirmacion de volumen anomalo.`;
    conditions = { bbTouch: longBBTouch, rsiExtreme: longRSI, volumeAnomaly: longVolume, notFreefall: longNotFall };
  } else if (shortPartial >= 2) {
    bias = 'bearish';
    confidence = 40 + shortPartial * 10;
    sl = fmt(entry + 1.5 * atr);
    tp = fmt(sma20);
    description = `Señal SHORT parcial (${shortPartial}/3 condiciones). Esperar confirmacion de volumen anomalo.`;
    conditions = { bbTouch: shortBBTouch, rsiExtreme: shortRSI, volumeAnomaly: shortVolume, notFreefall: shortNotSpike };
  } else {
    description = 'Sin señal activa. Precio dentro de las bandas de Bollinger o sin confirmacion de volumen.';
    conditions = { bbTouch: longBBTouch || shortBBTouch, rsiExtreme: longRSI || shortRSI, volumeAnomaly: volRatio > 1.5, notFreefall: longNotFall };
  }

  const rrVal = sl > 0 ? Math.abs(tp - entry) / Math.abs(entry - sl) : 0;

  return {
    active: isLong || isShort,
    bias,
    confidence,
    entry: fmt(entry),
    sl: fmt(sl),
    tp: fmt(tp),
    rr: rrVal > 0 ? `1:${rrVal.toFixed(1)}` : 'N/A',
    conditions,
    indicators: {
      sma20: fmt(sma20),
      bbUpper: fmt(bb.upper),
      bbLower: fmt(bb.lower),
      rsi,
      atr: fmt(atr),
      volumeRatio: volRatio,
      ema20: fmt(ema20),
      ema50: fmt(ema50),
      ema200: fmt(ema200),
    },
    description,
  };
}

// ─── Order block detection ────────────────────────────────────────────────────

function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const obs: OrderBlock[] = [];
  const c = [...candles].reverse();
  for (let i = 1; i < c.length - 1; i++) {
    const prev = c[i - 1], curr = c[i], next = c[i + 1];
    const prevBull = prev.close > prev.open;
    const currBull = curr.close > curr.open;
    const nextBull = next.close > next.open;
    const avgBody = c.slice(Math.max(0, i - 10), i).reduce((s, x) => s + Math.abs(x.close - x.open), 0) / 10 || 1;
    const bodySize = Math.abs(curr.close - curr.open);
    const strength: OrderBlock['strength'] = bodySize > avgBody * 1.5 ? 'strong' : bodySize > avgBody ? 'moderate' : 'weak';
    if (prevBull && !currBull && nextBull) {
      obs.push({ type: 'bullish', price: (curr.high + curr.low) / 2, high: curr.high, low: curr.low, strength, description: `OB Alcista ${curr.low.toFixed(2)}-${curr.high.toFixed(2)}` });
    }
    if (!prevBull && currBull && !nextBull) {
      obs.push({ type: 'bearish', price: (curr.high + curr.low) / 2, high: curr.high, low: curr.low, strength, description: `OB Bajista ${curr.low.toFixed(2)}-${curr.high.toFixed(2)}` });
    }
  }
  return obs.slice(-3);
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCandles(symbol: string, timeframe: Timeframe, outputsize = 50): Promise<Candle[]> {
  try {
    const res = await axios.get('/api/twelve/time_series', {
      params: { symbol, interval: timeframe, outputsize, apikey: TWELVE_KEY, format: 'JSON' },
      timeout: 12000,
    });
    if (res.data?.values) {
      return res.data.values.map((v: Record<string, string>) => ({
        datetime: v.datetime,
        open: parseFloat(v.open), high: parseFloat(v.high),
        low: parseFloat(v.low), close: parseFloat(v.close),
        volume: parseFloat(v.volume || '0'),
      }));
    }
    return [];
  } catch { return []; }
}

async function fetchPrice(symbol: string): Promise<{ price: number; change: number; pct: number }> {
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
    const fallbacks: Record<string, number> = {
      'XAU/USD': 3320, 'BTC/USD': 67000, 'ETH/USD': 3500,
      'EUR/USD': 1.089, 'GBP/USD': 1.274, 'USD/JPY': 149.5,
      'AAPL': 195, 'TSLA': 248, 'NVDA': 875,
      'SPX': 5200, 'DJI': 39800, 'NDX': 18200,
      'XAG/USD': 29.5, 'WTI': 82,
    };
    return { price: fallbacks[symbol] || 100, change: 0, pct: 0 };
  }
}

async function fetchNews(query: string, assetType: AssetType): Promise<NewsEvent[]> {
  try {
    const res = await axios.get('/api/news/v2/everything', {
      params: { q: query, language: 'en', sortBy: 'publishedAt', pageSize: 10, apiKey: NEWS_KEY },
      timeout: 10000,
    });
    if (!res.data?.articles?.length) throw new Error('no articles');
    return res.data.articles
      .filter((a: Record<string, string>) => a.title && a.publishedAt)
      .slice(0, 8)
      .map((a: Record<string, string>) => {
        const classified = classifyNewsForAsset(a.title + ' ' + (a.description || ''), assetType);
        const pub = new Date(a.publishedAt);
        const timeLabel = pub.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ' ' +
          pub.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const titleLower = (a.title + ' ' + (a.description || '')).toLowerCase();
        const isHigh = ['fomc', 'fed ', 'nfp', 'cpi', 'interest rate', 'earnings', 'halving', 'rate decision', 'powell', 'inflation', 'gdp', 'payroll'].some(k => titleLower.includes(k));
        const isMed = ['gold', 'bitcoin', 'dollar', 'oil', 'china', 'tariff', 'unemployment', 'revenue'].some(k => titleLower.includes(k));
        return {
          time: timeLabel, currency: 'US',
          event: a.title.length > 85 ? a.title.slice(0, 85) + '...' : a.title,
          impact: isHigh ? 'high' : isMed ? 'medium' : 'low',
          actual: '', forecast: '', previous: '',
          assetImpact: classified.impact,
          reasoning: classified.reasoning,
          source: a.source?.name || '',
        } as NewsEvent;
      });
  } catch { return []; }
}

function calcKeyLevels(candles: Candle[], currentPrice: number) {
  if (candles.length < 6) {
    return {
      resistance: [1.01, 1.02, 1.03].map(m => parseFloat((currentPrice * m).toFixed(2))),
      support: [0.99, 0.98, 0.97].map(m => parseFloat((currentPrice * m).toFixed(2))),
      weeklyPivot: parseFloat(currentPrice.toFixed(2)),
    };
  }
  const highs = candles.map(c => c.high).sort((a, b) => b - a);
  const lows  = candles.map(c => c.low ).sort((a, b) => a - b);
  const pivot = (highs[0] + lows[0] + candles[0].close) / 3;
  return {
    resistance: [highs[0], highs[2], highs[5]].map(v => parseFloat(v.toFixed(2))),
    support:    [lows[0],  lows[2],  lows[5] ].map(v => parseFloat(v.toFixed(2))),
    weeklyPivot: parseFloat(pivot.toFixed(2)),
  };
}

// ─── GPT-4o analysis ──────────────────────────────────────────────────────────

async function runGPTAnalysis(params: {
  symbol: string; assetName: string; assetType: AssetType;
  currentPrice: number; candles1h: Candle[]; candles4h: Candle[]; candles1d: Candle[];
  ema20: number; ema50: number; ema200: number;
  newsEvents: NewsEvent[]; keyLevels: ReturnType<typeof calcKeyLevels>;
  topEdge: StatEdgeSignal | null;
}): Promise<{ bias: 'bullish' | 'bearish' | 'neutral'; strength: number; reasoning: string; marketContext: string; fundamentalSummary: string }> {
  const { symbol, assetName, assetType, currentPrice, candles1h, candles4h, candles1d, ema20, ema50, ema200, newsEvents, keyLevels, topEdge } = params;
  const fmt = (c: Candle) => `${c.datetime} O:${c.open.toFixed(4)} H:${c.high.toFixed(4)} L:${c.low.toFixed(4)} C:${c.close.toFixed(4)}`;

  const assetRules: Record<AssetType, string> = {
    gold: 'Sube con: inflacion, USD debil, crisis, geopolitica. Baja con: USD fuerte, tasas altas, risk-on.',
    crypto: 'Sube con: adopcion, halving, ETF, risk-on. Baja con: regulacion, tasas altas, risk-off.',
    forex: 'Diferencial de tasas de interes es el driver principal.',
    stock: 'Earnings, revenue, guidance y sector rotation son los drivers principales.',
    commodity: 'Oferta/demanda, USD, China y ciclo economico son los drivers principales.',
    index: 'Fed, earnings corporativos, PIB y sentimiento de mercado son los drivers principales.',
  };

  const edgeInfo = topEdge && topEdge.active
    ? `SEÑAL STAT EDGE ACTIVA: ${topEdge.bias.toUpperCase()} con ${topEdge.confidence}% confianza. ${topEdge.description}`
    : 'Sin señal Statistical Edge activa en este momento.';

  const prompt = `Eres un analista experto en ${symbol} (${assetName}). Analiza los datos y responde en JSON.

PRECIO ACTUAL: ${currentPrice.toFixed(4)}
TIPO DE ACTIVO: ${assetType}

EMAs:
EMA20: ${ema20} | EMA50: ${ema50} | EMA200: ${ema200}
Tendencia EMA: ${ema20 > ema50 && ema50 > ema200 ? 'ALCISTA (20>50>200)' : ema20 < ema50 && ema50 < ema200 ? 'BAJISTA (20<50<200)' : 'MIXTA'}

VELAS 1H (6 recientes):
${candles1h.slice(0, 6).map(fmt).join('\n')}

VELAS 4H (4 recientes):
${candles4h.slice(0, 4).map(fmt).join('\n')}

VELAS DIARIAS (3 recientes):
${candles1d.slice(0, 3).map(fmt).join('\n')}

NIVELES CLAVE:
Resistencias: ${keyLevels.resistance.join(' | ')}
Soportes: ${keyLevels.support.join(' | ')}
Pivot: ${keyLevels.weeklyPivot}

MODELO STATISTICAL EDGE REVERSION:
${edgeInfo}

NOTICIAS RECIENTES:
${newsEvents.slice(0, 5).map(e => `[${e.assetImpact.toUpperCase()}] ${e.event}`).join('\n')}

REGLAS PARA ${assetType.toUpperCase()}:
${assetRules[assetType]}

Responde SOLO este JSON:
{
  "bias": "bullish" | "bearish" | "neutral",
  "strength": 0-100,
  "reasoning": "4-5 oraciones: estructura de precio, EMAs, señal Statistical Edge y confluencias",
  "marketContext": "2-3 oraciones sobre contexto macro/fundamental actual",
  "fundamentalSummary": "2-3 oraciones sobre los drivers fundamentales mas importantes ahora mismo"
}`;

  try {
    const data = await openaiPost({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }, 30000);
    return parseModelJSON(data.choices[0].message.content);
  } catch {
    return { bias: 'neutral', strength: 50, reasoning: 'No se pudo conectar con la IA.', marketContext: 'Analisis no disponible.', fundamentalSummary: 'Analisis fundamental no disponible.' };
  }
}

// ─── Per-timeframe signal ─────────────────────────────────────────────────────

async function generateSignal(
  symbol: string, tf: Timeframe,
  currentPrice: number,
  overallBias: 'bullish' | 'bearish' | 'neutral',
  biasStrength: number
): Promise<TimeframeSignal> {
  const candles = await fetchCandles(symbol, tf, 50);
  const orderBlocks = candles.length > 3 ? detectOrderBlocks(candles) : [];
  const statEdge = candles.length >= 20 ? calcStatEdge(candles, currentPrice) : calcStatEdge(
    [{ datetime: '', open: currentPrice, high: currentPrice * 1.01, low: currentPrice * 0.99, close: currentPrice, volume: 0 }],
    currentPrice
  );

  const atr = candles.length >= 14
    ? candles.slice(0, 14).reduce((s, c) => s + (c.high - c.low), 0) / 14
    : currentPrice * 0.003;

  const multipliers: Record<Timeframe, number> = {
    '15min': 1, '30min': 1.5, '1h': 2, '2h': 2.5,
    '3h': 3, '4h': 3.5, '1day': 5, '1week': 8,
  };
  const mult = multipliers[tf];

  // Use StatEdge bias if active, otherwise use overall bias
  let localBias = statEdge.active ? statEdge.bias : overallBias;
  let localStrength = statEdge.active ? statEdge.confidence : biasStrength;

  // Adjust with recent candle momentum
  if (!statEdge.active && candles.length >= 5) {
    const bullCount = candles.slice(0, 5).filter(c => c.close > c.open).length;
    if (bullCount >= 4) { localBias = 'bullish'; localStrength = Math.min(100, biasStrength + 8); }
    else if (bullCount <= 1) { localBias = 'bearish'; localStrength = Math.min(100, biasStrength + 8); }
  }

  const isBull = localBias === 'bullish';
  const entry = currentPrice;
  const sl  = isBull ? entry - atr * mult       : entry + atr * mult;
  const tp1 = isBull ? entry + atr * mult * 1.5 : entry - atr * mult * 1.5;
  const tp2 = isBull ? entry + atr * mult * 3   : entry - atr * mult * 3;
  const rr  = (Math.abs(tp1 - entry) / Math.abs(entry - sl)).toFixed(1);

  const summaries = {
    bullish: `Sesgo alcista en ${TIMEFRAME_LABELS[tf]}. ${statEdge.active ? 'Señal Statistical Edge LONG activa.' : 'EMAs alineadas al alza.'}`,
    bearish: `Sesgo bajista en ${TIMEFRAME_LABELS[tf]}. ${statEdge.active ? 'Señal Statistical Edge SHORT activa.' : 'EMAs alineadas a la baja.'}`,
    neutral: `Sin sesgo claro en ${TIMEFRAME_LABELS[tf]}. Esperar confirmacion del modelo Statistical Edge.`,
  };

  return {
    timeframe: tf, label: TIMEFRAME_LABELS[tf],
    bias: localBias, strength: localStrength,
    entry: parseFloat(entry.toFixed(4)), sl: parseFloat(sl.toFixed(4)),
    tp1: parseFloat(tp1.toFixed(4)), tp2: parseFloat(tp2.toFixed(4)),
    rr: `1:${rr}`, orderBlocks, statEdge,
    summary: summaries[localBias],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeAsset(symbol: string): Promise<UniversalAnalysis> {
  const asset = ASSET_CATALOG[symbol] || { name: symbol, type: 'stock' as AssetType, twelveSymbol: symbol, newsQuery: symbol };

  const [priceData, candles1h, candles4h, candles1d, newsEvents] = await Promise.all([
    fetchPrice(asset.twelveSymbol),
    fetchCandles(asset.twelveSymbol, '1h', 50),
    fetchCandles(asset.twelveSymbol, '4h', 50),
    fetchCandles(asset.twelveSymbol, '1day', 50),
    fetchNews(asset.newsQuery, asset.type),
  ]);

  const { price: currentPrice, change, pct } = priceData;
  const keyLevels = calcKeyLevels(candles1d, currentPrice);

  // EMAs from 1h candles
  const ema20  = candles1h.length >= 20  ? calcEMA(candles1h, 20)  : currentPrice;
  const ema50  = candles1h.length >= 50  ? calcEMA(candles1h, 50)  : currentPrice;
  const ema200 = candles1h.length >= 200 ? calcEMA(candles1h, 200) : currentPrice;

  // Best StatEdge signal from daily candles (as per original model: daily timeframe)
  const dailyEdge = candles1d.length >= 20 ? calcStatEdge(candles1d, currentPrice) : null;

  const gpt = await runGPTAnalysis({
    symbol, assetName: asset.name, assetType: asset.type,
    currentPrice, candles1h, candles4h, candles1d,
    ema20, ema50, ema200,
    newsEvents, keyLevels,
    topEdge: dailyEdge,
  });

  const timeframes: Timeframe[] = ['15min', '30min', '1h', '2h', '3h', '4h', '1day', '1week'];
  const signals = await Promise.all(
    timeframes.map(tf => generateSignal(asset.twelveSymbol, tf, currentPrice, gpt.bias, gpt.strength))
  );

  // Best active StatEdge signal across all timeframes
  const activeEdges = signals.map(s => s.statEdge).filter(e => e.active);
  const topStatEdge = activeEdges.length > 0
    ? activeEdges.sort((a, b) => b.confidence - a.confidence)[0]
    : dailyEdge;

  return {
    symbol, assetType: asset.type, assetName: asset.name,
    timestamp: new Date().toISOString(),
    currentPrice, priceChange24h: change, priceChangePct: pct,
    overallBias: gpt.bias, biasStrength: gpt.strength,
    aiReasoning: gpt.reasoning, marketContext: gpt.marketContext,
    fundamentalSummary: gpt.fundamentalSummary,
    newsEvents, signals, keyLevels, topStatEdge,
  };
}

// Backward compat
export { analyzeAsset as analyzeGold };
export type { UniversalAnalysis as GoldAnalysis };
