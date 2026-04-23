import axios from 'axios';
import { openaiPost, parseModelJSON } from './openai';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const NEWS_KEY   = import.meta.env.VITE_NEWS_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Timeframe = '15min' | '30min' | '1h' | '2h' | '3h' | '4h' | '1day' | '1week';

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

export interface EconomicEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual: string;
  forecast: string;
  previous: string;
  goldImpact: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  source?: string;
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
  summary: string;
}

export interface GoldAnalysis {
  timestamp: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePct: number;
  overallBias: 'bullish' | 'bearish' | 'neutral';
  biasStrength: number;
  aiReasoning: string;
  economicEvents: EconomicEvent[];
  signals: TimeframeSignal[];
  keyLevels: {
    support: number[];
    resistance: number[];
    weeklyPivot: number;
  };
  marketContext: string;
}

// ─── Timeframe labels ─────────────────────────────────────────────────────────

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15min': '15 Min',
  '30min': '30 Min',
  '1h':    '1 Hora',
  '2h':    '2 Horas',
  '3h':    '3 Horas',
  '4h':    '4 Horas',
  '1day':  'Diario',
  '1week': 'Semanal',
};

// ─── Fetch candles ────────────────────────────────────────────────────────────

async function fetchCandles(timeframe: Timeframe, outputsize = 50): Promise<Candle[]> {
  try {
    const res = await axios.get('/api/twelve/time_series', {
      params: {
        symbol: 'XAU/USD',
        interval: timeframe,
        outputsize,
        apikey: TWELVE_KEY,
        format: 'JSON',
      },
      timeout: 12000,
    });
    if (res.data?.values) {
      return res.data.values.map((v: Record<string, string>) => ({
        datetime: v.datetime,
        open:   parseFloat(v.open),
        high:   parseFloat(v.high),
        low:    parseFloat(v.low),
        close:  parseFloat(v.close),
        volume: parseFloat(v.volume || '0'),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Fetch current price ──────────────────────────────────────────────────────

async function fetchCurrentPrice(): Promise<{ price: number; change: number; pct: number }> {
  try {
    const [priceRes, quoteRes] = await Promise.all([
      axios.get('/api/twelve/price', {
        params: { symbol: 'XAU/USD', apikey: TWELVE_KEY },
        timeout: 8000,
      }),
      axios.get('/api/twelve/quote', {
        params: { symbol: 'XAU/USD', apikey: TWELVE_KEY },
        timeout: 8000,
      }),
    ]);
    const price  = parseFloat(priceRes.data?.price  || '0');
    const change = parseFloat(quoteRes.data?.change  || '0');
    const pct    = parseFloat(quoteRes.data?.percent_change || '0');
    if (price > 0) return { price, change, pct };
    throw new Error('invalid price');
  } catch {
    return { price: 3320.5, change: 12.3, pct: 0.37 };
  }
}

// ─── Detect Order Blocks ──────────────────────────────────────────────────────
// Bullish OB : green → RED (OB) → green
// Bearish OB : red  → GREEN (OB) → red

function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const obs: OrderBlock[] = [];
  const c = [...candles].reverse(); // oldest → newest

  for (let i = 1; i < c.length - 1; i++) {
    const prev = c[i - 1];
    const curr = c[i];
    const next = c[i + 1];

    const prevBull = prev.close > prev.open;
    const currBull = curr.close > curr.open;
    const nextBull = next.close > next.open;

    const avgBody = c
      .slice(Math.max(0, i - 10), i)
      .reduce((s, x) => s + Math.abs(x.close - x.open), 0) / 10 || 1;
    const bodySize = Math.abs(curr.close - curr.open);
    const strength: OrderBlock['strength'] =
      bodySize > avgBody * 1.5 ? 'strong' : bodySize > avgBody ? 'moderate' : 'weak';

    // Bullish OB
    if (prevBull && !currBull && nextBull) {
      obs.push({
        type: 'bullish',
        price: (curr.high + curr.low) / 2,
        high: curr.high,
        low:  curr.low,
        strength,
        description: `OB Alcista ${curr.low.toFixed(2)}–${curr.high.toFixed(2)}`,
      });
    }

    // Bearish OB
    if (!prevBull && currBull && !nextBull) {
      obs.push({
        type: 'bearish',
        price: (curr.high + curr.low) / 2,
        high: curr.high,
        low:  curr.low,
        strength,
        description: `OB Bajista ${curr.low.toFixed(2)}–${curr.high.toFixed(2)}`,
      });
    }
  }

  return obs.slice(-3);
}

// ─── Key levels ───────────────────────────────────────────────────────────────

function calcKeyLevels(candles: Candle[], currentPrice: number) {
  if (candles.length < 6) {
    return {
      resistance: [currentPrice * 1.01, currentPrice * 1.02, currentPrice * 1.03].map(v => parseFloat(v.toFixed(2))),
      support:    [currentPrice * 0.99, currentPrice * 0.98, currentPrice * 0.97].map(v => parseFloat(v.toFixed(2))),
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

// ─── Gold impact classifier ───────────────────────────────────────────────────

const GOLD_KEYWORDS: Record<string, { impact: EconomicEvent['goldImpact']; reasoning: string }> = {
  'nfp':              { impact: 'bearish', reasoning: 'NFP fuerte → USD sube → Oro baja. NFP débil → Oro sube.' },
  'non-farm':         { impact: 'bearish', reasoning: 'Empleo fuerte presiona al oro a la baja.' },
  'payroll':          { impact: 'bearish', reasoning: 'Nóminas fuertes fortalecen el USD, presionan el oro.' },
  'cpi':              { impact: 'bullish', reasoning: 'Inflación alta → Oro como cobertura sube.' },
  'inflation':        { impact: 'bullish', reasoning: 'Mayor inflación beneficia al oro como activo refugio.' },
  'inflación':        { impact: 'bullish', reasoning: 'Mayor inflación beneficia al oro como activo refugio.' },
  'pce':              { impact: 'bullish', reasoning: 'PCE alto confirma inflación → Oro sube.' },
  'fed ':             { impact: 'bearish', reasoning: 'Fed hawkish → USD fuerte → Oro presionado.' },
  'fomc':             { impact: 'bearish', reasoning: 'FOMC hawkish presiona al oro. Dovish lo impulsa.' },
  'interest rate':    { impact: 'bearish', reasoning: 'Subida de tasas → USD sube → Oro baja.' },
  'rate decision':    { impact: 'bearish', reasoning: 'Decisión de tasas: hawkish pesa sobre el oro.' },
  'gdp':              { impact: 'bearish', reasoning: 'PIB fuerte → Risk-on → Oro pierde atractivo.' },
  'pib':              { impact: 'bearish', reasoning: 'PIB fuerte → Risk-on → Oro pierde atractivo.' },
  'unemployment':     { impact: 'bullish', reasoning: 'Desempleo alto → Economía débil → Oro sube.' },
  'jobless':          { impact: 'bullish', reasoning: 'Peticiones de desempleo altas → Oro sube.' },
  'desempleo':        { impact: 'bullish', reasoning: 'Desempleo alto → Economía débil → Oro sube.' },
  'geopolit':         { impact: 'bullish', reasoning: 'Tensiones geopolíticas impulsan al oro como refugio.' },
  'war':              { impact: 'bullish', reasoning: 'Conflictos bélicos → Refugio en oro.' },
  'guerra':           { impact: 'bullish', reasoning: 'Conflictos bélicos → Refugio en oro.' },
  'dollar':           { impact: 'bearish', reasoning: 'USD fuerte es inversamente correlacionado con el oro.' },
  'dxy':              { impact: 'bearish', reasoning: 'DXY al alza presiona al oro.' },
  'oil':              { impact: 'bullish', reasoning: 'Petróleo alto → Inflación → Oro sube.' },
  'petróleo':         { impact: 'bullish', reasoning: 'Petróleo alto → Inflación → Oro sube.' },
  'china':            { impact: 'bullish', reasoning: 'Demanda china de oro es estructuralmente alcista.' },
  'ism':              { impact: 'bearish', reasoning: 'ISM manufacturero fuerte → Risk-on → Oro baja.' },
  'retail sales':     { impact: 'bearish', reasoning: 'Ventas minoristas fuertes → USD sube → Oro baja.' },
  'gold':             { impact: 'bullish', reasoning: 'Noticia directamente relacionada con el oro.' },
  'oro':              { impact: 'bullish', reasoning: 'Noticia directamente relacionada con el oro.' },
  'safe haven':       { impact: 'bullish', reasoning: 'Demanda de activos refugio beneficia al oro.' },
  'recession':        { impact: 'bullish', reasoning: 'Riesgo de recesión impulsa la demanda de oro.' },
  'recesión':         { impact: 'bullish', reasoning: 'Riesgo de recesión impulsa la demanda de oro.' },
  'bank':             { impact: 'bullish', reasoning: 'Incertidumbre bancaria → Refugio en oro.' },
  'crisis':           { impact: 'bullish', reasoning: 'Crisis financiera → Demanda de oro como refugio.' },
  'tariff':           { impact: 'bullish', reasoning: 'Aranceles → Incertidumbre comercial → Oro sube.' },
  'arancel':          { impact: 'bullish', reasoning: 'Aranceles → Incertidumbre comercial → Oro sube.' },
  'trump':            { impact: 'bullish', reasoning: 'Incertidumbre política → Demanda de refugio en oro.' },
  'powell':           { impact: 'bearish', reasoning: 'Declaraciones hawkish de Powell presionan al oro.' },
};

function classifyForGold(text: string): { impact: EconomicEvent['goldImpact']; reasoning: string } {
  const lower = text.toLowerCase();
  for (const [kw, data] of Object.entries(GOLD_KEYWORDS)) {
    if (lower.includes(kw)) return data;
  }
  return { impact: 'neutral', reasoning: 'Impacto indirecto en el oro. Monitorear reacción del USD.' };
}

// ─── Fetch real news from NewsAPI ─────────────────────────────────────────────

async function fetchNewsEvents(): Promise<EconomicEvent[]> {
  try {
    // NewsAPI everything endpoint — gold + macro keywords
    const res = await axios.get('/api/news/v2/everything', {
      params: {
        q: 'gold XAU OR "federal reserve" OR "interest rates" OR inflation OR NFP OR "US dollar" OR FOMC OR CPI',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 15,
        apiKey: NEWS_KEY,
      },
      timeout: 10000,
    });

    if (!res.data?.articles?.length) throw new Error('no articles');

    const events: EconomicEvent[] = res.data.articles
      .filter((a: Record<string, string>) => a.title && a.publishedAt)
      .slice(0, 10)
      .map((a: Record<string, string>) => {
        const classified = classifyForGold(a.title + ' ' + (a.description || ''));
        const pub = new Date(a.publishedAt);
        const timeLabel = pub.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
          ' ' + pub.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        // Determine impact level from keywords
        const titleLower = (a.title + ' ' + (a.description || '')).toLowerCase();
        const isHigh = ['fomc', 'fed ', 'nfp', 'cpi', 'interest rate', 'rate decision', 'powell', 'inflation', 'gdp', 'payroll'].some(k => titleLower.includes(k));
        const isMed  = ['gold', 'dollar', 'dxy', 'oil', 'china', 'tariff', 'unemployment'].some(k => titleLower.includes(k));

        return {
          time: timeLabel,
          currency: 'US',
          event: a.title.length > 80 ? a.title.slice(0, 80) + '…' : a.title,
          impact: isHigh ? 'high' : isMed ? 'medium' : 'low',
          actual: '',
          forecast: '',
          previous: '',
          goldImpact: classified.impact,
          reasoning: classified.reasoning,
          source: a.source?.name || '',
        } as EconomicEvent;
      });

    return events;
  } catch {
    // Fallback to curated events if NewsAPI fails
    return getFallbackEvents();
  }
}

function getFallbackEvents(): EconomicEvent[] {
  return [
    { time: 'Hoy', currency: 'US', event: 'Nuevas Peticiones de Subsidio por Desempleo', impact: 'high', actual: '213K', forecast: '219K', previous: '223K', goldImpact: 'bullish', reasoning: 'Desempleo alto → Economía débil → Oro sube.' },
    { time: 'Hoy', currency: 'US', event: 'Índice ISM Manufacturero', impact: 'high', actual: '', forecast: '48.5', previous: '49.0', goldImpact: 'bearish', reasoning: 'ISM manufacturero fuerte → Risk-on → Oro baja.' },
    { time: 'Mañana', currency: 'US', event: 'NFP (Nóminas No Agrícolas)', impact: 'high', actual: '', forecast: '185K', previous: '228K', goldImpact: 'bearish', reasoning: 'NFP fuerte → USD sube → Oro baja.' },
    { time: 'Mañana', currency: 'US', event: 'Tasa de Desempleo', impact: 'high', actual: '', forecast: '4.1%', previous: '4.2%', goldImpact: 'bullish', reasoning: 'Desempleo alto → Economía débil → Oro sube.' },
    { time: 'Próx. semana', currency: 'US', event: 'CPI (Índice de Precios al Consumidor)', impact: 'high', actual: '', forecast: '3.2%', previous: '3.5%', goldImpact: 'bullish', reasoning: 'Inflación alta → Oro como cobertura sube.' },
    { time: 'Próx. semana', currency: 'US', event: 'Decisión de Tasas FOMC', impact: 'high', actual: '', forecast: 'Sin cambio', previous: '5.25-5.50%', goldImpact: 'bearish', reasoning: 'FOMC hawkish presiona al oro. Dovish lo impulsa.' },
  ];
}

// ─── GPT-4o analysis ──────────────────────────────────────────────────────────

async function runGPTAnalysis(params: {
  currentPrice: number;
  candles1h: Candle[];
  candles4h: Candle[];
  candles1d: Candle[];
  orderBlocks1h: OrderBlock[];
  orderBlocks4h: OrderBlock[];
  economicEvents: EconomicEvent[];
  keyLevels: ReturnType<typeof calcKeyLevels>;
}): Promise<{ bias: 'bullish' | 'bearish' | 'neutral'; strength: number; reasoning: string; marketContext: string }> {
  const { currentPrice, candles1h, candles4h, candles1d, orderBlocks1h, orderBlocks4h, economicEvents, keyLevels } = params;

  const fmt = (c: Candle) => `${c.datetime} O:${c.open.toFixed(2)} H:${c.high.toFixed(2)} L:${c.low.toFixed(2)} C:${c.close.toFixed(2)}`;

  const prompt = `Eres un analista experto en XAU/USD (Oro Spot). Analiza los datos y responde en JSON.

PRECIO ACTUAL: $${currentPrice.toFixed(2)}

VELAS 1H (10 más recientes, [0]=más reciente):
${candles1h.slice(0, 10).map(fmt).join('\n')}

VELAS 4H (6 más recientes):
${candles4h.slice(0, 6).map(fmt).join('\n')}

VELAS DIARIAS (5 más recientes):
${candles1d.slice(0, 5).map(fmt).join('\n')}

ORDER BLOCKS DETECTADOS:
${[...orderBlocks1h, ...orderBlocks4h].map(ob =>
  `${ob.type === 'bullish' ? '🟢 OB Alcista' : '🔴 OB Bajista'} zona $${ob.low.toFixed(2)}-$${ob.high.toFixed(2)} fuerza:${ob.strength}`
).join('\n') || 'Ninguno detectado'}

NIVELES CLAVE:
Resistencias: ${keyLevels.resistance.join(' | ')}
Soportes: ${keyLevels.support.join(' | ')}
Pivot Semanal: ${keyLevels.weeklyPivot}

NOTICIAS/EVENTOS RECIENTES (impacto en oro):
${economicEvents.slice(0, 8).map(e =>
  `[${e.goldImpact.toUpperCase()}] ${e.event} — ${e.reasoning}`
).join('\n')}

REGLAS DE ANÁLISIS XAU/USD:
- Oro sube con: inflación alta, USD débil, incertidumbre geopolítica, tasas reales negativas, crisis
- Oro baja con: USD fuerte, tasas altas, datos económicos EEUU fuertes, risk-on
- OB Alcista = patrón vela verde→roja→verde (la roja es el OB, zona de demanda)
- OB Bajista = patrón vela roja→verde→roja (la verde es el OB, zona de oferta)
- Analiza confluencia entre estructura de precio, OBs y noticias

Responde SOLO este JSON:
{
  "bias": "bullish" | "bearish" | "neutral",
  "strength": 0-100,
  "reasoning": "3-4 oraciones explicando el sesgo actual con referencia a OBs, niveles y noticias",
  "marketContext": "2-3 oraciones sobre el contexto macro actual del oro"
}`;

  try {
    const data = await openaiPost({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 600,
    }, 30000);
    return parseModelJSON(data.choices[0].message.content);
  } catch (err) {
    console.error('GPT error:', err);
    return {
      bias: 'neutral',
      strength: 50,
      reasoning: 'No se pudo conectar con el análisis de IA. Verifica tu conexión a internet.',
      marketContext: 'Análisis de IA no disponible temporalmente.',
    };
  }
}

// ─── Per-timeframe signal ─────────────────────────────────────────────────────

async function generateTimeframeSignal(
  tf: Timeframe,
  currentPrice: number,
  overallBias: 'bullish' | 'bearish' | 'neutral',
  biasStrength: number,
): Promise<TimeframeSignal> {
  const candles = await fetchCandles(tf, 50);
  const orderBlocks = candles.length > 3 ? detectOrderBlocks(candles) : [];

  // ATR from last 14 candles
  const atr = candles.length >= 14
    ? candles.slice(0, 14).reduce((s, c) => s + (c.high - c.low), 0) / 14
    : currentPrice * 0.003;

  const multipliers: Record<Timeframe, number> = {
    '15min': 1, '30min': 1.5, '1h': 2, '2h': 2.5,
    '3h': 3, '4h': 3.5, '1day': 5, '1week': 8,
  };
  const mult = multipliers[tf];

  // Local bias from recent candles
  let localBias = overallBias;
  let localStrength = biasStrength;
  if (candles.length >= 5) {
    const bullCount = candles.slice(0, 5).filter(c => c.close > c.open).length;
    if (bullCount >= 4)      { localBias = 'bullish'; localStrength = Math.min(100, biasStrength + 8); }
    else if (bullCount <= 1) { localBias = 'bearish'; localStrength = Math.min(100, biasStrength + 8); }
  }

  const isBull = localBias === 'bullish';
  const entry = currentPrice;
  const sl  = isBull ? entry - atr * mult       : entry + atr * mult;
  const tp1 = isBull ? entry + atr * mult * 1.5 : entry - atr * mult * 1.5;
  const tp2 = isBull ? entry + atr * mult * 3   : entry - atr * mult * 3;
  const rr  = (Math.abs(tp1 - entry) / Math.abs(entry - sl)).toFixed(1);

  const summaries = {
    bullish: `Sesgo alcista en ${TIMEFRAME_LABELS[tf]}. Buscar entradas en retrocesos a OBs alcistas con confirmación de vela.`,
    bearish: `Sesgo bajista en ${TIMEFRAME_LABELS[tf]}. Buscar ventas en rebotes a OBs bajistas con confirmación de vela.`,
    neutral: `Sin sesgo claro en ${TIMEFRAME_LABELS[tf]}. Esperar ruptura de rango o confirmación de dirección.`,
  };

  return {
    timeframe: tf,
    label: TIMEFRAME_LABELS[tf],
    bias: localBias,
    strength: localStrength,
    entry: parseFloat(entry.toFixed(2)),
    sl:    parseFloat(sl.toFixed(2)),
    tp1:   parseFloat(tp1.toFixed(2)),
    tp2:   parseFloat(tp2.toFixed(2)),
    rr:    `1:${rr}`,
    orderBlocks,
    summary: summaries[localBias],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeGold(): Promise<GoldAnalysis> {
  // Fetch everything in parallel
  const [priceData, candles1h, candles4h, candles1d, candles1w, economicEvents] = await Promise.all([
    fetchCurrentPrice(),
    fetchCandles('1h',   50),
    fetchCandles('4h',   50),
    fetchCandles('1day', 30),
    fetchCandles('1week', 20),
    fetchNewsEvents(),
  ]);

  const { price: currentPrice, change, pct } = priceData;

  const ob1h = candles1h.length > 3 ? detectOrderBlocks(candles1h) : [];
  const ob4h = candles4h.length > 3 ? detectOrderBlocks(candles4h) : [];

  const keyLevels = calcKeyLevels(candles1d, currentPrice);

  // GPT-4o reasoning
  const gpt = await runGPTAnalysis({
    currentPrice, candles1h, candles4h, candles1d,
    orderBlocks1h: ob1h, orderBlocks4h: ob4h,
    economicEvents, keyLevels,
  });

  // Signals for all 8 timeframes
  const timeframes: Timeframe[] = ['15min', '30min', '1h', '2h', '3h', '4h', '1day', '1week'];
  const signals = await Promise.all(
    timeframes.map(tf => generateTimeframeSignal(tf, currentPrice, gpt.bias, gpt.strength))
  );

  return {
    timestamp: new Date().toISOString(),
    currentPrice,
    priceChange24h: change,
    priceChangePct: pct,
    overallBias: gpt.bias,
    biasStrength: gpt.strength,
    aiReasoning: gpt.reasoning,
    economicEvents,
    signals,
    keyLevels,
    marketContext: gpt.marketContext,
  };
}
