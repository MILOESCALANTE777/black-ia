import { motion } from 'framer-motion';
import { TrendingUp, Info, Bookmark, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import InsightCard from '@/components/InsightCard';
import StatusDots from '@/components/StatusDots';

const Header = ({ title }: { title: string }) => (
  <>
    <div className="shrink-0 flex items-center justify-between px-6 py-4 md:hidden"
      style={{ background: 'var(--bg-header)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2">
        <TrendingUp size={22} strokeWidth={2} style={{ color: 'var(--text-primary)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>PROFIT AI</span>
      </div>
      <div className="flex items-center gap-3">
        <button><Info size={20} style={{ color: 'var(--text-secondary)' }} /></button>
        <button><Bookmark size={20} style={{ color: 'var(--text-secondary)' }} /></button>
      </div>
    </div>
    <div className="hidden md:flex shrink-0 items-center justify-between px-8 py-5"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div className="flex items-center gap-3">
        <button><Info size={20} style={{ color: 'var(--text-secondary)' }} /></button>
        <button><Bookmark size={20} style={{ color: 'var(--text-secondary)' }} /></button>
      </div>
    </div>
  </>
);

export default function HomeScreen() {
  const { analysisResult, hasAnalysis, navigate, setActiveTab } = useStore();

  if (!hasAnalysis || !analysisResult) {
    return (
      <div className="flex-1 flex flex-col theme-bg-app">
        <Header title="Home" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--bg-card)' }}>
              <TrendingUp size={36} style={{ color: 'var(--border)' }} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Snap a chart to get started
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
              Upload a photo of your trading chart and let our AI analyze it
            </p>
            <button onClick={() => setActiveTab('analyze')}
              className="px-8 py-4 rounded-full font-semibold active:scale-[0.98] transition-transform"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-app)' }}>
              Analyze Chart
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const { asset, strategy, chartImage, insights, activeStrategy } = analysisResult;

  return (
    <div className="flex-1 flex flex-col theme-bg-app">
      <Header title="Analysis Results" />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="md:grid md:grid-cols-2 md:gap-6 md:p-8 px-5 pb-6">

          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 md:mt-0 rounded-2xl overflow-hidden">
              <img src={chartImage} alt="Chart" className="w-full h-48 md:h-64 object-cover" />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-col gap-2 mt-4">
              {[{ label: 'Asset', value: asset }, { label: 'Strategy', value: strategy }].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm w-16" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="px-4 py-1.5 rounded-full text-sm font-medium"
                    style={{ background: 'var(--bg-card-2)', color: 'var(--text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-xl font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Key Insights
            </motion.h3>
            <div className="grid grid-cols-2 gap-3">
              <InsightCard {...insights.trend} index={0} />
              <InsightCard {...insights.signal} index={1} />
              <InsightCard {...insights.riskLevel} index={2} />
              <InsightCard {...insights.volume} index={3} />
            </div>
          </div>

          {/* Right */}
          <div>
            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-xl font-bold mt-6 md:mt-0 mb-3" style={{ color: 'var(--text-primary)' }}>
              Active Strategy
            </motion.h3>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              onClick={() => navigate('GamePlanDetailScreen')}
              className="w-full p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{activeStrategy.name}</span>
                <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                Status:{' '}
                <span style={{ color: activeStrategy.statusDots >= 4 ? 'var(--green)' : activeStrategy.statusDots >= 2 ? 'var(--orange)' : 'var(--red)' }}>
                  {activeStrategy.status}
                </span>
              </div>
              <StatusDots filled={activeStrategy.statusDots} />
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="mt-4 p-4 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Overview</h4>
              <p className="text-sm leading-relaxed line-clamp-4 md:line-clamp-6" style={{ color: 'var(--text-secondary)' }}>
                {activeStrategy.overview}
              </p>
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              onClick={() => navigate('SLTPDetailScreen')}
              className="w-full mt-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>SL and TP</h4>
                <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(255,59,48,0.12)' }}>
                  <span className="text-xs block mb-1" style={{ color: 'var(--red)' }}>Stop-Loss</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--red)' }}>${activeStrategy.sl.toLocaleString()}</span>
                </div>
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(52,199,89,0.12)' }}>
                  <span className="text-xs block mb-1" style={{ color: 'var(--green)' }}>Take-Profit</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--green)' }}>${activeStrategy.tp.toLocaleString()}</span>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
