import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, Activity, BarChart2, Newspaper } from 'lucide-react';
import { runQuantAnalysis, type QuantAnalysis, type LogAnomalySignal, type NewsImpact, loadSignalHistory, clearSignalHistory, type StoredSignal } from '@/lib/quantModel';

// ─── Types ────────────────────────────────────────────────────────────────────

type SignalStatus = 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'EXPIRED' | 'PENDING';

function getSignalStatus(sig: LogAnomalySignal, currentPrice: number): SignalStatus {
  if (sig.direction === 'NONE') return 'EXPIRED';
  if (!currentPrice || currentPrice <= 0) return 'PENDING';
  const { direction, stopLoss, takeProfit } = sig;
  if (direction === 'LONG') {
    if (currentPrice >= takeProfit) return 'TP_HIT';
    if (currentPrice <= stopLoss) return 'SL_HIT';
    if (currentPrice > stopLoss && currentPrice < takeProfit) return 'ACTIVE';
  }
  if (direction === 'SHORT') {
    if (currentPrice <= takeProfit) return 'TP_HIT';
    if (currentPrice >= stopLoss) return 'SL_HIT';
    if (currentPrice < stopLoss && currentPrice > takeProfit) return 'ACTIVE';
  }
  return 'EXPIRED';
}

function useCountdown(targetSeconds: number) {
  const [secs, setSecs] = useState(targetSeconds);
  useEffect(() => {
    setSecs(targetSeconds);
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [targetSeconds]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const QUANT_ASSETS = [
  { symbol: 'SPX',     name: 'S&P 500',   color: '#007AFF' },
  { symbol: 'DJI',     name: 'Dow Jones', color: '#34C759' },
  { symbol: 'NDX',     name: 'Nasdaq',    color: '#AF52DE' },
  { symbol: 'XAU/USD', name: 'Oro',       color: '#FF9500' },
  { symbol: 'BTC/USD', name: 'Bitcoin',   color: '#F7931A' },
  { symbol: 'ETH/USD', name: 'Ethereum',  color: '#627EEA' },
  { symbol: 'EUR/USD', name: 'EUR/USD',   color: '#34C759' },
  { symbol: 'GBP/USD', name: 'GBP/USD',  color: '#8E8E93' },
  { symbol: 'USD/JPY', name: 'USD/JPY',  color: '#FF3B30' },
];

const TF_MINUTES: Record<string, number> = { '15min': 15, '1h': 60, '4h': 240 };

// ─── Signal Card minimalista ──────────────────────────────────────────────────

function SignalCard({ sig, currentPrice, isLatest }: { sig: LogAnomalySignal; currentPrice?: number; isLatest?: boolean }) {
  const [open, setOpen] = useState(isLatest || false);
  const dir = sig.direction;
  const color = dir === 'LONG' ? '#34C759' : dir === 'SHORT' ? '#FF3B30' : '#636366';
  const status = currentPrice ? getSignalStatus(sig, currentPrice) : 'PENDING';
  const strength = Math.round(sig.signalStrength * 100);

  const statusLabel: Record<SignalStatus, string> = {
    ACTIVE: 'Activa', TP_HIT: 'TP ✓', SL_HIT: 'SL ✗', EXPIRED: 'Cerrada', PENDING: 'Pendiente',
  };
  const statusColor: Record<SignalStatus, string> = {
    ACTIVE: '#34C759', TP_HIT: '#34C759', SL_HIT: '#FF3B30', EXPIRED: '#636366', PENDING: '#FF9500',
  };

  return (
    <div onClick={() => setOpen(!open)} className="rounded-2xl cursor-pointer transition-all"
      style={{ background: '#1C1C1E', border: `1px solid ${status === 'ACTIVE' ? color + '50' : '#2C2C2E'}` }}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Dirección */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{ background: color + '15' }}>
          {dir === 'LONG' ? <TrendingUp size={18} color={color} /> : <TrendingDown size={18} color={color} />}
          {status === 'ACTIVE' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black animate-pulse"
              style={{ background: color }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color }}>{dir}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: statusColor[status], background: statusColor[status] + '15' }}>
              {statusLabel[status]}
            </span>
          </div>
          <span className="text-xs text-[#636366]">{sig.timestamp}</span>
        </div>

        {/* Fuerza */}
        <div className="text-right shrink-0">
          <div className="text-sm font-bold" style={{ color }}>{strength}%</div>
          <div className="text-xs text-[#636366]">{sig.zScore >= 0 ? '+' : ''}{sig.zScore.toFixed(1)}σ</div>
        </div>
        {open ? <ChevronUp size={14} color="#636366" /> : <ChevronDown size={14} color="#636366" />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 pt-1 border-t border-[#2C2C2E] space-y-3">
              {/* Niveles */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl text-center" style={{ background: '#2C2C2E' }}>
                  <div className="text-xs text-[#636366] mb-0.5">Entrada</div>
                  <div className="text-xs font-bold text-white">{sig.entryPrice.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,59,48,0.1)' }}>
                  <div className="text-xs text-[#FF3B30] mb-0.5">Stop</div>
                  <div className="text-xs font-bold text-[#FF3B30]">{sig.stopLoss.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(52,199,89,0.1)' }}>
                  <div className="text-xs text-[#34C759] mb-0.5">Target</div>
                  <div className="text-xs font-bold text-[#34C759]">{sig.takeProfit.toLocaleString()}</div>
                </div>
              </div>
              {/* Barra de progreso */}
              {currentPrice && dir !== 'NONE' && (
                <div>
                  <div className="flex justify-between text-xs text-[#636366] mb-1">
                    <span>SL</span>
                    <span style={{ color: statusColor[status] }}>Precio: {currentPrice.toLocaleString()}</span>
                    <span>TP</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2C2C2E' }}>
                    {(() => {
                      const range = Math.abs(sig.takeProfit - sig.stopLoss);
                      const pos = dir === 'LONG'
                        ? Math.min(100, Math.max(0, ((currentPrice - sig.stopLoss) / range) * 100))
                        : Math.min(100, Math.max(0, ((sig.stopLoss - currentPrice) / range) * 100));
                      return <div className="h-full rounded-full" style={{ width: `${pos}%`, background: statusColor[status] }} />;
                    })()}
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

// ─── News Card minimalista ────────────────────────────────────────────────────

function NewsCard({ news }: { news: NewsImpact }) {
  const [open, setOpen] = useState(false);
  const color = news.impact === 'bullish' ? '#34C759' : news.impact === 'bearish' ? '#FF3B30' : '#FF9500';
  const arrow = news.impact === 'bullish' ? '↑' : news.impact === 'bearish' ? '↓' : '→';
  return (
    <div onClick={() => setOpen(!open)} className="rounded-2xl cursor-pointer"
      style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-base shrink-0" style={{ color }}>{arrow}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">{news.headline}</div>
          <div className="text-xs text-[#636366] mt-0.5">{news.time}</div>
        </div>
        {open ? <ChevronUp size={13} color="#636366" /> : <ChevronDown size={13} color="#636366" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-3 pt-1 border-t border-[#2C2C2E]">
              <p className="text-xs text-[#8E8E93] leading-relaxed">{news.reasoning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QuantScreen() {
  const [analysis, setAnalysis] = useState<QuantAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('SPX');
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'news'>('signals');
  const [signalHistory, setSignalHistory] = useState<StoredSignal[]>([]);
  const [timeframe, setTimeframe] = useState<'15min' | '1h' | '4h'>('15min');
  const [signalExpiry, setSignalExpiry] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const expiryCountdown = useCountdown(signalExpiry);

  const refreshHistory = useCallback((sym: string) => {
    setSignalHistory(loadSignalHistory(sym));
  }, []);

  const load = useCallback(async (sym: string, tf = timeframe) => {
    setLoading(true);
    setError(null);
    try {
      const result = await runQuantAnalysis(sym);
      setAnalysis(result);
      refreshHistory(sym);
      if (result.metrics.lastSignal?.direction !== 'NONE') {
        setSignalExpiry(8 * TF_MINUTES[tf] * 60);
      }
    } catch (e) {
      setError('No se pudo ejecutar el análisis.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [refreshHistory, timeframe]);

  useEffect(() => {
    load(symbol);
    refreshHistory(symbol);
    countdownRef.current = setInterval(() => load(symbol), 15 * 60 * 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [symbol]);

  const asset = QUANT_ASSETS.find(a => a.symbol === symbol) || QUANT_ASSETS[0];
  const lastSig = analysis?.metrics.lastSignal;
  const lastSigColor = lastSig?.direction === 'LONG' ? '#34C759' : lastSig?.direction === 'SHORT' ? '#FF3B30' : '#636366';
  const hasSignal = lastSig && lastSig.direction !== 'NONE';

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-5 py-4"
        style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}>
        <div className="flex items-center justify-between">

          {/* Activo + precio */}
          <button onClick={() => setShowPicker(!showPicker)} className="flex items-start flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-white">{symbol}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: asset.color, background: asset.color + '20' }}>{asset.name}</span>
              <ChevronDown size={13} color="#636366" />
            </div>
            {analysis && (
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white">
                  {analysis.currentPrice > 10 ? '$' : ''}{analysis.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold" style={{ color: analysis.priceChange >= 0 ? '#34C759' : '#FF3B30' }}>
                  {analysis.priceChange >= 0 ? '+' : ''}{analysis.priceChangePct.toFixed(2)}%
                </span>
              </div>
            )}
          </button>

          {/* Botón único */}
          <button onClick={() => load(symbol)} disabled={loading}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
            style={{ background: loading ? '#1C1C1E' : 'linear-gradient(135deg, #AF52DE, #007AFF)', border: loading ? '1px solid #38383A' : 'none' }}>
            <RefreshCw size={16} color="#FFFFFF" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Asset picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="mt-3 flex flex-wrap gap-1.5">
              {QUANT_ASSETS.map(a => (
                <button key={a.symbol} onClick={() => { setSymbol(a.symbol); setShowPicker(false); setAnalysis(null); load(a.symbol); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: symbol === a.symbol ? a.color : '#1C1C1E', color: symbol === a.symbol ? '#000' : '#8E8E93', border: `1px solid ${symbol === a.symbol ? a.color : '#2C2C2E'}` }}>
                  {a.symbol}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LOADING ── */}
      {loading && !analysis && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <BarChart2 size={28} color={asset.color} />
          </motion.div>
          <p className="text-sm text-[#636366]">Calculando anomalías...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-white font-semibold mb-2">Error del modelo</p>
            <p className="text-xs text-[#636366] mb-4">{error}</p>
            <button onClick={() => load(symbol)}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      {analysis && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 pb-8 space-y-3 pt-4">

            {/* ── SEÑAL ACTIVA + CRONÓMETRO ── */}
            {hasSignal && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4"
                style={{ background: lastSigColor + '10', border: `1px solid ${lastSigColor}35` }}>
                <div className="flex items-center justify-between">
                  {/* Dirección */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: lastSigColor + '20' }}>
                      {lastSig!.direction === 'LONG'
                        ? <TrendingUp size={22} color={lastSigColor} />
                        : <TrendingDown size={22} color={lastSigColor} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black" style={{ color: lastSigColor }}>
                          {lastSig!.direction}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: lastSigColor }} />
                      </div>
                      <div className="text-xs text-[#8E8E93]">
                        {lastSig!.entryPrice.toLocaleString()} · {Math.round(lastSig!.signalStrength * 100)}% fuerza
                      </div>
                    </div>
                  </div>

                  {/* Cronómetro */}
                  {signalExpiry > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-[#636366] mb-0.5">Vigencia</div>
                      <div className="font-mono font-black text-2xl leading-none"
                        style={{ color: signalExpiry < 300 ? '#FF3B30' : signalExpiry < 900 ? '#FF9500' : lastSigColor }}>
                        {expiryCountdown}
                      </div>
                    </div>
                  )}
                </div>

                {/* SL / TP */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 rounded-xl text-center" style={{ background: '#00000030' }}>
                    <div className="text-xs text-[#636366]">Entrada</div>
                    <div className="text-xs font-bold text-white">{lastSig!.entryPrice.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,59,48,0.12)' }}>
                    <div className="text-xs text-[#FF3B30]">Stop</div>
                    <div className="text-xs font-bold text-[#FF3B30]">{lastSig!.stopLoss.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(52,199,89,0.12)' }}>
                    <div className="text-xs text-[#34C759]">Target</div>
                    <div className="text-xs font-bold text-[#34C759]">{lastSig!.takeProfit.toLocaleString()}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TEMPORALIDAD + RESUMEN ── */}
            <div className="rounded-2xl p-4" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
              {/* Selector de temporalidad */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#636366]">Temporalidad</span>
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #2C2C2E' }}>
                  {(['15min', '1h', '4h'] as const).map((tf) => (
                    <button key={tf} onClick={() => { setTimeframe(tf); load(symbol, tf); }}
                      className="px-3 py-1 text-xs font-bold transition-all"
                      style={{ background: timeframe === tf ? asset.color : 'transparent', color: timeframe === tf ? '#000' : '#636366' }}>
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen IA */}
              <p className="text-sm text-[#8E8E93] leading-relaxed">{analysis.aiSummary}</p>

              {/* Régimen */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#636366]">
                  {analysis.isMarketOpen ? '● Mercado abierto' : '○ Mercado cerrado'} · {analysis.nyTime} NY
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: { trending_up: '#34C759', trending_down: '#FF3B30', ranging: '#FF9500', volatile: '#AF52DE' }[analysis.marketRegime] || '#FF9500',
                    background: ({ trending_up: '#34C75920', trending_down: '#FF3B3020', ranging: '#FF950020', volatile: '#AF52DE20' }[analysis.marketRegime] || '#FF950020'),
                  }}>
                  {{ trending_up: 'Alcista', trending_down: 'Bajista', ranging: 'Lateral', volatile: 'Volátil' }[analysis.marketRegime] || analysis.marketRegime}
                </span>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex rounded-xl overflow-hidden" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
              {[
                { key: 'signals', label: 'Señales', Icon: Activity },
                { key: 'news', label: 'Noticias', Icon: Newspaper },
              ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
                  style={{ background: activeTab === key ? '#2C2C2E' : 'transparent', color: activeTab === key ? '#FFFFFF' : '#636366' }}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {/* ── SEÑALES ── */}
            {activeTab === 'signals' && (
              <div className="space-y-2">
                {analysis.signals.length === 0 && signalHistory.length === 0 && (
                  <div className="text-center py-8 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
                    <Activity size={24} color="#38383A" className="mx-auto mb-2" />
                    <p className="text-sm text-[#636366]">Sin anomalías detectadas</p>
                    <p className="text-xs text-[#38383A] mt-1">Pulsa el botón para analizar</p>
                  </div>
                )}

                {/* Señales actuales */}
                {analysis.signals.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-[#34C759] uppercase tracking-wider px-1">
                      {analysis.signals.length} señal{analysis.signals.length > 1 ? 'es' : ''} detectada{analysis.signals.length > 1 ? 's' : ''}
                    </p>
                    {[...analysis.signals]
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      .slice(0, 10)
                      .map((sig, i) => (
                        <SignalCard key={sig.timestamp + i} sig={sig} currentPrice={analysis.currentPrice} isLatest={i === 0} />
                      ))}
                  </>
                )}

                {/* Historial */}
                {signalHistory.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-xs text-[#636366]">Historial ({signalHistory.length})</p>
                      <button onClick={() => { clearSignalHistory(symbol); setSignalHistory([]); }}
                        className="text-xs text-[#FF3B30]">Limpiar</button>
                    </div>
                    {signalHistory.slice(0, 20).map((sig, i) => (
                      <div key={sig.timestamp + i} className="mb-2">
                        <SignalCard sig={sig} currentPrice={analysis.currentPrice} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── NOTICIAS ── */}
            {activeTab === 'news' && (
              <div className="space-y-2">
                {analysis.newsImpacts.length === 0 && (
                  <div className="text-center py-8 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #2C2C2E' }}>
                    <Newspaper size={24} color="#38383A" className="mx-auto mb-2" />
                    <p className="text-sm text-[#636366]">Sin noticias recientes</p>
                  </div>
                )}
                {analysis.newsImpacts.map((n, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <NewsCard news={n} />
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
