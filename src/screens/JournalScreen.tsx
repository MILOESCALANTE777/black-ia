import { motion } from 'framer-motion';
import { ChevronLeft, Info, Plus, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function JournalScreen() {
  const goBack = useStore((s) => s.goBack);
  const { traderScore, netPL, winRate, totalTrades, profitFactor, winStreak, recentTrades } = useStore();

  const scoreOffset = 283 - (283 * traderScore) / 100;

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 md:py-5"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}
      >
        <button onClick={goBack} className="p-1 -ml-1">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <h3 className="text-lg md:text-2xl font-semibold md:font-bold text-white absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          Journal
        </h3>
        <div className="flex items-center gap-3">
          <button><Info size={20} color="#8E8E93" /></button>
          <button><Plus size={20} color="#8E8E93" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 md:px-8 pb-8">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex p-1 rounded-xl mt-4 mb-6 md:w-72"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          {['Dashboard', 'Calendar', 'Trades'].map((tab, i) => (
            <button
              key={tab}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                i === 0 ? 'bg-[#2C2C2E] text-white' : 'text-[#8E8E93]'
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Desktop: two-column layout */}
        <div className="md:grid md:grid-cols-2 md:gap-8">

          {/* Left column */}
          <div>
            {/* Trader Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex md:flex-row flex-col items-center md:items-start gap-6 mb-6 p-5 rounded-2xl md:bg-[#1C1C1E] md:border md:border-[#38383A]"
            >
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-medium text-[#8E8E93] mb-4">Trader Score</h4>
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1C1C1E" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: scoreOffset }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34C759" />
                        <stop offset="100%" stopColor="#30D158" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white">{traderScore}</span>
                    <span className="text-xs text-[#8E8E93]">/100</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#34C759] mt-2">Elite Trader</span>
              </div>

              {/* Quick stats next to score on desktop */}
              <div className="hidden md:flex flex-col gap-3 flex-1 justify-center">
                <div>
                  <span className="text-xs text-[#8E8E93]">Net P/L</span>
                  <div className="text-2xl font-bold text-white">${(netPL / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <span className="text-xs text-[#8E8E93]">Win Rate</span>
                  <div className="text-2xl font-bold text-white">{winRate}%</div>
                </div>
              </div>
            </motion.div>

            {/* Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">Performance</h4>
                <button className="flex items-center gap-1 text-sm text-[#8E8E93]">
                  All time <ChevronDown size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 md:hidden">
                <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    <span className="text-xs text-[#8E8E93]">Net P/L</span>
                  </div>
                  <span className="text-xl font-bold text-white">${(netPL / 1000).toFixed(0)}k</span>
                </div>
                <div className="p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <span className="text-xs text-[#8E8E93] block mb-1">Win Rate</span>
                  <span className="text-xl font-bold text-white">{winRate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl text-center" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <span className="text-xs text-[#8E8E93] block mb-1">Total Trades</span>
                  <span className="text-lg font-bold text-white">{totalTrades}</span>
                </div>
                <div className="p-3 rounded-2xl text-center" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <span className="text-xs text-[#8E8E93] block mb-1">Profit Factor</span>
                  <span className="text-lg font-bold text-white">{profitFactor}</span>
                </div>
                <div className="p-3 rounded-2xl text-center" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                  <span className="text-xs text-[#8E8E93] block mb-1">Win Streak</span>
                  <span className="text-lg font-bold text-white">{winStreak}d</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column — Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 md:mt-0"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Recent Trades</h4>
              <button className="text-sm text-[#8E8E93]">Show All &gt;</button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
              {/* Table header — desktop */}
              <div className="hidden md:grid grid-cols-3 px-4 py-2.5 border-b border-[#38383A]">
                <span className="text-xs text-[#636366] font-medium">Asset</span>
                <span className="text-xs text-[#636366] font-medium">Date</span>
                <span className="text-xs text-[#636366] font-medium text-right">P/L</span>
              </div>

              {recentTrades.map((trade, i) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between md:grid md:grid-cols-3 px-4 py-3.5 border-b border-[#38383A] last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{trade.asset}</div>
                    <div className="text-xs text-[#8E8E93] md:hidden">{trade.date}</div>
                  </div>
                  <div className="hidden md:block text-sm text-[#8E8E93]">{trade.date}</div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: trade.result === 'win' ? '#34C759' : '#FF3B30' }}
                    >
                      {trade.result === 'win' ? '+' : '-'}${Math.abs(trade.pl).toLocaleString()}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: trade.result === 'win' ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
                        color: trade.result === 'win' ? '#34C759' : '#FF3B30',
                      }}
                    >
                      {trade.result === 'win' ? 'Win' : 'Loss'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
