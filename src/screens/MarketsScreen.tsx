import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, TrendingDown, RefreshCw, Clock, Zap, ChevronDown, ChevronUp, Target, Shield, Activity, BarChart2, Newspaper } from 'lucide-react';
import { runQuantAnalysis, type QuantAnalysis, type LogAnomalySignal, runLogAnomalyModel, fetchQuantCandles } from '@/lib/quantModel';
import axios from 'axios';
import { analyzeAsset, type UniversalAnalysis, type TimeframeSignal, ASSET_CATALOG } from '@/lib/universalAnalysis';
import { useStore } from '@/store/useStore';

const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ─── Asset catalog ────────────────────────────────────────────────────────────

const MARKETS = [
  // Indices
  { symbol: 'SPX',      display: 'SP500',  name: 'S&P 500',       price: 5200.00,  change: 0.65,  tv: 'FOREXCOM:SPXUSD',  category: 'Indices',     isIndex: true  },
  { symbol: 'DJI',      display: 'US30',   name: 'Dow Jones',      price: 39800.00, change: 0.42,  tv: 'FOREXCOM:US30',     category: 'Indices',     isIndex: true  },
  { symbol: 'NDX',      display: 'NQ100',  name: 'Nasdaq 100',     price: 18200.00, change: 0.88,  tv: 'FOREXCOM:NAS100',   category: 'Indices',     isIndex: true  },
  // Commodities
  { symbol: 'XAU/USD',  display: 'XAU',    name: 'Gold Spot',      price: 3320.50,  change: 0.37,  tv: 'FOREXCOM:XAUUSD',  category: 'Commodities', isIndex: false },
  { symbol: 'XAG/USD',  display: 'XAG',    name: 'Silver',         price: 29.50,    change: -0.12, tv: 'FOREXCOM:XAGUSD',  category: 'Commodities', isIndex: false },
  { symbol: 'WTI',      display: 'WTI',    name: 'Petroleo WTI',   price: 82.10,    change: -0.54, tv: 'NYMEX:CL1!',       category: 'Commodities', isIndex: false },
  // Crypto
  { symbol: 'BTC/USD',  display: 'BTC',    name: 'Bitcoin',        price: 67432.21, change: 2.34,  tv: 'BINANCE:BTCUSDT',  category: 'Crypto',      isIndex: false },
  { symbol: 'ETH/USD',  display: 'ETH',    name: 'Ethereum',       price: 3521.87,  change: 1.56,  tv: 'BINANCE:ETHUSDT',  category: 'Crypto',      isIndex: false },
  // Forex
  { symbol: 'EUR/USD',  display: 'EUR',    name: 'EUR/USD',        price: 1.0892,   change: 0.12,  tv: 'FOREXCOM:EURUSD',  category: 'Forex',       isIndex: false },
  { symbol: 'GBP/USD',  display: 'GBP',    name: 'GBP/USD',        price: 1.2745,   change: -0.08, tv: 'FOREXCOM:GBPUSD',  category: 'Forex',       isIndex: false },
  { symbol: 'USD/JPY',  display: 'JPY',    name: 'USD/JPY',        price: 149.50,   change: 0.21,  tv: 'FOREXCOM:USDJPY',  category: 'Forex',       isIndex: false },
  // Stocks
  { symbol: 'AAPL',     display: 'AAPL',   name: 'Apple Inc.',     price: 195.89,   change: 0.87,  tv: 'NASDAQ:AAPL',      category: 'Stocks',      isIndex: false },
  { symbol: 'TSLA',     display: 'TSLA',   name: 'Tesla Inc.',     price: 248.42,   change: -1.23, tv: 'NASDAQ:TSLA',      category: 'Stocks',      isIndex: false },
  { symbol: 'NVDA',     display: 'NVDA',   name: 'NVIDIA',         price: 875.31,   change: 3.45,  tv: 'NASDAQ:NVDA',      category: 'Stocks',      isIndex: false },
];

const CATEGORIES = ['All', 'Indices', 'Crypto', 'Forex', 'Stocks', 'Commodities'];

type MarketItem = typeof MARKETS[0];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Levels {
  supports: number[];
  resistances: number[];
  pivot: number;
  currentPrice: number;
  lastUpdated: string;
}

interface IBLevel {
  label: string;
  price: number;
  type: 'high' | 'low' | 'mid' | 'ext_up' | 'ext_dn' | 'half_up' | 'half_dn';
  multiplier: number;
}

interface IBAnalysis {
  ibHigh: number;
  ibLow: number;
  ibMid: number;
  ibDelta: number;
  levels: IBLevel[];
  currentPrice: number;
  status: 'inside' | 'above' | 'below';
  sentiment: 'Wide' | 'Narrow' | 'Average' | 'N/A';
  signal: 'bullish' | 'bearish' | 'neutral';
  signalReason: string;
  aiSignal: string;
  lastUpdated: string;
}

// ─── Fetch S/R levels ─────────────────────────────────────────────────────────

