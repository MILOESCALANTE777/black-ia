import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import SectionAccordion from '@/components/SectionAccordion';
import StatusDots from '@/components/StatusDots';

export default function GamePlanDetailScreen() {
  const goBack = useStore((s) => s.goBack);
  const analysisResult = useStore((s) => s.analysisResult);

  if (!analysisResult) return null;

  const { activeStrategy, chartImage } = analysisResult;
  const { gamePlan, additional } = activeStrategy;

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-4 px-6 py-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <button onClick={goBack} className="p-1 -ml-1">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <h3 className="text-lg font-semibold text-white">Game Plan</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden mt-2"
        >
          <img src={chartImage} alt="Chart" className="w-full h-48 object-cover" />
        </motion.div>

        {/* Strategy Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-4 rounded-2xl"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          <div className="text-sm text-[#8E8E93] mb-1">{activeStrategy.name}</div>
          <div className="text-base font-medium text-white mb-2">
            Status: {activeStrategy.status}
          </div>
          <StatusDots filled={activeStrategy.statusDots} />
        </motion.div>

        {/* Accordions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <SectionAccordion title="Overview" defaultOpen>
            {activeStrategy.overview}
          </SectionAccordion>

          <SectionAccordion title="Entry & Exit Strategy">
            {gamePlan.entryExit}
          </SectionAccordion>

          <SectionAccordion title="Risk & Reward Assessment">
            {gamePlan.riskReward}
          </SectionAccordion>

          <SectionAccordion title="Trade Duration & Monitoring">
            {gamePlan.duration}
          </SectionAccordion>

          <SectionAccordion title="Technical Indicators">
            EMAs are not visible on the screenshot so cannot verify 20/50 EMA alignment. RSI / MACD not shown. Volume is medium-to-high on trend legs, lighter during pullbacks.
          </SectionAccordion>

          <SectionAccordion title="Recognized Patterns">
            {additional.patterns}
          </SectionAccordion>

          <SectionAccordion title="Market Sentiment">
            {additional.sentiment}
          </SectionAccordion>

          {/* Support/Resistance */}
          <div className="pt-4 pb-2">
            <h4 className="text-base font-semibold text-white mb-3">Key Levels</h4>
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(52,199,89,0.1)' }}>
                <span className="text-xs text-[#34C759] block mb-1">Support Level</span>
                <span className="text-lg font-bold text-[#34C759]">${additional.support.toLocaleString()}</span>
              </div>
              <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(255,59,48,0.1)' }}>
                <span className="text-xs text-[#FF3B30] block mb-1">Resistance Level</span>
                <span className="text-lg font-bold text-[#FF3B30]">${additional.resistance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
