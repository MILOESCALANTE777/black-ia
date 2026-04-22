import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Newspaper,
  Target,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { analyzeNewsSignals, type NewsSignal, type NewsSignalsResponse } from '@/lib/newsSignals';

// ─── Asset selector ───────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: 'XAU/USD', name: 'Oro', emoji: '🥇' },
  { symbol: 'BTC/USD', name: 'Bitcoin', emoji: '₿' },
  { symbol: 'ETH/USD', name: 'Ethereum', emoji: 'Ξ' },
  { symbol: 'EUR/USD', name: 'EUR/USD', emoji: '💶' },
  { symbol: 'GBP/USD', name: 'GBP/USD', emoji: '💷' },
  { symbol: 'USD/JPY', name: 'USD/JPY', emoji: '💴' },
  { symbol: 'AAPL', name: 'Apple', emoji: '🍎' },
  { symbol: 'TSLA', name: 'Tesla', emoji: '🚗' },
  { symbol: 'NVDA', name: 'NVIDIA', emoji: '🎮' },
  { symbol: 'SPX', name: 'S&P 500', emoji: '📈' },
  { symbol: 'WTI', name: 'Petróleo', emoji: '🛢️' },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SentimentIcon({ sentiment, size = 18 }: { sentiment: string; size?: number }) {
  if (sentiment === 'bullish') return <TrendingUp size={size} color="#34C759" />;
  if (sentiment === 'bearish') return <TrendingDown size={size} color="#FF3B30" />;
  return <Minus size={size} color="#FF9500" />;
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: { bg: '#FF3B3020', text: '#FF3B30', label: 'ALTO' },
    medium: { bg: '#FF950020', text: '#FF9500', label: 'MEDIO' },
    low: { bg: '#8E8E9320', text: '#8E8E93', label: 'BAJO' },
  };
  const c = colors[impact];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    BUY: { bg: '#34C75920', text: '#34C759' },
    SELL: { bg: '#FF3B3020', text: '#FF3B30' },
    HOLD: { bg: '#FF950020', text: '#FF9500' },
    WAIT: { bg: '#8E8E9320', text: '#8E8E93' },
  };
  const c = colors[action] || colors.WAIT;
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{ background: c.bg, color: c.text }}
    >
      {action}
    </span>
  );
}

function TimingBadge({ timing }: { timing: string }) {
  const labels: Record<string, string> = {
    IMMEDIATE: '⚡ Inmediato',
    WAIT_15MIN: '⏱️ 15 min',
    WAIT_30MIN: '⏱️ 30 min',
    WAIT_1H: '⏱️ 1 hora',
    WAIT_CONFIRMATION: '⏳ Esperar confirmación',
  };
  return (
    <span className="text-[10px] text-[#636366] font-medium">
      {labels[timing] || timing}
    </span>
  );
}

