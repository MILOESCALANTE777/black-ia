import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, X, TrendingUp, TrendingDown, Trash2, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trade {
  id: string;
  asset: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  size: number;       // lotes / contratos
  date: string;
  notes: string;
  pl: number;         // calculado automáticamente
  result: 'win' | 'loss' | 'breakeven';
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'journal_trades';

function loadTrades(): Trade[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPL(direction: 'LONG' | 'SHORT', entry: number, exit: number, size: number): number {
  const diff = direction === 'LONG' ? exit - entry : entry - exit;
  return parseFloat((diff * size).toFixed(2));
}

function getResult(pl: number): 'win' | 'loss' | 'breakeven' {
  if (pl > 0) return 'win';
  if (pl < 0) return 'loss';
  return 'breakeven';
}

function calcStats(trades: Trade[]) {
  if (trades.length === 0) return { winRate: 0, netPL: 0, wins: 0, losses: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0 };
  const wins   = trades.filter(t => t.result === 'win');
  const losses = trades.filter(t => t.result === 'loss');
  const netPL  = trades.reduce((s, t) => s + t.pl, 0);
  const grossWin  = wins.reduce((s, t) => s + t.pl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pl, 0));
  const pls = trades.map(t => t.pl);
  return {
    winRate: parseFloat(((wins.length / trades.length) * 100).toFixed(1)),
    netPL: parseFloat(netPL.toFixed(2)),
    wins: wins.length,
    losses: losses.length,
    profitFactor: grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 999 : 0,
    avgWin: wins.length ? parseFloat((grossWin / wins.length).toFixed(2)) : 0,
    avgLoss: losses.length ? parseFloat((grossLoss / losses.length).toFixed(2)) : 0,
    bestTrade: Math.max(...pls),
    worstTrade: Math.min(...pls),
  };
}

// ─── Add Trade Modal ──────────────────────────────────────────────────────────

function AddTradeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Trade) => void }) {
  const [asset, setAsset]         = useState('XAU/USD');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entry, setEntry]         = useState('');
  const [exit, setExit]           = useState('');
  const [size, setSize]           = useState('1');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes]         = useState('');

  const pl = entry && exit && size
    ? calcPL(direction, parseFloat(entry), parseFloat(exit), parseFloat(size))
    : null;

  const handleSubmit = () => {
    if (!asset || !entry || !exit || !size) return;
    const e = parseFloat(entry), x = parseFloat(exit), s = parseFloat(size);
    const p = calcPL(direction, e, x, s);
    onAdd({
      id: Date.now().toString(),
      asset, direction, entry: e, exit: x, size: s, date, notes,
      pl: p, result: getResult(p),
    });
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white";
  const inputStyle = { background: '#2C2C2E', border: '1px solid #38383A' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 space-y-4"
        style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Registrar Trade</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#2C2C2E' }}>
            <X size={16} color="#8E8E93" />
          </button>
        </div>

        {/* Activo */}
        <div>
          <label className="text-xs text-[#636366] block mb-1.5">Activo</label>
          <input value={asset} onChange={e => setAsset(e.target.value.toUpperCase())}
            placeholder="XAU/USD, BTC, AAPL..." className={inputCls} style={inputStyle} />
        </div>

        {/* Dirección */}
        <div>
          <label className="text-xs text-[#636366] block mb-1.5">Dirección</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #38383A' }}>
            {(['LONG', 'SHORT'] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  background: direction === d ? (d === 'LONG' ? '#34C759' : '#FF3B30') : 'transparent',
                  color: direction === d ? '#000' : '#636366',
                }}>
                {d === 'LONG' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Entrada / Salida / Tamaño */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-[#636366] block mb-1.5">Entrada</label>
            <input type="number" value={entry} onChange={e => setEntry(e.target.value)}
              placeholder="0.00" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs text-[#636366] block mb-1.5">Salida</label>
            <input type="number" value={exit} onChange={e => setExit(e.target.value)}
              placeholder="0.00" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs text-[#636366] block mb-1.5">Tamaño</label>
            <input type="number" value={size} onChange={e => setSize(e.target.value)}
              placeholder="1" className={inputCls} style={inputStyle} />
          </div>
        </div>

        {/* P/L preview */}
        {pl !== null && (
          <div className="p-3 rounded-xl text-center"
            style={{ background: pl >= 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', border: `1px solid ${pl >= 0 ? '#34C75940' : '#FF3B3040'}` }}>
            <span className="text-xs block mb-0.5" style={{ color: pl >= 0 ? '#34C759' : '#FF3B30' }}>P/L estimado</span>
            <span className="text-xl font-black" style={{ color: pl >= 0 ? '#34C759' : '#FF3B30' }}>
              {pl >= 0 ? '+' : ''}{pl.toLocaleString()}
            </span>
          </div>
        )}

        {/* Fecha */}
        <div>
          <label className="text-xs text-[#636366] block mb-1.5">Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs text-[#636366] block mb-1.5">Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Setup, razón de entrada, lecciones..."
            rows={2} className={inputCls + ' resize-none'} style={inputStyle} />
        </div>

        {/* Guardar */}
        <button onClick={handleSubmit} disabled={!asset || !entry || !exit || !size}
          className="w-full py-3.5 rounded-full font-bold text-sm text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
          Guardar Trade
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const goBack = useStore(s => s.goBack);
  const [trades, setTrades]       = useState<Trade[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades'>('dashboard');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { setTrades(loadTrades()); }, []);

  const addTrade = (t: Trade) => {
    const updated = [t, ...trades];
    setTrades(updated);
    saveTrades(updated);
  };

  const deleteTrade = (id: string) => {
    const updated = trades.filter(t => t.id !== id);
    setTrades(updated);
    saveTrades(updated);
    setDeletingId(null);
  };

  const stats = calcStats(trades);
  const winRateOffset = 283 - (283 * stats.winRate) / 100;
  const winRateColor = stats.winRate >= 60 ? '#34C759' : stats.winRate >= 45 ? '#FF9500' : '#FF3B30';

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}>
        <button onClick={goBack} className="p-1 -ml-1">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <h3 className="text-lg font-bold text-white">Diario de Trading</h3>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
          <Plus size={18} color="#FFFFFF" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex p-1 mx-5 mt-4 rounded-xl"
        style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'trades',    label: `Trades (${trades.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: activeTab === key ? '#2C2C2E' : 'transparent', color: activeTab === key ? '#FFFFFF' : '#636366' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-4">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">

            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <TrendingUp size={28} color="#38383A" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white mb-1">Sin trades registrados</p>
                  <p className="text-sm text-[#636366]">Presiona + para registrar tu primer trade</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
                  <Plus size={16} />
                  Registrar Trade
                </button>
              </div>
            ) : (
              <>
                {/* Win Rate circular */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl flex items-center gap-6"
                  style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#2C2C2E" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="45" fill="none"
                        stroke={winRateColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: winRateOffset }}
                        transition={{ duration: 1.2, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black" style={{ color: winRateColor }}>{stats.winRate}%</span>
                      <span className="text-xs text-[#636366]">Win Rate</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-[#636366]">Net P/L</span>
                      <span className="text-sm font-bold" style={{ color: stats.netPL >= 0 ? '#34C759' : '#FF3B30' }}>
                        {stats.netPL >= 0 ? '+' : ''}{stats.netPL.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#636366]">Trades</span>
                      <span className="text-sm font-bold text-white">{trades.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#636366]">Wins / Losses</span>
                      <span className="text-sm font-bold">
                        <span style={{ color: '#34C759' }}>{stats.wins}</span>
                        <span className="text-[#636366]"> / </span>
                        <span style={{ color: '#FF3B30' }}>{stats.losses}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#636366]">Profit Factor</span>
                      <span className="text-sm font-bold" style={{ color: stats.profitFactor >= 1.5 ? '#34C759' : stats.profitFactor >= 1 ? '#FF9500' : '#FF3B30' }}>
                        {stats.profitFactor === 999 ? '∞' : stats.profitFactor}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Avg Win', value: '+' + stats.avgWin.toLocaleString(), color: '#34C759' },
                    { label: 'Avg Loss', value: '-' + stats.avgLoss.toLocaleString(), color: '#FF3B30' },
                    { label: 'Mejor Trade', value: '+' + stats.bestTrade.toLocaleString(), color: '#34C759' },
                    { label: 'Peor Trade', value: stats.worstTrade.toLocaleString(), color: '#FF3B30' },
                  ].map(({ label, value, color }) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl"
                      style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                      <span className="text-xs text-[#636366] block mb-1">{label}</span>
                      <span className="text-lg font-black" style={{ color }}>{value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Últimos 5 trades */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">Últimos trades</span>
                    <button onClick={() => setActiveTab('trades')}
                      className="text-xs" style={{ color: '#007AFF' }}>Ver todos</button>
                  </div>
                  <div className="space-y-2">
                    {trades.slice(0, 5).map((t, i) => (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: t.result === 'win' ? '#34C75920' : '#FF3B3020' }}>
                            {t.direction === 'LONG'
                              ? <TrendingUp size={14} color={t.result === 'win' ? '#34C759' : '#FF3B30'} />
                              : <TrendingDown size={14} color={t.result === 'win' ? '#34C759' : '#FF3B30'} />}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white">{t.asset}</span>
                            <span className="text-xs text-[#636366] block">{t.date}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold"
                          style={{ color: t.pl >= 0 ? '#34C759' : '#FF3B30' }}>
                          {t.pl >= 0 ? '+' : ''}{t.pl.toLocaleString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TRADES LIST ── */}
        {activeTab === 'trades' && (
          <div className="space-y-2">
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#636366]">Sin trades aún</p>
                <button onClick={() => setShowAdd(true)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white mx-auto"
                  style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
                  <Plus size={14} />
                  Agregar Trade
                </button>
              </div>
            ) : trades.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 rounded-2xl"
                style={{ background: '#1C1C1E', border: `1px solid ${t.result === 'win' ? '#34C75930' : t.result === 'loss' ? '#FF3B3030' : '#38383A'}` }}>

                {/* Fila 1: activo + dirección + P/L + borrar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: t.direction === 'LONG' ? '#34C75920' : '#FF3B3020' }}>
                      {t.direction === 'LONG'
                        ? <TrendingUp size={16} color="#34C759" />
                        : <TrendingDown size={16} color="#FF3B30" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">{t.asset}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: t.direction === 'LONG' ? '#34C759' : '#FF3B30', background: t.direction === 'LONG' ? '#34C75920' : '#FF3B3020' }}>
                          {t.direction}
                        </span>
                        <span className="text-xs text-[#636366]">{t.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black"
                      style={{ color: t.pl >= 0 ? '#34C759' : '#FF3B30' }}>
                      {t.pl >= 0 ? '+' : ''}{t.pl.toLocaleString()}
                    </span>
                    {deletingId === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteTrade(t.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: '#FF3B30' }}>
                          <Check size={12} color="#fff" />
                        </button>
                        <button onClick={() => setDeletingId(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: '#2C2C2E' }}>
                          <X size={12} color="#8E8E93" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(t.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,59,48,0.1)' }}>
                        <Trash2 size={12} color="#FF3B30" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fila 2: entrada / salida / tamaño */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg text-center" style={{ background: '#2C2C2E' }}>
                    <div className="text-xs text-[#636366]">Entrada</div>
                    <div className="text-xs font-bold text-white">{t.entry.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: '#2C2C2E' }}>
                    <div className="text-xs text-[#636366]">Salida</div>
                    <div className="text-xs font-bold text-white">{t.exit.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: '#2C2C2E' }}>
                    <div className="text-xs text-[#636366]">Tamaño</div>
                    <div className="text-xs font-bold text-white">{t.size}</div>
                  </div>
                </div>

                {/* Notas */}
                {t.notes && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#8E8E93' }}>
                    {t.notes}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showAdd && <AddTradeModal onClose={() => setShowAdd(false)} onAdd={addTrade} />}
      </AnimatePresence>
    </div>
  );
}