async function fetchLevels(symbol: string, fallbackPrice: number): Promise<Levels> {
  try {
    const res = await axios.get('https://api.twelvedata.com/time_series', {
      params: { symbol, interval: '1h', outputsize: 50, apikey: TWELVE_KEY, format: 'JSON' },
      timeout: 10000,
    });
    if (!res.data?.values?.length) throw new Error('no data');
    const candles = res.data.values.map((v: Record<string, string>) => ({
      high: parseFloat(v.high), low: parseFloat(v.low), close: parseFloat(v.close),
    }));
    const h = Math.max(...candles.slice(0, 20).map((c: {high:number}) => c.high));
    const l = Math.min(...candles.slice(0, 20).map((c: {low:number}) => c.low));
    const c0 = candles[0].close;
    const pivot = (h + l + c0) / 3;
    const r1 = 2 * pivot - l, r2 = pivot + (h - l), r3 = h + 2 * (pivot - l);
    const s1 = 2 * pivot - h, s2 = pivot - (h - l), s3 = l - 2 * (h - pivot);
    const swingHighs: number[] = [], swingLows: number[] = [];
    for (let i = 2; i < Math.min(candles.length - 2, 30); i++) {
      if (candles[i].high > candles[i-1].high && candles[i].high > candles[i+1].high) swingHighs.push(candles[i].high);
      if (candles[i].low < candles[i-1].low && candles[i].low < candles[i+1].low) swingLows.push(candles[i].low);
    }
    const dec = symbol.includes('/') && !symbol.startsWith('USD') ? 5 : 2;
    const allRes = [r1, r2, r3, ...swingHighs].filter(v => v > c0 * 0.998).sort((a,b) => a-b).slice(0,4).map(v => parseFloat(v.toFixed(dec)));
    const allSup = [s1, s2, s3, ...swingLows].filter(v => v < c0 * 1.002).sort((a,b) => b-a).slice(0,4).map(v => parseFloat(v.toFixed(dec)));
    return { supports: allSup, resistances: allRes, pivot: parseFloat(pivot.toFixed(dec)), currentPrice: parseFloat(c0.toFixed(dec)), lastUpdated: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
  } catch {
    const p = fallbackPrice;
    return {
      supports: [p*0.99, p*0.98, p*0.97, p*0.96].map(v => parseFloat(v.toFixed(2))),
      resistances: [p*1.01, p*1.02, p*1.03, p*1.04].map(v => parseFloat(v.toFixed(2))),
      pivot: parseFloat(p.toFixed(2)), currentPrice: parseFloat(p.toFixed(2)),
      lastUpdated: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

// ─── Initial Balance (IB) Engine ──────────────────────────────────────────────
// Replicates the Pine Script logic:
// IB window = 9:30-10:30 NY time (first hour of RTH)
// Extensions: 0.5x, 1x, 1.5x ... 4.5x above IB High and below IB Low

async function fetchIBAnalysis(symbol: string, fallbackPrice: number): Promise<IBAnalysis> {
  try {
    // Fetch 15-min candles to reconstruct the IB window
    const res = await axios.get('https://api.twelvedata.com/time_series', {
      params: { symbol, interval: '15min', outputsize: 100, apikey: TWELVE_KEY, format: 'JSON' },
      timeout: 12000,
    });
    if (!res.data?.values?.length) throw new Error('no data');

    const candles = res.data.values.map((v: Record<string, string>) => ({
      datetime: v.datetime,
      open: parseFloat(v.open), high: parseFloat(v.high),
      low: parseFloat(v.low), close: parseFloat(v.close),
    })).reverse(); // oldest first

    const currentPrice = candles[candles.length - 1].close;

    // Find today's IB window: 9:30-10:30 NY (UTC-4 or UTC-5 depending on DST)
    // We look for candles in the first 4 x 15min slots after market open
    // Twelve Data returns in exchange timezone, so we filter by time string
    const today = candles[candles.length - 1].datetime.split(' ')[0];
    const ibCandles = candles.filter(c => {
      if (!c.datetime.startsWith(today)) return false;
      const timePart = c.datetime.split(' ')[1];
      if (!timePart) return false;
      const [h, m] = timePart.split(':').map(Number);
      const mins = h * 60 + m;
      // 9:30 = 570, 10:30 = 630 (NY time, but Twelve Data uses exchange time)
      // For US indices: exchange time = ET, so 9:30-10:30 = 570-630
      // For forex/commodities: use first 4 candles of the day as proxy
      return mins >= 570 && mins < 630;
    });

    let ibHigh: number, ibLow: number;

    if (ibCandles.length >= 2) {
      ibHigh = Math.max(...ibCandles.map(c => c.high));
      ibLow  = Math.min(...ibCandles.map(c => c.low));
    } else {
      // Fallback: use first 4 candles of today as IB proxy
      const todayCandles = candles.filter(c => c.datetime.startsWith(today)).slice(0, 4);
      if (todayCandles.length >= 2) {
        ibHigh = Math.max(...todayCandles.map(c => c.high));
        ibLow  = Math.min(...todayCandles.map(c => c.low));
      } else {
        // Last resort: use recent range
        const recent = candles.slice(-20);
        ibHigh = Math.max(...recent.map(c => c.high));
        ibLow  = Math.min(...recent.map(c => c.low));
      }
    }

    const ibDelta = ibHigh - ibLow;
    const ibMid   = (ibHigh + ibLow) / 2;
    const dec = symbol.includes('/') && !symbol.startsWith('USD') ? 5 : 2;
    const fmt = (v: number) => parseFloat(v.toFixed(dec));

    // Build all IB levels (mirrors Pine Script logic)
    const levels: IBLevel[] = [
      { label: 'IB High', price: fmt(ibHigh), type: 'high', multiplier: 0 },
      { label: 'IB Mid',  price: fmt(ibMid),  type: 'mid',  multiplier: 0 },
      { label: 'IB Low',  price: fmt(ibLow),  type: 'low',  multiplier: 0 },
    ];

    // Whole-number extensions 1x to 4x
    for (let n = 1; n <= 4; n++) {
      levels.push({ label: `IB +${n}x`, price: fmt(ibHigh + ibDelta * n), type: 'ext_up', multiplier: n });
      levels.push({ label: `IB -${n}x`, price: fmt(ibLow  - ibDelta * n), type: 'ext_dn', multiplier: -n });
    }

    // Half-ladder 0.5x to 4.5x (only .5 steps, not whole numbers)
    for (let i = 1; i <= 9; i++) {
      const k = i * 0.5;
      if (k !== Math.round(k)) { // only .5 steps
        levels.push({ label: `IB +${k}x`, price: fmt(ibHigh + ibDelta * k), type: 'half_up', multiplier: k });
        levels.push({ label: `IB -${k}x`, price: fmt(ibLow  - ibDelta * k), type: 'half_dn', multiplier: -k });
      }
    }

    // Sort all levels by price descending
    levels.sort((a, b) => b.price - a.price);

    // Determine status
    const status: IBAnalysis['status'] = currentPrice > ibHigh ? 'above' : currentPrice < ibLow ? 'below' : 'inside';

    // Sentiment (mirrors Pine Script 20-day delta stats)
    const recentDeltas = candles.slice(-80).reduce((acc: number[], _, i, arr) => {
      if (i % 4 === 0 && i + 3 < arr.length) {
        const slice = arr.slice(i, i + 4);
        acc.push(Math.max(...slice.map(c => c.high)) - Math.min(...slice.map(c => c.low)));
      }
      return acc;
    }, []);
    const avgDelta = recentDeltas.length ? recentDeltas.reduce((a, b) => a + b, 0) / recentDeltas.length : ibDelta;
    const maxDelta = recentDeltas.length ? Math.max(...recentDeltas) : ibDelta * 1.5;
    const minDelta = recentDeltas.length ? Math.min(...recentDeltas) : ibDelta * 0.5;
    const sentiment: IBAnalysis['sentiment'] =
      Math.abs(ibDelta - maxDelta) < Math.abs(ibDelta - minDelta) && Math.abs(ibDelta - maxDelta) < Math.abs(ibDelta - avgDelta) ? 'Wide' :
      Math.abs(ibDelta - minDelta) < Math.abs(ibDelta - maxDelta) && Math.abs(ibDelta - minDelta) < Math.abs(ibDelta - avgDelta) ? 'Narrow' : 'Average';

    // Signal logic
    let signal: IBAnalysis['signal'] = 'neutral';
    let signalReason = '';
    if (status === 'above') {
      signal = 'bullish';
      signalReason = `Precio sobre IB High (${fmt(ibHigh)}). Tendencia alcista confirmada. Buscar retrocesos a IB High como soporte.`;
    } else if (status === 'below') {
      signal = 'bearish';
      signalReason = `Precio bajo IB Low (${fmt(ibLow)}). Tendencia bajista confirmada. Buscar rebotes a IB Low como resistencia.`;
    } else {
      const distToHigh = ibHigh - currentPrice;
      const distToLow  = currentPrice - ibLow;
      if (distToHigh < distToLow * 0.5) {
        signal = 'bullish';
        signalReason = `Precio cerca de IB High. Posible ruptura alcista. Vigilar cierre sobre ${fmt(ibHigh)}.`;
      } else if (distToLow < distToHigh * 0.5) {
        signal = 'bearish';
        signalReason = `Precio cerca de IB Low. Posible ruptura bajista. Vigilar cierre bajo ${fmt(ibLow)}.`;
      } else {
        signalReason = `Precio dentro del IB (${fmt(ibLow)}-${fmt(ibHigh)}). Rango de consolidacion. Esperar ruptura.`;
      }
    }

    // GPT-4o signal for indices
    let aiSignal = '';
    try {
      const gptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Analiza el Initial Balance (IB) de ${symbol} y da una señal de trading concreta.

IB High: ${fmt(ibHigh)} | IB Low: ${fmt(ibLow)} | IB Mid: ${fmt(ibMid)} | IB Delta: ${fmt(ibDelta)} pts
Precio actual: ${fmt(currentPrice)}
Estado: ${status === 'above' ? 'SOBRE el IB' : status === 'below' ? 'BAJO el IB' : 'DENTRO del IB'}
Sentimiento del rango: ${sentiment}

Extensiones clave:
+0.5x: ${fmt(ibHigh + ibDelta * 0.5)} | +1x: ${fmt(ibHigh + ibDelta)} | +1.5x: ${fmt(ibHigh + ibDelta * 1.5)} | +2x: ${fmt(ibHigh + ibDelta * 2)}
-0.5x: ${fmt(ibLow - ibDelta * 0.5)} | -1x: ${fmt(ibLow - ibDelta)} | -1.5x: ${fmt(ibLow - ibDelta * 1.5)} | -2x: ${fmt(ibLow - ibDelta * 2)}

Reglas del IB:
- Si precio rompe IB High con volumen → buscar longs hacia +0.5x, +1x, +1.5x
- Si precio rompe IB Low con volumen → buscar shorts hacia -0.5x, -1x, -1.5x
- Si precio está dentro del IB → esperar ruptura o fade desde extremos
- IB Wide = rango amplio, menos probable extensión completa
- IB Narrow = rango estrecho, más probable extensión fuerte

Responde en 2-3 oraciones concretas: qué hacer ahora, entrada, objetivo y stop.`
        }],
        temperature: 0.2,
        max_tokens: 200,
      }, {
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      });
      aiSignal = gptRes.data.choices[0].message.content;
    } catch {
      aiSignal = signalReason;
    }

    return {
      ibHigh: fmt(ibHigh), ibLow: fmt(ibLow), ibMid: fmt(ibMid),
      ibDelta: fmt(ibDelta), levels, currentPrice: fmt(currentPrice),
      status, sentiment, signal, signalReason, aiSignal,
      lastUpdated: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    const p = fallbackPrice;
    const delta = p * 0.005;
    return {
      ibHigh: p + delta, ibLow: p - delta, ibMid: p, ibDelta: delta * 2,
      levels: [], currentPrice: p, status: 'inside', sentiment: 'N/A',
      signal: 'neutral', signalReason: 'No se pudo calcular el IB.', aiSignal: 'Datos no disponibles.',
      lastUpdated: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

// ─── Signal Card (mini) ───────────────────────────────────────────────────────

function SignalCard({ signal, isExpanded, onToggle }: { signal: TimeframeSignal; isExpanded: boolean; onToggle: () => void }) {
  const bc = signal.bias === 'bullish' ? '#34C759' : signal.bias === 'bearish' ? '#FF3B30' : '#FF9500';
  const biasLabel = signal.bias === 'bullish' ? 'ALCISTA' : signal.bias === 'bearish' ? 'BAJISTA' : 'NEUTRAL';
  const edge = signal.statEdge;
  const edgeActive = edge?.active;

  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: '#1C1C1E', border: `1px solid ${edgeActive ? bc + '60' : isExpanded ? bc + '40' : '#38383A'}` }}
      onClick={onToggle}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bc + '15' }}>
            {signal.bias === 'bullish' ? <TrendingUp size={16} color={bc} /> : signal.bias === 'bearish' ? <TrendingDown size={16} color={bc} /> : <Zap size={16} color={bc} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{signal.label}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: bc, background: bc + '20' }}>{biasLabel}</span>
              {edgeActive && <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#AF52DE20', color: '#AF52DE' }}>EDGE</span>}
            </div>
            <div className="w-24 h-1 bg-[#2C2C2E] rounded-full overflow-hidden mt-1">
              <motion.div initial={{ width: 0 }} animate={{ width: `${signal.strength}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: bc }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#636366]">{signal.strength}%</span>
          {isExpanded ? <ChevronUp size={14} color="#636366" /> : <ChevronDown size={14} color="#636366" />}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 border-t border-[#38383A] pt-3 space-y-3">
              <p className="text-xs text-[#8E8E93] leading-relaxed">{signal.summary}</p>

              {edge && (
                <div className="p-3 rounded-xl space-y-2"
                  style={{ background: edgeActive ? bc + '08' : '#2C2C2E', border: `1px solid ${edgeActive ? bc + '30' : '#38383A'}` }}>
                  <div className="flex items-center gap-2">
                    <Zap size={11} color={edgeActive ? bc : '#636366'} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: edgeActive ? bc : '#636366' }}>
                      Statistical Edge {edgeActive ? '— ACTIVO' : '— Sin señal'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">{edge.description}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: 'BB Touch', ok: edge.conditions.bbTouch },
                      { label: 'RSI Extremo', ok: edge.conditions.rsiExtreme },
                      { label: 'Vol Anomalo', ok: edge.conditions.volumeAnomaly },
                      { label: 'No Freefall', ok: edge.conditions.notFreefall },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: ok ? '#34C759' : '#636366' }}>{ok ? '✓' : '○'}</span>
                        <span className="text-xs" style={{ color: ok ? '#8E8E93' : '#636366' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="text-center p-1.5 rounded-lg" style={{ background: '#1C1C1E' }}>
                      <span className="text-[10px] text-[#636366] block">RSI</span>
                      <span className="text-xs font-bold" style={{ color: edge.indicators.rsi < 30 ? '#34C759' : edge.indicators.rsi > 70 ? '#FF3B30' : '#8E8E93' }}>
                        {edge.indicators.rsi.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded-lg" style={{ background: '#1C1C1E' }}>
                      <span className="text-[10px] text-[#636366] block">Vol</span>
                      <span className="text-xs font-bold" style={{ color: edge.indicators.volumeRatio > 1.5 ? '#34C759' : '#8E8E93' }}>
                        {edge.indicators.volumeRatio.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded-lg" style={{ background: '#1C1C1E' }}>
                      <span className="text-[10px] text-[#636366] block">ATR</span>
                      <span className="text-xs font-bold text-[#8E8E93]">{edge.indicators.atr.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs flex-wrap">
                    <span className="text-[#636366]">EMA20 <span className="text-white font-medium">{edge.indicators.ema20.toFixed(2)}</span></span>
                    <span className="text-[#636366]">EMA50 <span className="text-white font-medium">{edge.indicators.ema50.toFixed(2)}</span></span>
                    <span className="text-[#636366]">EMA200 <span className="text-white font-medium">{edge.indicators.ema200.toFixed(2)}</span></span>
                  </div>
                </div>
              )}

              {edgeActive && edge && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl" style={{ background: '#2C2C2E' }}>
                    <div className="flex items-center gap-1 text-xs text-[#636366] mb-1"><Target size={9} /><span>Entrada</span></div>
                    <span className="text-sm font-bold text-white">{edge.entry.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,59,48,0.1)' }}>
                    <div className="flex items-center gap-1 text-xs text-[#FF3B30] mb-1"><Shield size={9} /><span>SL 1.5xATR</span></div>
                    <span className="text-sm font-bold text-[#FF3B30]">{edge.sl.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.1)' }}>
                    <span className="text-xs text-[#34C759] block mb-1">TP SMA20</span>
                    <span className="text-sm font-bold text-[#34C759]">{edge.tp.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {signal.orderBlocks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {signal.orderBlocks.map((ob, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ color: ob.type === 'bullish' ? '#34C759' : '#FF3B30', background: (ob.type === 'bullish' ? '#34C759' : '#FF3B30') + '15' }}>
                      {ob.type === 'bullish' ? '🟢' : '🔴'} OB {ob.low.toFixed(0)}-{ob.high.toFixed(0)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Signals Panel ────────────────────────────────────────────────────────────

function SignalsPanel({ symbol }: { symbol: string }) {
  const [analysis, setAnalysis] = useState<UniversalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedTf, setExpandedTf] = useState<string | null>('1h');

  const universalSymbol = ASSET_CATALOG[symbol] ? symbol : 'SPX';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyzeAsset(universalSymbol);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [universalSymbol]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const TF_ORDER = ['15min', '30min', '1h', '2h', '3h', '4h', '1day', '1week'];

  if (loading && !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <Zap size={24} color="#AF52DE" />
        </motion.div>
        <p className="text-xs text-[#636366]">Calculando Statistical Edge...</p>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#AF52DE]"
              animate={{ scale: [0,1,0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const biasColor = analysis.overallBias === 'bullish' ? '#34C759' : analysis.overallBias === 'bearish' ? '#FF3B30' : '#FF9500';
  const biasLabel = analysis.overallBias === 'bullish' ? 'ALCISTA' : analysis.overallBias === 'bearish' ? 'BAJISTA' : 'NEUTRAL';
  const topEdge = analysis.topStatEdge;

  return (
    <div className="space-y-3">
      {/* Overall bias */}
      <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: `1px solid ${biasColor}30` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {analysis.overallBias === 'bullish' ? <TrendingUp size={18} color={biasColor} /> : analysis.overallBias === 'bearish' ? <TrendingDown size={18} color={biasColor} /> : <Zap size={18} color={biasColor} />}
            <span className="text-sm font-bold text-white">Sesgo General</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: biasColor, background: biasColor + '20' }}>{biasLabel}</span>
            <span className="text-sm font-bold" style={{ color: biasColor }}>{analysis.biasStrength}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden mb-3">
          <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.biasStrength}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: biasColor }} />
        </div>
        <p className="text-xs text-[#8E8E93] leading-relaxed">{analysis.aiReasoning}</p>
      </div>

      {/* Top Statistical Edge signal */}
      {topEdge && topEdge.active && (
        <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: `1px solid #AF52DE40` }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} color="#AF52DE" />
            <span className="text-xs font-bold text-[#AF52DE] uppercase tracking-wider">Statistical Edge — Señal Activa</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ color: topEdge.bias === 'bullish' ? '#34C759' : '#FF3B30', background: (topEdge.bias === 'bullish' ? '#34C759' : '#FF3B30') + '20' }}>
              {topEdge.confidence}% confianza
            </span>
          </div>
          <p className="text-sm font-semibold text-white mb-1">{topEdge.bias === 'bullish' ? 'LONG' : 'SHORT'} — Reversion a SMA20</p>
          <p className="text-xs text-[#8E8E93] mb-3">{topEdge.description}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl text-center" style={{ background: '#2C2C2E' }}>
              <span className="text-xs text-[#636366] block">Entrada</span>
              <span className="text-xs font-bold text-white">{topEdge.entry.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,59,48,0.1)' }}>
              <span className="text-xs text-[#FF3B30] block">SL 1.5xATR</span>
              <span className="text-xs font-bold text-[#FF3B30]">{topEdge.sl.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(52,199,89,0.1)' }}>
              <span className="text-xs text-[#34C759] block">TP SMA20</span>
              <span className="text-xs font-bold text-[#34C759]">{topEdge.tp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Signals by timeframe */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">Señales por Temporalidad</span>
        <button onClick={load} className="flex items-center gap-1 text-xs text-[#636366]">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {TF_ORDER.map(tf => {
          const signal = analysis.signals.find(s => s.timeframe === tf);
          if (!signal) return null;
          return (
            <SignalCard key={tf} signal={signal} isExpanded={expandedTf === tf} onToggle={() => setExpandedTf(expandedTf === tf ? null : tf)} />
          );
        })}
      </div>

      <p className="text-xs text-[#38383A] text-center leading-relaxed">
        Modelo Statistical Edge Reversion: BB(20,2) + RSI(14) + Vol 150% MA20 + SL 1.5xATR. No constituye asesoramiento financiero.
      </p>
    </div>
  );
}


// ─── Quant Signals Panel (for Markets) ───────────────────────────────────────

function QuantSignalsPanel({ symbol, assetName }: { symbol: string; assetName: string }) {
  const [qAnalysis, setQAnalysis] = useState<QuantAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [signalExpiry, setSignalExpiry] = useState(0);

  // Cronómetro de vigencia
  const [expirySecs, setExpirySecs] = useState(0);
  useEffect(() => {
    setExpirySecs(signalExpiry);
    const t = setInterval(() => setExpirySecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [signalExpiry]);
  const fmtExpiry = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  const fmtTime = (dt: string) => {
    try {
      const d = new Date(dt);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' }) + ' NY';
    } catch { return dt; }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runQuantAnalysis(symbol);
      setQAnalysis(result);
      if (result.metrics.lastSignal?.direction !== 'NONE') {
        setSignalExpiry(8 * 15 * 60); // 8 barras × 15min por defecto
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // NO carga automáticamente — solo cuando el usuario presiona el botón
  const lastSig = qAnalysis?.metrics.lastSignal;
  const lastColor = lastSig?.direction === 'LONG' ? '#34C759' : lastSig?.direction === 'SHORT' ? '#FF3B30' : '#636366';
  const hasSignal = lastSig && lastSig.direction !== 'NONE';

  // Estado inicial — sin análisis
  if (!qAnalysis && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #AF52DE20, #007AFF20)', border: '1px solid #38383A' }}>
          <BarChart2 size={24} color="#AF52DE" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white mb-1">Análisis Cuantitativo</p>
          <p className="text-xs text-[#636366]">Detecta anomalías estadísticas ±2.5σ</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
          <Zap size={15} />
          Analizar Ahora
        </button>
      </div>
    );
  }

  // Loading
  if (loading && !qAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <BarChart2 size={24} color="#AF52DE" />
        </motion.div>
        <p className="text-xs text-[#636366]">Calculando anomalías Log-Anomaly ±2.5σ...</p>
      </div>
    );
  }

  if (!qAnalysis) return null;

  return (
    <div className="space-y-3">

      {/* ── SEÑAL ACTIVA + CRONÓMETRO ── */}
      {hasSignal && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl"
          style={{ background: lastColor + '10', border: `1px solid ${lastColor}35` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: lastColor + '20' }}>
                {lastSig!.direction === 'LONG'
                  ? <TrendingUp size={18} color={lastColor} />
                  : <TrendingDown size={18} color={lastColor} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: lastColor }}>{lastSig!.direction}</span>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: lastColor }} />
                </div>
                <span className="text-xs font-mono" style={{ color: '#8E8E93' }}>
                  🕐 {fmtTime(lastSig!.timestamp)}
                </span>
              </div>
            </div>
            {/* Cronómetro */}
            {expirySecs > 0 && (
              <div className="text-right">
                <div className="text-xs text-[#636366] mb-0.5">Vigencia</div>
                <div className="font-mono font-black text-xl leading-none"
                  style={{ color: expirySecs < 300 ? '#FF3B30' : expirySecs < 900 ? '#FF9500' : lastColor }}>
                  {fmtExpiry(expirySecs)}
                </div>
              </div>
            )}
          </div>
          {/* Precios */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl text-center" style={{ background: '#00000030' }}>
              <div className="text-xs text-[#636366]">Entrada</div>
              <div className="text-sm font-black text-white">{lastSig!.entryPrice.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,59,48,0.12)' }}>
              <div className="text-xs text-[#FF3B30]">Stop</div>
              <div className="text-sm font-black text-[#FF3B30]">{lastSig!.stopLoss.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(52,199,89,0.12)' }}>
              <div className="text-xs text-[#34C759]">Target</div>
              <div className="text-sm font-black text-[#34C759]">{lastSig!.takeProfit.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── RESUMEN IA ── */}
      <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={12} color="#AF52DE" />
            <span className="text-xs font-bold text-[#AF52DE] uppercase tracking-wider">Log Anomaly ±2.5σ</span>
          </div>
          <button onClick={load} disabled={loading}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: loading ? '#2C2C2E' : 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
            <RefreshCw size={11} color="#FFFFFF" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-xs text-[#8E8E93] leading-relaxed">{qAnalysis.aiSummary}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#636366]">
            Actualizado: {qAnalysis.nyTime} NY
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: { trending_up: '#34C759', trending_down: '#FF3B30', ranging: '#FF9500', volatile: '#AF52DE' }[qAnalysis.marketRegime] || '#FF9500',
              background: ({ trending_up: '#34C75920', trending_down: '#FF3B3020', ranging: '#FF950020', volatile: '#AF52DE20' }[qAnalysis.marketRegime] || '#FF950020'),
            }}>
            {{ trending_up: 'Alcista', trending_down: 'Bajista', ranging: 'Lateral', volatile: 'Volátil' }[qAnalysis.marketRegime] || qAnalysis.marketRegime}
          </span>
        </div>
      </div>

      {/* ── SEÑALES ACTUALES ── */}
      {qAnalysis.signals.length === 0 && (
        <div className="text-center py-6 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
          <p className="text-sm text-[#636366]">Sin anomalías detectadas</p>
          <p className="text-xs text-[#38383A] mt-1">|Z-Score| {'<'} 2.5σ en las últimas 30 barras</p>
        </div>
      )}

      {qAnalysis.signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#34C759] uppercase tracking-wider px-1">
            {qAnalysis.signals.length} señal{qAnalysis.signals.length > 1 ? 'es' : ''} detectada{qAnalysis.signals.length > 1 ? 's' : ''}
          </p>
          {[...qAnalysis.signals]
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 5)
            .map((sig, i) => {
              const c = sig.direction === 'LONG' ? '#34C759' : sig.direction === 'SHORT' ? '#FF3B30' : '#636366';
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background: '#1C1C1E', border: `1px solid ${i === 0 ? c + '40' : '#2C2C2E'}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {sig.direction === 'LONG' ? <TrendingUp size={14} color={c} /> : <TrendingDown size={14} color={c} />}
                      <span className="text-sm font-bold" style={{ color: c }}>{sig.direction}</span>
                      <span className="text-xs font-mono text-[#8E8E93]">🕐 {fmtTime(sig.timestamp)}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: c }}>{Math.round(sig.signalStrength * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="p-2 rounded-lg text-center" style={{ background: '#2C2C2E' }}>
                      <div className="text-xs text-[#636366]">Entrada</div>
                      <div className="text-xs font-bold text-white">{sig.entryPrice.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,59,48,0.1)' }}>
                      <div className="text-xs text-[#FF3B30]">Stop</div>
                      <div className="text-xs font-bold text-[#FF3B30]">{sig.stopLoss.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(52,199,89,0.1)' }}>
                      <div className="text-xs text-[#34C759]">Target</div>
                      <div className="text-xs font-bold text-[#34C759]">{sig.takeProfit.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <p className="text-xs text-[#38383A] text-center">No constituye asesoramiento financiero.</p>
    </div>
  );
}

// ─── TradingView Chart ────────────────────────────────────────────────────────

function TradingViewChart({ tvSymbol, interval }: { tvSymbol: string; interval: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval,
      theme: 'dark',
      style: '1',
      locale: 'es',
      timezone: 'America/New_York',
      toolbar_bg: '#1C1C1E',
      enable_publishing: '0',
      hide_side_toolbar: '1',
      allow_symbol_change: '0',
      save_image: '0',
      container_id: 'tv_chart_container',
    });
    iframe.src = `https://s.tradingview.com/widgetembed/?${params.toString()}`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.allowFullscreen = true;
    containerRef.current.appendChild(iframe);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [tvSymbol, interval]);
  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── IB Level Row ─────────────────────────────────────────────────────────────

function IBLevelRow({ level, currentPrice, ibHigh, ibLow }: { level: IBLevel; currentPrice: number; ibHigh: number; ibLow: number }) {
  const isAbove = level.price > currentPrice;
  const isCurrent = Math.abs(level.price - currentPrice) / currentPrice < 0.001;
  const dist = ((Math.abs(level.price - currentPrice) / currentPrice) * 100).toFixed(2);

  const colorMap: Record<IBLevel['type'], string> = {
    high: '#34C759', low: '#FF3B30', mid: '#FF9500',
    ext_up: '#34C75988', ext_dn: '#FF3B3088',
    half_up: '#34C75955', half_dn: '#FF3B3055',
  };
  const color = colorMap[level.type];
  const isMain = ['high', 'low', 'mid'].includes(level.type);

  return (
    <div className={`flex items-center gap-3 py-1.5 px-3 rounded-lg transition-colors ${isCurrent ? 'bg-white/10' : ''}`}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, opacity: isMain ? 1 : 0.6 }} />
      <span className={`text-xs shrink-0 ${isMain ? 'font-bold text-white' : 'text-[#8E8E93]'}`} style={{ minWidth: 64 }}>
        {level.label}
      </span>
      <span className={`text-xs font-mono ml-auto ${isMain ? 'font-bold text-white' : 'text-[#8E8E93]'}`}>
        {level.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
      <span className="text-xs w-14 text-right shrink-0" style={{ color: isAbove ? '#FF3B30' : '#34C759' }}>
        {isAbove ? '+' : '-'}{dist}%
      </span>
    </div>
  );
}

// ─── Level Bar (S/R) ──────────────────────────────────────────────────────────

function LevelBar({ value, current, min, max, type }: { value: number; current: number; min: number; max: number; type: 'support' | 'resistance' | 'pivot' }) {
  const pct = Math.max(2, Math.min(98, ((value - min) / (max - min)) * 100));
  const color = type === 'resistance' ? '#FF3B30' : type === 'support' ? '#34C759' : '#FF9500';
  const dist = ((Math.abs(value - current) / current) * 100).toFixed(2);
  const isAbove = value > current;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-20 shrink-0 text-right">
        <span className="text-xs font-bold" style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div className="flex-1 relative h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: `${pct - 1}%`, width: '3px', background: color }} />
        <div className="absolute top-0 bottom-0 rounded-full opacity-15" style={{ left: `${Math.max(0, pct - 10)}%`, right: `${Math.max(0, 100 - pct)}%`, background: color }} />
      </div>
      <div className="w-14 shrink-0 text-right">
        <span className="text-xs" style={{ color: isAbove ? '#FF3B30' : '#34C759' }}>{isAbove ? '+' : '-'}{dist}%</span>
      </div>
    </div>
  );
}

// ─── Asset Detail Panel ───────────────────────────────────────────────────────

function AssetDetailPanel({ asset, onClose }: { asset: MarketItem; onClose: () => void }) {
  const [levels, setLevels] = useState<Levels | null>(null);
  const [ibData, setIbData] = useState<IBAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'ib' | 'sr'>(asset.isIndex ? 'ib' : 'signals');
  const [activeInterval, setActiveInterval] = useState('15');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [lvl, ib] = await Promise.all([
      fetchLevels(asset.symbol, asset.price),
      asset.isIndex ? fetchIBAnalysis(asset.symbol, asset.price) : Promise.resolve(null),
    ]);
    setLevels(lvl);
    if (ib) setIbData(ib);
    setLoading(false);
  }, [asset.symbol, asset.price, asset.isIndex]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const isUp = asset.change >= 0;
  const changeColor = isUp ? '#34C759' : '#FF3B30';
  const currentPrice = levels?.currentPrice || asset.price;

  const allLevels = levels ? [...levels.resistances, ...levels.supports, levels.pivot] : [];
  const minLevel = allLevels.length ? Math.min(...allLevels) * 0.997 : asset.price * 0.95;
  const maxLevel = allLevels.length ? Math.max(...allLevels) * 1.003 : asset.price * 1.05;

  const signalColor = ibData?.signal === 'bullish' ? '#34C759' : ibData?.signal === 'bearish' ? '#FF3B30' : '#FF9500';
  const statusLabel = ibData?.status === 'above' ? 'SOBRE IB' : ibData?.status === 'below' ? 'BAJO IB' : 'DENTRO IB';
  const statusColor = ibData?.status === 'above' ? '#34C759' : ibData?.status === 'below' ? '#FF3B30' : '#FF9500';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-black md:relative md:inset-auto md:flex-1 md:min-h-0 md:overflow-hidden"
    >
      {/* ── Banner ── */}
      <div className="shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #111 0%, #1C1C1E 60%, #2C2C2E 100%)', borderBottom: '1px solid #38383A' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 15% 60%, ${changeColor}18 0%, transparent 55%)` }} />

        <div className="relative px-5 md:px-7 pt-5 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-base"
                style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${changeColor}25, ${changeColor}08)`, border: `1.5px solid ${changeColor}35` }}>
                <span style={{ color: changeColor }}>{asset.display.slice(0, 3)}</span>
              </div>
              <div>
                <div className="text-xl font-black text-white tracking-tight leading-none">{asset.display}</div>
                <div className="text-xs text-[#8E8E93] mt-0.5">{asset.name}</div>
                {asset.isIndex && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block" style={{ background: '#AF52DE20', color: '#AF52DE' }}>
                    IB ANALYSIS
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center md:hidden" style={{ background: '#2C2C2E' }}>
              <X size={15} color="#8E8E93" />
            </button>
          </div>

          {/* Price row */}
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-black text-white leading-none">
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 mb-0.5">
              {isUp ? <TrendingUp size={15} color={changeColor} /> : <TrendingDown size={15} color={changeColor} />}
              <span className="text-sm font-bold" style={{ color: changeColor }}>{isUp ? '+' : ''}{asset.change}%</span>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {levels && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500' }}>
                Pivot {levels.pivot.toLocaleString()}
              </span>
            )}
            {ibData && (
              <>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: statusColor + '20', color: statusColor }}>
                  {statusLabel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#2C2C2E', color: '#8E8E93' }}>
                  IB Δ {ibData.ibDelta.toLocaleString()} pts · {ibData.sentiment}
                </span>
              </>
            )}
            <div className="flex items-center gap-1 text-xs text-[#636366] ml-auto">
              <Clock size={10} />
              <span>{levels?.lastUpdated || '--:--'}</span>
              {loading && <RefreshCw size={9} className="animate-spin ml-1" color="#636366" />}
            </div>
          </div>
        </div>

        {/* Interval selector */}
        <div className="flex gap-1 px-5 md:px-7 pb-3">
          {(['15', '60', '240', 'D'] as const).map(iv => (
            <button key={iv} onClick={() => setActiveInterval(iv)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{ background: activeInterval === iv ? '#FFFFFF' : '#2C2C2E', color: activeInterval === iv ? '#000' : '#636366' }}>
              {iv === 'D' ? '1D' : iv === '60' ? '1H' : iv === '240' ? '4H' : '15M'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {/* Chart */}
        <div className="px-4 md:px-6 pt-4">
          <div className="w-full rounded-2xl overflow-hidden" style={{ height: 260, background: '#1C1C1E', border: '1px solid #38383A' }}>
            <TradingViewChart tvSymbol={asset.tv} interval={activeInterval} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 pt-4">
          <div className="flex p-1 rounded-xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
            <button onClick={() => setActiveTab('signals')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
              style={{ background: activeTab === 'signals' ? '#2C2C2E' : 'transparent', color: activeTab === 'signals' ? '#FFFFFF' : '#636366' }}>
              <TrendingUp size={11} /> Señales
            </button>
            <button onClick={() => setActiveTab('ib')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
              style={{ background: activeTab === 'ib' ? '#2C2C2E' : 'transparent', color: activeTab === 'ib' ? '#FFFFFF' : '#636366' }}>
              <Zap size={11} /> Quant
            </button>
            <button onClick={() => setActiveTab('sr')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: activeTab === 'sr' ? '#2C2C2E' : 'transparent', color: activeTab === 'sr' ? '#FFFFFF' : '#636366' }}>
              S / R
            </button>
          </div>
        </div>

        {/* ── Signals Tab ── */}
        {activeTab === 'signals' && (
          <div className="px-4 md:px-6 pt-3 pb-8">
            <SignalsPanel symbol={asset.symbol} />
          </div>
        )}

        {/* ── Quant Tab ── */}
        {activeTab === 'ib' && (
          <div className="px-4 md:px-6 pt-3 pb-8">
            <QuantSignalsPanel symbol={asset.symbol} assetName={asset.name} />
          </div>
        )}

        {/* ── S/R Tab ── */}
        {activeTab === 'sr' && (
          <div className="px-4 md:px-6 pt-3 pb-8 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">Soportes y Resistencias</span>
              <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-[#636366]">
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>

            {!levels && (
              <div className="flex justify-center py-8">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-[#38383A]"
                      animate={{ scale: [0,1,0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            )}

            {levels && (
              <>
                <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid rgba(255,59,48,0.25)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                    <span className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider">Resistencias</span>
                  </div>
                  {levels.resistances.map((r, i) => <LevelBar key={i} value={r} current={levels.currentPrice} min={minLevel} max={maxLevel} type="resistance" />)}
                </div>

                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#2C2C2E' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: changeColor }} />
                  <span className="text-xs text-[#8E8E93]">Precio actual</span>
                  <span className="text-sm font-bold text-white ml-auto">{levels.currentPrice.toLocaleString()}</span>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid rgba(52,199,89,0.25)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                    <span className="text-xs font-bold text-[#34C759] uppercase tracking-wider">Soportes</span>
                  </div>
                  {levels.supports.map((s, i) => <LevelBar key={i} value={s} current={levels.currentPrice} min={minLevel} max={maxLevel} type="support" />)}
                </div>

                <p className="text-xs text-[#38383A] text-center pt-1 leading-relaxed">
                  Pivots clasicos + swing highs/lows en 1H. Actualizacion cada 15 min.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MarketsScreen() {
  const navigate = useStore((s) => s.navigate);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MarketItem | null>(null);

  const filtered = MARKETS.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.display.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex bg-black overflow-hidden">
      {/* Left: list */}
      <div className={`flex flex-col ${selectedAsset ? 'hidden md:flex md:w-72 shrink-0' : 'flex-1'}`}>
        <div className="shrink-0 px-5 py-4"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-white">Markets</h3>
            <button
              onClick={() => navigate('NewsSignalsScreen')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#007AFF', color: '#FFFFFF' }}
            >
              <Newspaper size={14} />
              <span>Señales de Noticias</span>
            </button>
          </div>
          <div className="flex items-center bg-[#1C1C1E] rounded-xl px-3 py-2.5 border border-[#38383A] mb-3">
            <Search size={15} color="#8E8E93" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar activo..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#636366] ml-2" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{ background: activeCategory === cat ? '#FFFFFF' : '#1C1C1E', color: activeCategory === cat ? '#000' : '#8E8E93', border: `1px solid ${activeCategory === cat ? '#FFFFFF' : '#38383A'}` }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {filtered.map((asset, i) => {
            const isSelected = selectedAsset?.symbol === asset.symbol;
            const isUp = asset.change >= 0;
            const changeColor = isUp ? '#34C759' : '#FF3B30';
            return (
              <motion.button key={asset.symbol}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedAsset(asset)}
                className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left"
                style={{ background: isSelected ? '#1C1C1E' : 'transparent', borderLeft: isSelected ? `2px solid ${changeColor}` : '2px solid transparent' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: isUp ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', border: `1px solid ${changeColor}25`, color: changeColor }}>
                    {asset.display.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{asset.display}</span>
                      {asset.isIndex && <span className="text-[9px] px-1 py-0.5 rounded font-bold" style={{ background: '#AF52DE20', color: '#AF52DE' }}>IB</span>}
                    </div>
                    <div className="text-xs text-[#636366]">{asset.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs font-bold" style={{ color: changeColor }}>{isUp ? '+' : ''}{asset.change}%</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right: detail */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="flex-1 min-h-0 flex flex-col md:border-l md:border-[#1C1C1E]">
            <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
          </div>
        )}
      </AnimatePresence>

      {!selectedAsset && (
        <div className="hidden md:flex flex-1 items-center justify-center border-l border-[#1C1C1E]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={28} color="#38383A" />
            </div>
            <p className="text-[#636366] text-sm font-medium">Selecciona un activo</p>
            <p className="text-xs text-[#38383A] mt-1">Los indices incluyen analisis IB de NY</p>
          </div>
        </div>
      )}
    </div>
  );
}
