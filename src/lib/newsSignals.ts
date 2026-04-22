import axios from 'axios';
import { openaiPost, parseModelJSON } from './openai';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const NEWS_KEY = import.meta.env.VITE_NEWS_API_KEY;

export type AssetType = 'gold' | 'crypto' | 'forex' | 'stock' | 'commodity' | 'index';

export type NewsSignal = {
  id: string;
  title: string;
  publishedAt: string;
  publishedTime: string; // Hora exacta formateada
  source: string;
  url: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  affectedAssets: string[]; // ['XAU/USD', 'USD/JPY', etc.]
  tradingSignal: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
    timing: 'IMMEDIATE' | 'WAIT_15MIN' | 'WAIT_30MIN' | 'WAIT_1H' | 'WAIT_CONFIRMATION';
    expectedMove: 'UP' | 'DOWN' | 'VOLATILE' | 'NEUTRAL';
    volatilityWarning: boolean;
    entryWindow: string; // "Próximos 15-30 minutos"
  };
  analysis: {
    summary: string; // Resumen de la noticia
    marketImpact: string; // Impacto esperado en el mercado
    reasoning: string; // Por qué genera esta señal
    keyFactors: string[]; // Factores clave a monitorear
    historicalContext: string; // Contexto histórico similar
  };
  priceTargets?: {
    shortTerm: { direction: 'up' | 'down'; percentage: number }; // Próximas 1-4 horas
    mediumTerm: { direction: 'up' | 'down'; percentage: number }; // Próximas 24 horas
  };
};

export type NewsSignalsResponse = {
  timestamp: string;
  asset: string;
  assetName: string;
  assetType: AssetType;
  currentPrice: number;
  signals: NewsSignal[];
  summary: {
    totalSignals: number;
    highImpact: number;
    bullishSignals: number;
    bearishSignals: number;
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    recommendedAction: string;
  };
};

// ─── Asset catalog ────────────────────────────────────────────────────────────

const ASSET_CATALOG: Record<string, { name: string; type: AssetType; newsQuery: string }> = {
  'XAU/USD': { name: 'Oro', type: 'gold', newsQuery: 'gold XAU "federal reserve" inflation CPI FOMC interest rate dollar' },
  'BTC/USD': { name: 'Bitcoin', type: 'crypto', newsQuery: 'bitcoin BTC crypto halving ETF regulation SEC adoption' },
  'ETH/USD': { name: 'Ethereum', type: 'crypto', newsQuery: 'ethereum ETH crypto DeFi regulation SEC upgrade' },
  'EUR/USD': { name: 'Euro / Dolar', type: 'forex', newsQuery: 'EUR/USD euro ECB "european central bank" interest rate inflation' },
  'GBP/USD': { name: 'Libra / Dolar', type: 'forex', newsQuery: 'GBP/USD pound "bank of england" BOE inflation UK interest rate' },
  'USD/JPY': { name: 'Dolar / Yen', type: 'forex', newsQuery: 'USD/JPY yen "bank of japan" BOJ intervention interest rate' },
  'AAPL': { name: 'Apple Inc.', type: 'stock', newsQuery: 'Apple AAPL earnings revenue iPhone quarterly results stock' },
  'TSLA': { name: 'Tesla Inc.', type: 'stock', newsQuery: 'Tesla TSLA earnings deliveries Elon Musk EV stock' },
  'NVDA': { name: 'NVIDIA', type: 'stock', newsQuery: 'NVIDIA NVDA earnings AI chips GPU data center stock' },
  'SPX': { name: 'S&P 500', type: 'index', newsQuery: 'S&P 500 SPX stock market Fed interest rates economy index' },
  'DJI': { name: 'Dow Jones', type: 'index', newsQuery: 'Dow Jones DJI stock market economy earnings index' },
  'NDX': { name: 'Nasdaq 100', type: 'index', newsQuery: 'Nasdaq 100 NDX tech stocks Fed interest rates index' },
  'XAG/USD': { name: 'Plata', type: 'commodity', newsQuery: 'silver XAG gold inflation industrial demand commodity' },
  'WTI': { name: 'Petroleo WTI', type: 'commodity', newsQuery: 'oil WTI crude OPEC production supply demand commodity' },
};

// ─── Fetch news from API ──────────────────────────────────────────────────────

