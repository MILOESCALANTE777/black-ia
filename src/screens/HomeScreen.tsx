import { motion } from 'framer-motion';
import { TrendingUp, Info, Bookmark, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import InsightCard from '@/components/InsightCard';
import StatusDots from '@/components/StatusDots';

export default function HomeScreen() {
  const { analysisResult, hasAnalysis, navigate, setActiveTab } = useStore();

  if (!hasAnalysis || !analysisResult) {
    return (
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 md:hidden"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={22} color="#FFFFFF" strokeWidth={2} />
            <span className="text-lg font-bold text-white">PROFIT AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button><Info size={20} color="#8E8E93" /></button>
            <button><Bookmark size={20} color="#8E8E93" /></button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex shrink-0 items-center justify-between px-8 py-5 border-b border-[#1C1C1E]">
          <h2 className="text-2xl font-bold text-white">Home</h2>
          <div className="flex items-center gap-3">
            <button><Info size={20} color="#8E8E93" /></button>
            <button><Bookmark size={20} color="#8E8E93" /></button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-6">
              <TrendingUp size={36} color="#38383A" />
            </div>
            <h2 className="text-2xl font-bold text-[#8E8E93] mb-3">
              Snap a chart to get started
            </h2>
            <p className="text-base text-[#636366] mb-8">
              Upload a photo of your trading chart and let our AI analyze it
            </p>
            <button
              onClick={() => setActiveTab('analyze')}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold active:scale-[0.98] transition-transform"
            >
              Analyze Chart
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const { asset, strategy, chartImage, insights, activeStrategy } = analysisResult;

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Mobile Header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4 md:hidden"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={22} color="#FFFFFF" strokeWidth={2} />
          <span className="text-lg font-bold text-white">PROFIT AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button><Info size={20} color="#8E8E93" /></button>
          <button><Bookmark size={20} color="#8E8E93" /></button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex shrink-0 items-center justify-between px-8 py-5 border-b border-[#1C1C1E]">
        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
        <div className="flex items-center gap-3">
          <button><Info size={20} color="#8E8E93" /></button>
          <button><Bookmark size={20} color="#8E8E93" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Desktop: two-column layout */}
        <div className="md:grid md:grid-cols-2 md:gap-6 md:p-8 px-5 pb-6">

          {/* Left column / mobile full width */}
          <div>
            {/* Chart Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 md:mt-0 rounded-2xl overflow-hidden"
            >
              <img
                src={chartImage}
                alt="Chart"
                className="w-full h-48 md:h-64 object-cover"
              />
            </motion.div>

            {/* Asset & Strategy Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2 mt-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8E8E93] w-16">Asset</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-[#2C2C2E]">
                  {asset}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8E8E93] w-16">Strategy</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-[#2C2C2E]">
                  {strategy}
                </span>
              </div>
            </motion.div>

            {/* Key Insights */}
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-white mt-6 mb-3"
            >
              Key Insights
            </motion.h3>

            <div className="grid grid-cols-2 gap-3">
              <InsightCard {...insights.trend} index={0} />
              <InsightCard {...insights.signal} index={1} />
              <InsightCard {...insights.riskLevel} index={2} />
              <InsightCard {...insights.volume} index={3} />
            </div>
          </div>

          {/* Right column / mobile continues */}
          <div>
            {/* Active Strategy */}
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl font-bold text-white mt-6 md:mt-0 mb-3"
            >
              Active Strategy
            </motion.h3>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => navigate('GamePlanDetailScreen')}
              className="w-full p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium text-white">{activeStrategy.name}</span>
                <ChevronRight size={18} color="#8E8E93" />
              </div>
              <div className="text-sm text-[#8E8E93] mb-3">
                Status:{' '}
                <span style={{ color: activeStrategy.statusDots >= 4 ? '#34C759' : activeStrategy.statusDots >= 2 ? '#FF9500' : '#FF3B30' }}>
                  {activeStrategy.status}
                </span>
              </div>
              <StatusDots filled={activeStrategy.statusDots} />
            </motion.button>

            {/* Overview Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4 p-4 rounded-2xl"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            >
              <h4 className="text-base font-semibold text-white mb-2">Overview</h4>
              <p className="text-sm text-[#8E8E93] leading-relaxed line-clamp-4 md:line-clamp-6">
                {activeStrategy.overview}
              </p>
            </motion.div>

            {/* SL & TP Preview */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => navigate('SLTPDetailScreen')}
              className="w-full mt-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-white">SL and TP</h4>
                <ChevronRight size={18} color="#8E8E93" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(255,59,48,0.15)' }}>
                  <span className="text-xs text-[#FF3B30] block mb-1">Stop-Loss</span>
                  <span className="text-lg font-bold text-[#FF3B30]">${activeStrategy.sl.toLocaleString()}</span>
                </div>
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(52,199,89,0.15)' }}>
                  <span className="text-xs text-[#34C759] block mb-1">Take-Profit</span>
                  <span className="text-lg font-bold text-[#34C759]">${activeStrategy.tp.toLocaleString()}</span>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
