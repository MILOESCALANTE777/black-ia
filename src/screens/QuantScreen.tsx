import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Zap, AlertTriangle, ChevronDown, ChevronUp, Activity, BarChart2, Trash2, History, CheckCircle, XCircle, Timer } from 'lucide-react';
import { runQuantAnalysis, type QuantAnalysis, type LogAnomalySignal, type NewsImpact, loadSignalHistory, clearSignalHistory, type StoredSignal } from '@/lib/quantModel';

// ─── Signal status logic ──────────────────────────────────────────────────────
// Determines if a signal is ACTIVE, TP_HIT, SL_HIT, or EXPIRED based on current price

type SignalStatus = 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'EXPIRED' | 'PENDING';

function getSignalStatus(sig: LogAnomalySignal, currentPrice: number): SignalStatus {
  if (sig.direction === 'NONE') return 'EXPIRED';
  if (!currentPrice || currentPrice <= 0) return 'PENDING';

  const { direction, entryPrice, stopLoss, takeProfit } = sig;

  if (direction === 'LONG') {
    if (currentPrice >= takeProfit) return 'TP_HIT';
    if (currentPrice <= stopLoss) return 'SL_HIT';
    // Active if price is between SL and TP and hasn't moved too far from entry
    if (currentPrice > stopLoss && currentPrice < takeProfit) return 'ACTIVE';
  }
  if (direction === 'SHORT') {
    if (currentPrice <= takeProfit) return 'TP_HIT';
    if (currentPrice >= stopLoss) return 'SL_HIT';
    if (currentPrice < stopLoss && currentPrice > takeProfit) return 'ACTIVE';
  }
  return 'EXPIRED';
}

function StatusBadge({ status }: { status: SignalStatus }) {
  const config = {
    ACTIVE:  { label: '● ACTIVA',   color: '#34C759', bg: '#34C75920', pulse: true  },
    TP_HIT:  { label: '✓ TP',       color: '#34C759', bg: '#34C75915', pulse: false },
    SL_HIT:  { label: '✗ SL',       color: '#FF3B30', bg: '#FF3B3015', pulse: false },
    EXPIRED: { label: 'CERRADA',    color: '#636366', bg: '#2C2C2E',   pulse: false },
    PENDING: { label: 'PENDIENTE',  color: '#FF9500', bg: '#FF950015', pulse: false },
  }[status];

  return (
    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: config.color, background: config.bg }}>
      {config.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: config.color }} />}
      {config.label}
    </span>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetSeconds: number) {
  const [secs, setSecs] = useState(targetSeconds);
  useEffect(() => {
    setSecs(targetSeconds);
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [targetSeconds]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const QUANT_ASSETS = [
  { symbol: 'SPX',     name: 'S&P 500',    color: '#007AFF' },
  { symbol: 'DJI',     name: 'Dow Jones',  color: '#34C759' },
  { symbol: 'NDX',     name: 'Nasdaq',     color: '#AF52DE' },
  { symbol: 'XAU/USD', name: 'Oro',        color: '#FF9500' },
  { symbol: 'BTC/USD', name: 'Bitcoin',    color: '#F7931A' },
  { symbol: 'ETH/USD', name: 'Ethereum',   color: '#627EEA' },
  { symbol: 'EUR/USD', name: 'EUR/USD',    color: '#34C759' },
  { symbol: 'GBP/USD', name: 'GBP/USD',   color: '#8E8E93' },
  { symbol: 'USD/JPY', name: 'USD/JPY',   color: '#FF3B30' },
];

function ZScoreBar({ zScore, threshold = 2.5 }: { zScore: number; threshold?: number }) {
  const pct = Math.min(100, (Math.abs(zScore) / (threshold * 2)) * 100);
  const color = zScore > threshold ? '#FF3B30' : zScore < -threshold ? '#34C759' : '#FF9500';
  const isAnomaly = Math.abs(zScore) >= threshold;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#2C2C2E] rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 w-px bg-[#636366]" style={{ left: '50%' }} />
        {zScore >= 0 ? (
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct / 2}%` }} transition={{ duration: 0.6 }}
            className="absolute top-0 bottom-0 rounded-full" style={{ left: '50%', background: color }} />
        ) : (
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct / 2}%` }} transition={{ duration: 0.6 }}
            className="absolute top-0 bottom-0 rounded-full" style={{ right: '50%', background: color }} />
        )}
      </div>
      <span className="text-xs font-mono font-bold w-14 text-right" style={{ color: isAnomaly ? color : '#8E8E93' }}>
        {zScore >= 0 ? '+' : ''}{zScore.toFixed(2)}σ
      </span>
    </div>
  );
}