// ─── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, index }: { signal: NewsSignal; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const sentimentColor =
    signal.sentiment === 'bullish'
      ? '#34C759'
      : signal.sentiment === 'bearish'
      ? '#FF3B30'
      : '#FF9500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#1C1C1E',
        border: `1px solid ${expanded ? sentimentColor + '40' : '#38383A'}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex flex-col gap-3"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: sentimentColor + '15' }}
            >
              <SentimentIcon sentiment={signal.sentiment} size={16} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                {signal.title}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-[#636366]">{signal.source}</span>
                <span className="text-[10px] text-[#38383A]">•</span>
                <div className="flex items-center gap-1">
                  <Clock size={9} color="#636366" />
                  <span className="text-[10px] text-[#636366]">{signal.publishedTime}</span>
                </div>
              </div>
            </div>
          </div>
          {expanded ? (
            <ChevronUp size={16} color="#636366" className="shrink-0 mt-1" />
          ) : (
            <ChevronDown size={16} color="#636366" className="shrink-0 mt-1" />
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ImpactBadge impact={signal.impact} />
          <ActionBadge action={signal.tradingSignal.action} />
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: sentimentColor + '20', color: sentimentColor }}
          >
            {signal.confidence}%
          </span>
          {signal.tradingSignal.volatilityWarning && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF3B3015]">
              <AlertTriangle size={9} color="#FF3B30" />
              <span className="text-[10px] text-[#FF3B30] font-medium">Alta volatilidad</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#38383A]"
          >
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  {signal.analysis.summary}
                </p>
              </div>

              {/* Trading signal */}
              <div
                className="p-3 rounded-xl"
                style={{ background: sentimentColor + '10', border: `1px solid ${sentimentColor}30` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} color={sentimentColor} />
                  <span className="text-xs font-semibold" style={{ color: sentimentColor }}>
                    Señal de Trading
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#636366]">Acción</span>
                    <ActionBadge action={signal.tradingSignal.action} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#636366]">Timing</span>
                    <TimingBadge timing={signal.tradingSignal.timing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#636366]">Movimiento esperado</span>
                    <span className="text-xs font-medium text-white">
                      {signal.tradingSignal.expectedMove}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#636366]">Ventana de entrada</span>
                    <span className="text-xs font-medium text-white">
                      {signal.tradingSignal.entryWindow}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price targets */}
              {signal.priceTargets && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl" style={{ background: '#2C2C2E' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Target size={9} color="#636366" />
                      <span className="text-[10px] text-[#636366]">Corto plazo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {signal.priceTargets.shortTerm.direction === 'up' ? (
                        <TrendingUp size={12} color="#34C759" />
                      ) : (
                        <TrendingDown size={12} color="#FF3B30" />
                      )}
                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            signal.priceTargets.shortTerm.direction === 'up'
                              ? '#34C759'
                              : '#FF3B30',
                        }}
                      >
                        {signal.priceTargets.shortTerm.percentage > 0 ? '+' : ''}
                        {signal.priceTargets.shortTerm.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: '#2C2C2E' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Target size={9} color="#636366" />
                      <span className="text-[10px] text-[#636366]">Mediano plazo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {signal.priceTargets.mediumTerm.direction === 'up' ? (
                        <TrendingUp size={12} color="#34C759" />
                      ) : (
                        <TrendingDown size={12} color="#FF3B30" />
                      )}
                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            signal.priceTargets.mediumTerm.direction === 'up'
                              ? '#34C759'
                              : '#FF3B30',
                        }}
                      >
                        {signal.priceTargets.mediumTerm.percentage > 0 ? '+' : ''}
                        {signal.priceTargets.mediumTerm.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Market impact */}
              <div>
                <span className="text-[10px] text-[#636366] uppercase tracking-wider block mb-1.5">
                  Impacto en el mercado
                </span>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  {signal.analysis.marketImpact}
                </p>
              </div>

              {/* Reasoning */}
              <div>
                <span className="text-[10px] text-[#636366] uppercase tracking-wider block mb-1.5">
                  Razonamiento
                </span>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  {signal.analysis.reasoning}
                </p>
              </div>

              {/* Key factors */}
              {signal.analysis.keyFactors.length > 0 && (
                <div>
                  <span className="text-[10px] text-[#636366] uppercase tracking-wider block mb-2">
                    Factores clave a monitorear
                  </span>
                  <div className="space-y-1.5">
                    {signal.analysis.keyFactors.map((factor, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#34C759] text-xs mt-0.5">•</span>
                        <span className="text-xs text-[#8E8E93]">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical context */}
              {signal.analysis.historicalContext && (
                <div>
                  <span className="text-[10px] text-[#636366] uppercase tracking-wider block mb-1.5">
                    Contexto histórico
                  </span>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    {signal.analysis.historicalContext}
                  </p>
                </div>
              )}

              {/* Affected assets */}
              {signal.affectedAssets.length > 0 && (
                <div>
                  <span className="text-[10px] text-[#636366] uppercase tracking-wider block mb-2">
                    Activos afectados
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {signal.affectedAssets.map((asset) => (
                      <span
                        key={asset}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
                        style={{ background: '#2C2C2E' }}
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NewsSignalsScreen() {
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [selectedAsset, setSelectedAsset] = useState('XAU/USD');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<NewsSignalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSignals = async (symbol: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeNewsSignals(symbol);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Error al cargar señales. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSignals(selectedAsset);
  }, [selectedAsset]);

  const handleClose = () => setActiveTab('home');

  const selectedAssetData = ASSETS.find((a) => a.symbol === selectedAsset);

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 md:py-5 border-b border-[#1C1C1E]"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <button onClick={handleClose} className="p-1">
          <X size={22} color="#FFFFFF" />
        </button>
        <h3 className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          Señales de Noticias
        </h3>
        <button
          onClick={() => loadSignals(selectedAsset)}
          disabled={isLoading}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#1C1C1E' }}
        >
          <RefreshCw size={14} color="#8E8E93" className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Asset selector */}
      <div className="shrink-0 px-5 md:px-8 py-4 border-b border-[#1C1C1E]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset.symbol)}
              className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                background: selectedAsset === asset.symbol ? '#007AFF' : '#1C1C1E',
                color: selectedAsset === asset.symbol ? '#FFFFFF' : '#8E8E93',
              }}
            >
              {asset.emoji} {asset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 md:px-8 py-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Newspaper size={36} color="#007AFF" />
            </motion.div>
            <p className="text-sm text-[#636366]">Analizando noticias recientes...</p>
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-2xl text-sm text-[#FF3B30]"
            style={{ background: '#FF3B3015', border: '1px solid #FF3B3030' }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-4 pb-8">
            {/* Summary card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl"
              style={{
                background: '#1C1C1E',
                border: `1px solid ${
                  data.summary.overallSentiment === 'bullish'
                    ? '#34C75940'
                    : data.summary.overallSentiment === 'bearish'
                    ? '#FF3B3040'
                    : '#FF950040'
                }`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedAssetData?.emoji}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{data.assetName}</h4>
                    <span className="text-xs text-[#636366]">{data.asset}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#636366]">Sentimiento general</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <SentimentIcon sentiment={data.summary.overallSentiment} size={16} />
                    <span
                      className="text-sm font-bold uppercase"
                      style={{
                        color:
                          data.summary.overallSentiment === 'bullish'
                            ? '#34C759'
                            : data.summary.overallSentiment === 'bearish'
                            ? '#FF3B30'
                            : '#FF9500',
                      }}
                    >
                      {data.summary.overallSentiment === 'bullish'
                        ? 'Alcista'
                        : data.summary.overallSentiment === 'bearish'
                        ? 'Bajista'
                        : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded-xl text-center" style={{ background: '#2C2C2E' }}>
                  <div className="text-lg font-bold text-white">{data.summary.totalSignals}</div>
                  <div className="text-[9px] text-[#636366] uppercase">Total</div>
                </div>
                <div className="p-2 rounded-xl text-center" style={{ background: '#FF3B3015' }}>
                  <div className="text-lg font-bold text-[#FF3B30]">{data.summary.highImpact}</div>
                  <div className="text-[9px] text-[#636366] uppercase">Alto impacto</div>
                </div>
                <div className="p-2 rounded-xl text-center" style={{ background: '#34C75915' }}>
                  <div className="text-lg font-bold text-[#34C759]">
                    {data.summary.bullishSignals}
                  </div>
                  <div className="text-[9px] text-[#636366] uppercase">Alcistas</div>
                </div>
                <div className="p-2 rounded-xl text-center" style={{ background: '#FF3B3015' }}>
                  <div className="text-lg font-bold text-[#FF3B30]">
                    {data.summary.bearishSignals}
                  </div>
                  <div className="text-[9px] text-[#636366] uppercase">Bajistas</div>
                </div>
              </div>

              <p className="text-xs text-[#8E8E93] leading-relaxed">
                {data.summary.recommendedAction}
              </p>
            </motion.div>

            {/* Signals list */}
            {data.signals.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper size={40} color="#38383A" className="mx-auto mb-3" />
                <p className="text-sm text-[#636366]">
                  No hay señales recientes para este activo
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.signals.map((signal, i) => (
                  <SignalCard key={signal.id} signal={signal} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
