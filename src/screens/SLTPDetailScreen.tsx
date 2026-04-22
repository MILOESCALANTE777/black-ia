import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function SLTPDetailScreen() {
  const goBack = useStore((s) => s.goBack);
  const analysisResult = useStore((s) => s.analysisResult);

  if (!analysisResult) return null;

  const { activeStrategy } = analysisResult;

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
        <h3 className="text-lg font-semibold text-white">SL and TP</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        {/* SL Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-4 rounded-2xl flex items-center justify-between"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          <span className="text-base font-medium text-white">Stop-Loss</span>
          <span
            className="px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}
          >
            ${activeStrategy.sl.toLocaleString()}
          </span>
        </motion.div>

        {/* TP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 p-4 rounded-2xl flex items-center justify-between"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          <span className="text-base font-medium text-white">Take-Profit</span>
          <span
            className="px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'rgba(52,199,89,0.15)', color: '#34C759' }}
          >
            ${activeStrategy.tp.toLocaleString()}
          </span>
        </motion.div>

        {/* Reasoning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 rounded-2xl"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          <h4 className="text-base font-semibold text-white mb-2">Reasoning</h4>
          <p className="text-sm text-[#8E8E93] leading-relaxed">
            {activeStrategy.reasoning}
          </p>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 p-4 rounded-2xl"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          <h4 className="text-base font-semibold text-white mb-2">Note</h4>
          <p className="text-sm text-[#8E8E93] leading-relaxed">
            Please conduct your own research and consider your risk tolerance. This is an example.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