async function fetchRecentNews(query: string): Promise<any[]> {
  try {
    const res = await axios.get('/api/news/v2/everything', {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: NEWS_KEY,
      },
      timeout: 15000,
    });

    if (!res.data?.articles?.length) return [];

    // Filter last 24 hours only
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    return res.data.articles
      .filter((a: any) => {
        if (!a.title || !a.publishedAt) return false;
        const pubTime = new Date(a.publishedAt).getTime();
        return pubTime >= oneDayAgo;
      })
      .slice(0, 15);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// ─── GPT-4o analysis for news signals ─────────────────────────────────────────

async function analyzeNewsWithGPT(
  articles: any[],
  asset: string,
  assetName: string,
  assetType: AssetType,
  currentPrice: number
): Promise<NewsSignal[]> {
  if (articles.length === 0) return [];

  const articlesText = articles
    .map((a, i) => {
      const pub = new Date(a.publishedAt);
      const timeStr = pub.toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${i + 1}] ${timeStr} | ${a.source?.name || 'Unknown'} | ${a.title}\n${a.description || ''}`;
    })
    .join('\n\n');

  const assetRules: Record<AssetType, string> = {
    gold: `
REGLAS PARA ORO (XAU/USD):
- ALCISTA: Inflación alta, USD débil, crisis geopolítica, tasas de interés bajas, recesión, safe haven demand
- BAJISTA: USD fuerte, tasas de interés altas, Fed hawkish, NFP fuerte, risk-on sentiment, economía fuerte
- ALTA VOLATILIDAD: FOMC meetings, CPI/PPI releases, NFP, Powell speeches, crisis geopolíticas
- TIMING: Noticias de Fed/inflación → impacto inmediato. Geopolítica → esperar confirmación de precio.
`,
    crypto: `
REGLAS PARA CRYPTO:
- ALCISTA: Aprobación ETF, adopción institucional, halving, regulación favorable, risk-on, inflación
- BAJISTA: Regulación negativa (SEC), hackeos, prohibiciones, Fed hawkish, tasas altas, risk-off
- ALTA VOLATILIDAD: Anuncios regulatorios, hackeos de exchanges, adopción institucional grande
- TIMING: Noticias regulatorias → esperar 15-30min para dirección. Adopción → impacto gradual.
`,
    forex: `
REGLAS PARA FOREX:
- ALCISTA (moneda base): Subida de tasas del banco central, inflación alta, PIB fuerte, empleo fuerte
- BAJISTA (moneda base): Baja de tasas, economía débil, desempleo alto, banco central dovish
- ALTA VOLATILIDAD: Decisiones de tasas de interés, NFP, CPI, discursos de bancos centrales
- TIMING: Decisiones de tasas → impacto inmediato. Datos económicos → esperar confirmación.
`,
    stock: `
REGLAS PARA ACCIONES:
- ALCISTA: Earnings beat, revenue growth, guidance positiva, buybacks, innovación, sector strength
- BAJISTA: Earnings miss, guidance negativa, layoffs, competencia, regulación negativa
- ALTA VOLATILIDAD: Earnings releases, FDA approvals, fusiones/adquisiciones, cambios de CEO
- TIMING: Earnings → esperar 15-30min post-release. Guidance → impacto inmediato.
`,
    commodity: `
REGLAS PARA COMMODITIES:
- ALCISTA: Recortes de producción (OPEC), demanda china fuerte, USD débil, inflación, crisis de supply
- BAJISTA: Aumento de producción, demanda débil, USD fuerte, recesión, inventarios altos
- ALTA VOLATILIDAD: Reuniones OPEC, datos de inventarios, crisis geopolíticas, China data
- TIMING: OPEC decisions → impacto inmediato. Inventarios → esperar confirmación.
`,
    index: `
REGLAS PARA ÍNDICES:
- ALCISTA: Fed dovish, baja de tasas, earnings season positiva, PIB fuerte, estímulos
- BAJISTA: Fed hawkish, subida de tasas, earnings débiles, recesión, crisis geopolítica
- ALTA VOLATILIDAD: FOMC meetings, earnings season, crisis bancarias, datos de empleo
- TIMING: Fed decisions → impacto inmediato. Earnings → esperar tendencia general.
`,
  };

  const prompt = `Eres un analista de noticias financieras experto. Analiza estas noticias recientes sobre ${assetName} (${asset}) y genera señales de trading PRECISAS.

ACTIVO: ${asset} (${assetName})
TIPO: ${assetType}
PRECIO ACTUAL: ${currentPrice}

${assetRules[assetType]}

NOTICIAS RECIENTES (últimas 24 horas):
${articlesText}

Para CADA noticia relevante, genera una señal de trading. Responde SOLO en JSON:

{
  "signals": [
    {
      "id": "índice de la noticia (1, 2, 3...)",
      "title": "título de la noticia",
      "publishedAt": "fecha ISO original",
      "publishedTime": "hora exacta formateada (ej: '15 Abr, 14:30')",
      "source": "fuente",
      "impact": "high" | "medium" | "low",
      "sentiment": "bullish" | "bearish" | "neutral",
      "confidence": número 0-100,
      "affectedAssets": ["lista de activos afectados"],
      "tradingSignal": {
        "action": "BUY" | "SELL" | "HOLD" | "WAIT",
        "timing": "IMMEDIATE" | "WAIT_15MIN" | "WAIT_30MIN" | "WAIT_1H" | "WAIT_CONFIRMATION",
        "expectedMove": "UP" | "DOWN" | "VOLATILE" | "NEUTRAL",
        "volatilityWarning": true/false,
        "entryWindow": "descripción del timing (ej: 'Próximos 15-30 minutos')"
      },
      "analysis": {
        "summary": "resumen de la noticia en 1-2 oraciones",
        "marketImpact": "impacto esperado en el mercado",
        "reasoning": "por qué genera esta señal específica",
        "keyFactors": ["factor 1", "factor 2", "factor 3"],
        "historicalContext": "contexto histórico de eventos similares"
      },
      "priceTargets": {
        "shortTerm": { "direction": "up" | "down", "percentage": número },
        "mediumTerm": { "direction": "up" | "down", "percentage": número }
      }
    }
  ]
}

REGLAS CRÍTICAS:
1. Solo incluye noticias que REALMENTE impactan al activo ${asset}
2. Sé PRECISO con el timing - usa las reglas del tipo de activo
3. confidence debe reflejar qué tan clara es la señal (eventos de alta volatilidad = alta confidence)
4. Si la noticia no es relevante para trading, NO la incluyas
5. priceTargets debe ser realista basado en volatilidad histórica del activo
6. publishedTime debe ser la hora EXACTA de publicación en formato legible
7. affectedAssets debe incluir TODOS los activos relacionados que se verán afectados
8. keyFactors debe incluir los 3 factores MÁS IMPORTANTES a monitorear
9. Si la noticia requiere esperar confirmación de precio, usa timing: "WAIT_CONFIRMATION"
10. volatilityWarning = true solo para eventos de ALTA volatilidad (FOMC, NFP, earnings, etc.)`;

  try {
    const data = await openaiPost({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }, 45000);

    const parsed = parseModelJSON(data.choices[0].message.content);
    return parsed.signals || [];
  } catch (error) {
    console.error('Error analyzing news with GPT:', error);
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeNewsSignals(
  symbol: string,
  currentPrice?: number
): Promise<NewsSignalsResponse> {
  const asset = ASSET_CATALOG[symbol] || {
    name: symbol,
    type: 'stock' as AssetType,
    newsQuery: symbol,
  };

  // Fetch recent news
  const articles = await fetchRecentNews(asset.newsQuery);

  // Use provided price or fallback
  const price = currentPrice || 0;

  // Analyze with GPT
  const signals = await analyzeNewsWithGPT(
    articles,
    symbol,
    asset.name,
    asset.type,
    price
  );

  // Calculate summary
  const highImpact = signals.filter((s) => s.impact === 'high').length;
  const bullishSignals = signals.filter((s) => s.sentiment === 'bullish').length;
  const bearishSignals = signals.filter((s) => s.sentiment === 'bearish').length;

  let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bullishSignals > bearishSignals * 1.5) overallSentiment = 'bullish';
  else if (bearishSignals > bullishSignals * 1.5) overallSentiment = 'bearish';

  const recommendedAction =
    overallSentiment === 'bullish'
      ? `Sesgo alcista detectado. ${highImpact} señales de alto impacto. Considerar posiciones LONG con confirmación de precio.`
      : overallSentiment === 'bearish'
      ? `Sesgo bajista detectado. ${highImpact} señales de alto impacto. Considerar posiciones SHORT con confirmación de precio.`
      : `Sentimiento mixto. ${highImpact} señales de alto impacto. Esperar mayor claridad antes de entrar.`;

  return {
    timestamp: new Date().toISOString(),
    asset: symbol,
    assetName: asset.name,
    assetType: asset.type,
    currentPrice: price,
    signals: signals.sort((a, b) => {
      // Sort by: high impact first, then by time (most recent first)
      if (a.impact === 'high' && b.impact !== 'high') return -1;
      if (b.impact === 'high' && a.impact !== 'high') return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }),
    summary: {
      totalSignals: signals.length,
      highImpact,
      bullishSignals,
      bearishSignals,
      overallSentiment,
      recommendedAction,
    },
  };
}