function SignalRow({ sig, isLatest, isHistorical, currentPrice }: { sig: LogAnomalySignal; isLatest?: boolean; isHistorical?: boolean; currentPrice?: number }) {
  const [open, setOpen] = useState(isLatest || false);
  const dirColor = sig.direction === 'LONG' ? '#34C759' : sig.direction === 'SHORT' ? '#FF3B30' : '#636366';
  const strengthPct = Math.round(sig.signalStrength * 100);
  const status = currentPrice ? getSignalStatus(sig, currentPrice) : 'PENDING';
  const isActive = status === 'ACTIVE';

  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isHistorical ? '#161616' : '#1C1C1E',
        border: `1px solid ${isActive ? dirColor + '60' : isLatest ? dirColor + '40' : isHistorical ? '#2C2C2E' : '#38383A'}`,
        opacity: (status === 'SL_HIT' || status === 'EXPIRED') && isHistorical ? 0.5 : 1,
      }}
      onClick={() => setOpen(!open)}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{ background: dirColor + '15' }}>
          {sig.direction === 'LONG' ? <TrendingUp size={16} color={dirColor} /> :
           sig.direction === 'SHORT' ? <TrendingDown size={16} color={dirColor} /> :
           <Activity size={16} color={dirColor} />}
          {isActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black animate-pulse"
              style={{ background: dirColor }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold" style={{ color: dirColor }}>{sig.direction}</span>
            <StatusBadge status={status} />
            {isLatest && !isHistorical && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#AF52DE20', color: '#AF52DE' }}>ÚLTIMA</span>}
            {isHistorical && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#2C2C2E', color: '#636366' }}>HIST</span>}
            {sig.isSignificant99 && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#34C75920', color: '#34C759' }}>99%</span>}
            {sig.isSignificant && !sig.isSignificant99 && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#FF950020', color: '#FF9500' }}>95%</span>}
          </div>
          <div className="text-xs text-[#636366] mt-0.5">{sig.timestamp}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold" style={{ color: dirColor }}>{strengthPct}%</div>
          <div className="text-xs text-[#636366]">fuerza</div>
        </div>
        {open ? <ChevronUp size={14} color="#636366" /> : <ChevronDown size={14} color="#636366" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 border-t border-[#38383A] pt-3 space-y-3">
              <ZScoreBar zScore={sig.zScore} />
              {/* Price progress bar vs entry */}
              {currentPrice && sig.direction !== 'NONE' && (
                <div>
                  <div className="flex justify-between text-xs text-[#636366] mb-1">
                    <span>SL {sig.stopLoss.toLocaleString()}</span>
                    <span className="font-bold" style={{ color: isActive ? dirColor : '#636366' }}>
                      Precio actual: {currentPrice.toLocaleString()}
                    </span>
                    <span>TP {sig.takeProfit.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2C2C2E' }}>
                    {(() => {
                      const range = Math.abs(sig.takeProfit - sig.stopLoss);
                      const pos = sig.direction === 'LONG'
                        ? Math.min(100, Math.max(0, ((currentPrice - sig.stopLoss) / range) * 100))
                        : Math.min(100, Math.max(0, ((sig.stopLoss - currentPrice) / range) * 100));
                      return (
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pos}%`, background: status === 'TP_HIT' ? '#34C759' : status === 'SL_HIT' ? '#FF3B30' : dirColor }} />
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl" style={{ background: '#2C2C2E' }}>
                  <span className="text-[#636366] block mb-0.5">Log Return</span>
                  <span className="font-mono font-bold text-white">{sig.logReturn >= 0 ? '+' : ''}{sig.logReturn.toFixed(6)}</span>
                </div>
                <div className="p-2 rounded-xl" style={{ background: '#2C2C2E' }}>
                  <span className="text-[#636366] block mb-0.5">p-value</span>
                  <span className="font-mono font-bold" style={{ color: sig.isSignificant99 ? '#34C759' : sig.isSignificant ? '#FF9500' : '#8E8E93' }}>
                    {sig.pValue.toFixed(5)}
                  </span>
                </div>
              </div>
              {sig.direction !== 'NONE' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl text-center" style={{ background: '#2C2C2E' }}>
                    <span className="text-xs text-[#636366] block">Entrada</span>
                    <span className="text-xs font-bold text-white">{sig.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,59,48,0.1)' }}>
                    <span className="text-xs text-[#FF3B30] block">SL 1.5xATR</span>
                    <span className="text-xs font-bold text-[#FF3B30]">{sig.stopLoss.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(52,199,89,0.1)' }}>
                    <span className="text-xs text-[#34C759] block">TP Media</span>
                    <span className="text-xs font-bold text-[#34C759]">{sig.takeProfit.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewsCard({ news }: { news: NewsImpact }) {
  const [open, setOpen] = useState(false);
  const ic = news.impact === 'bullish' ? '#34C759' : news.impact === 'bearish' ? '#FF3B30' : '#FF9500';
  const label = news.impact === 'bullish' ? '↑ Alcista' : news.impact === 'bearish' ? '↓ Bajista' : '→ Neutro';
  const dots = news.importance === 'high' ? 3 : news.importance === 'medium' ? 2 : 1;
  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
      onClick={() => setOpen(!open)}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex gap-0.5 shrink-0">
          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= dots ? (news.importance === 'high' ? '#FF3B30' : news.importance === 'medium' ? '#FF9500' : '#8E8E93') : '#2C2C2E' }} />)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">{news.headline}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#636366]">{news.time}</span>
            {news.source && <span className="text-xs text-[#38383A]">{news.source}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold" style={{ color: ic }}>{label}</span>
          {open ? <ChevronUp size={13} color="#636366" /> : <ChevronDown size={13} color="#636366" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-3 border-t border-[#38383A] pt-2">
              <p className="text-xs text-[#8E8E93] leading-relaxed">{news.reasoning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuantScreen() {
  const [analysis, setAnalysis] = useState<QuantAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('SPX');
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'news' | 'metrics'>('signals');
  const [signalHistory, setSignalHistory] = useState<StoredSignal[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(900); // 15 min = 900 sec
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const countdown = useCountdown(nextRefreshIn);

  const refreshHistory = useCallback((sym: string) => {
    setSignalHistory(loadSignalHistory(sym));
  }, []);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await runQuantAnalysis(sym);
      setAnalysis(result);
      refreshHistory(sym);
      setNextRefreshIn(900); // reset countdown
    } catch (e) {
      setError('Error al ejecutar el modelo. Verifica tu conexion.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [refreshHistory]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    load(symbol);
    refreshHistory(symbol);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          load(symbol);
          return 900;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [symbol, load, refreshHistory]);

  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    setShowPicker(false);
    setAnalysis(null);
    setSignalHistory([]);
    setNextRefreshIn(900);
    load(sym);
  };

  const handleClearHistory = () => {
    clearSignalHistory(symbol);
    setSignalHistory([]);
  };

  const handleManualRefresh = () => {
    setNextRefreshIn(900);
    load(symbol);
  };

  const asset = QUANT_ASSETS.find(a => a.symbol === symbol) || QUANT_ASSETS[0];
  const regimeLabel: Record<string, string> = {
    trending_up: 'Tendencia Alcista', trending_down: 'Tendencia Bajista',
    ranging: 'Rango / Lateral', volatile: 'Alta Volatilidad',
  };
  const regimeColor: Record<string, string> = {
    trending_up: '#34C759', trending_down: '#FF3B30', ranging: '#FF9500', volatile: '#AF52DE',
  };

  const lastSig = analysis?.metrics.lastSignal;
  const lastSigColor = lastSig?.direction === 'LONG' ? '#34C759' : lastSig?.direction === 'SHORT' ? '#FF3B30' : '#636366';

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 md:px-8 py-4"
        style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-2 mb-0.5">
              <span className="text-xl font-black text-white">{symbol}</span>
              <span className="text-sm font-medium" style={{ color: asset.color }}>{asset.name}</span>
              <ChevronDown size={15} color="#636366" />
            </button>
            {analysis && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">
                  {analysis.currentPrice > 10 ? '$' : ''}{analysis.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-bold" style={{ color: analysis.priceChange >= 0 ? '#34C759' : '#FF3B30' }}>
                  {analysis.priceChange >= 0 ? '+' : ''}{analysis.priceChange.toFixed(2)} ({analysis.priceChangePct >= 0 ? '+' : ''}{analysis.priceChangePct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {analysis && (
              <div className="flex items-center gap-1 text-xs" style={{ color: analysis.isMarketOpen ? '#34C759' : '#636366' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: analysis.isMarketOpen ? '#34C759' : '#636366' }} />
                <span>{analysis.isMarketOpen ? 'Abierto' : 'Cerrado'}</span>
                <span className="text-[#38383A] ml-1">{analysis.nyTime} NY</span>
              </div>
            )}
            {/* Auto-refresh countdown */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
              <Timer size={11} color="#FF9500" />
              <span className="text-[#FF9500] font-bold">{countdown}</span>
            </div>
            <button onClick={handleManualRefresh} disabled={loading}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
              <RefreshCw size={15} color="#8E8E93" className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Asset picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-3 flex flex-wrap gap-2">
              {QUANT_ASSETS.map(a => (
                <button key={a.symbol} onClick={() => handleSymbolChange(a.symbol)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: symbol === a.symbol ? a.color : '#1C1C1E', color: symbol === a.symbol ? '#000' : '#8E8E93', border: `1px solid ${symbol === a.symbol ? a.color : '#38383A'}` }}>
                  {a.symbol}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading */}
      {loading && !analysis && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <BarChart2 size={32} color={asset.color} />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-bold">Ejecutando Modelo Cuant</p>
            <p className="text-xs text-[#636366] mt-1">Calculando anomalias logaritmicas ±2.5σ...</p>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: asset.color }}
                animate={{ scale: [0,1,0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <AlertTriangle size={28} color="#FF3B30" className="mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Error del modelo</p>
            <p className="text-xs text-[#636366] mb-4">{error}</p>
            <button onClick={() => load(symbol)} className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm">Reintentar</button>
          </div>
        </div>
      )}

      {/* Content */}
      {analysis && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 md:px-8 pb-8">

            {/* AI Summary + regime */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: `1px solid ${asset.color}25` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} color={asset.color} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: asset.color }}>Modelo Cuant — Log Anomaly</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: regimeColor[analysis.marketRegime] || '#FF9500', background: (regimeColor[analysis.marketRegime] || '#FF9500') + '20' }}>
                  {regimeLabel[analysis.marketRegime] || analysis.marketRegime}
                </span>
              </div>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{analysis.aiSummary}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#636366]">
                <Clock size={10} />
                <span>Proxima señal: {analysis.nextSignalWindow}</span>
              </div>
            </motion.div>

            {/* Last signal highlight */}
            {lastSig && lastSig.direction !== 'NONE' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-3 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: `1px solid ${lastSigColor}40` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {lastSig.direction === 'LONG' ? <TrendingUp size={16} color={lastSigColor} /> : <TrendingDown size={16} color={lastSigColor} />}
                    <span className="text-sm font-bold" style={{ color: lastSigColor }}>Ultima Señal: {lastSig.direction}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: lastSigColor, background: lastSigColor + '20' }}>
                    {Math.round(lastSig.signalStrength * 100)}% fuerza
                  </span>
                </div>
                <ZScoreBar zScore={lastSig.zScore} />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 rounded-xl" style={{ background: '#2C2C2E' }}>
                    <span className="text-xs text-[#636366] block">Entrada</span>
                    <span className="text-xs font-bold text-white">{lastSig.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,59,48,0.1)' }}>
                    <span className="text-xs text-[#FF3B30] block">SL</span>
                    <span className="text-xs font-bold text-[#FF3B30]">{lastSig.stopLoss.toLocaleString()}</span>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(52,199,89,0.1)' }}>
                    <span className="text-xs text-[#34C759] block">TP Media</span>
                    <span className="text-xs font-bold text-[#34C759]">{lastSig.takeProfit.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex p-1 rounded-xl mt-4 mb-4" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
              {[
                { key: 'signals', label: 'Señales', Icon: Activity },
                { key: 'news', label: 'Noticias', Icon: AlertTriangle },
                { key: 'metrics', label: 'Metricas', Icon: BarChart2 },
              ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: activeTab === key ? '#2C2C2E' : 'transparent', color: activeTab === key ? '#FFFFFF' : '#636366' }}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {/* Signals tab */}
            {activeTab === 'signals' && (
              <div className="space-y-2">
                {/* Current session signals */}
                {analysis.signals.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                      <span className="text-xs font-bold text-[#34C759] uppercase tracking-wider">
                        Señales actuales — {analysis.signals.length} detectadas
                      </span>
                    </div>
                    {[...analysis.signals].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15).map((sig, i) => (
                      <SignalRow key={sig.timestamp + i} sig={sig} isLatest={i === 0} currentPrice={analysis.currentPrice} />
                    ))}
                  </>
                )}

                {analysis.signals.length === 0 && (
                  <div className="text-center py-6 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                    <Activity size={28} color="#38383A" className="mx-auto mb-3" />
                    <p className="text-sm text-[#636366]">Sin anomalias en la sesion actual</p>
                    <p className="text-xs text-[#38383A] mt-1">El modelo requiere |Z-Score| {'>='} 2.5σ</p>
                  </div>
                )}

                {/* Historical signals */}
                {signalHistory.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2"
                      style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
                    >
                      <div className="flex items-center gap-2">
                        <History size={14} color="#636366" />
                        <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                          Historial — {signalHistory.length} señales guardadas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClearHistory(); }}
                          className="p-1 rounded-lg"
                          style={{ background: 'rgba(255,59,48,0.1)' }}
                        >
                          <Trash2 size={12} color="#FF3B30" />
                        </button>
                        {showHistory ? <ChevronUp size={14} color="#636366" /> : <ChevronDown size={14} color="#636366" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {showHistory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          {signalHistory.slice(0, 50).map((sig, i) => (
                            <SignalRow key={sig.timestamp + sig.symbol + i} sig={sig} isLatest={false} isHistorical currentPrice={analysis.currentPrice} />
                          ))}
                          {signalHistory.length > 50 && (
                            <p className="text-xs text-[#38383A] text-center py-2">
                              Mostrando 50 de {signalHistory.length} señales históricas
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {analysis.signals.length === 0 && signalHistory.length === 0 && (
                  <p className="text-xs text-[#38383A] text-center mt-2">
                    El historial se acumula con cada análisis. Vuelve durante el horario de mercado (9:30–16:00 NY).
                  </p>
                )}
              </div>
            )}

            {/* News tab */}
            {activeTab === 'news' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} color="#FF9500" />
                  <span className="text-xs text-[#8E8E93]">Noticias recientes y su impacto en {analysis.assetName}.</span>
                </div>
                {analysis.newsImpacts.length === 0 && (
                  <p className="text-xs text-[#636366] text-center py-6">No se encontraron noticias recientes.</p>
                )}
                {analysis.newsImpacts.map((n, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <NewsCard news={n} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Metrics tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Anomalias', value: analysis.metrics.totalSignals, color: '#FF9500' },
                    { label: 'Sig. 95%', value: analysis.metrics.significantSignals, color: '#34C759' },
                    { label: 'Sig. 99%', value: analysis.metrics.significantSignals99, color: '#007AFF' },
                    { label: 'Tasa Anomalia', value: analysis.metrics.anomalyRate + '%', color: '#AF52DE' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                      <span className="text-xs text-[#636366] block mb-1">{label}</span>
                      <span className="text-2xl font-black" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <span className="text-xs font-bold text-[#636366] uppercase tracking-wider block mb-3">Parametros del Modelo</span>
                  {[
                    ['Ventana (Media Movil)', '30 barras'],
                    ['Umbral (σ)', '±2.5 desv. estandar'],
                    ['Max Hold', '8 barras (2h en 15m)'],
                    ['Intervalo', '15 minutos'],
                    ['Confianza', '95% (p < 0.05)'],
                    ['Estrategia', 'Mean Reversion'],
                    ['Z-Score Max', analysis.metrics.zScoreMax.toFixed(4)],
                    ['Z-Score Min', analysis.metrics.zScoreMin.toFixed(4)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5 border-b border-[#2C2C2E] last:border-0">
                      <span className="text-xs text-[#8E8E93]">{k}</span>
                      <span className="text-xs font-mono font-bold text-white">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#38383A] text-center leading-relaxed">
                  Modelo Log-Anomaly: detecta anomalias estadisticas en rendimientos logaritmicos. Señales se generan a las 9:30 AM NY y cada 15 min durante RTH.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
