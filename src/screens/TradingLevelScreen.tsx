import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const data = [
  { month: 1, profitAI: 20, gurus: 25 },
  { month: 2, profitAI: 35, gurus: 20 },
  { month: 3, profitAI: 45, gurus: 30 },
  { month: 4, profitAI: 55, gurus: 25 },
  { month: 5, profitAI: 70, gurus: 35 },
  { month: 6, profitAI: 85, gurus: 20 },
];

export default function TradingLevelScreen() {
  const navigate = useStore((s) => s.navigate);

  return (
    <div className="flex-1 flex flex-col bg-black px-6">
      <div className="pt-6 flex items-center gap-4">
        <button onClick={() => navigate('DetailSelectScreen')} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <div className="flex-1" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[28px] font-bold text-white leading-tight tracking-tight mt-4"
      >
        You are just few steps{'\n'}away from trading with{'\n'}clarity.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-3xl p-5"
        style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
      >
        <h3 className="text-xl font-bold text-white mb-4">Your Trading Level</h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#34C759]" />
            <span className="text-sm text-[#8E8E93]">Profit AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF3B30]" />
            <span className="text-sm text-[#8E8E93]">Trading Gurus</span>
          </div>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="profitAI"
                stroke="#34C759"
                strokeWidth={3}
                dot={{ r: 4, fill: '#34C759' }}
              />
              <Line
                type="monotone"
                dataKey="gurus"
                stroke="#FF3B30"
                strokeWidth={3}
                dot={{ r: 4, fill: '#FF3B30' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between text-xs text-[#8E8E93] mt-2">
          <span>Month 1</span>
          <span>Month 2</span>
        </div>

        <p className="text-sm text-[#8E8E93] mt-4 text-center">
          Profit AI users read their charts with more confidence and less guesswork.
        </p>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pb-8"
      >
        <button
          onClick={() => navigate('PersonalizingScreen')}
          className="w-full py-4 rounded-full bg-white text-black font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
