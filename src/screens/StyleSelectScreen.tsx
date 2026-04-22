import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';

const options = [
  { key: 'scalping', label: 'Scalping', emoji: '⚡', desc: 'Very short-term trades, minutes to hours' },
  { key: 'day', label: 'Day Trading', emoji: '🌅', desc: 'Buying and selling within the same day' },
  { key: 'swing', label: 'Swing Trading', emoji: '🎯', desc: 'Holding position for days or weeks' },
  { key: 'longterm', label: 'Long-Term Investing', emoji: '⏳', desc: 'Holding position for months or years' },
];

export default function StyleSelectScreen() {
  const navigate = useStore((s) => s.navigate);
  const setTradingStyle = useStore((s) => s.setTradingStyle);
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      setTradingStyle(selected);
      navigate('DetailSelectScreen');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black px-6">
      <div className="pt-6 flex items-center gap-4">
        <button onClick={() => navigate('MarketSelectScreen')} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <div className="flex-1 h-1 bg-[#38383A] rounded-full overflow-hidden">
          <motion.div initial={{ width: '50%' }} animate={{ width: '75%' }} className="h-full bg-white rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[28px] font-bold text-white leading-tight tracking-tight mt-8"
      >
        What&apos;s your trading{'\n'}style?
      </motion.h2>

      <div className="flex-1 flex flex-col justify-center gap-3 mt-6">
        {options.map((opt, i) => (
          <motion.button
            key={opt.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            onClick={() => setSelected(opt.key)}
            className="w-full p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected === opt.key ? '#2C2C2E' : '#1C1C1E',
              border: `1.5px solid ${selected === opt.key ? '#FFFFFF' : '#38383A'}`,
            }}
          >
            <div className="text-lg font-semibold text-white">
              {opt.label} {opt.emoji}
            </div>
            <div className="text-sm text-[#8E8E93] mt-1">{opt.desc}</div>
          </motion.button>
        ))}
      </div>

      <div className="pb-8 flex flex-col gap-3 items-center">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-full font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: selected ? '#FFFFFF' : '#1C1C1E',
            color: selected ? '#000000' : '#636366',
          }}
        >
          Continue
        </button>
        <button onClick={handleContinue} className="text-sm text-[#8E8E93]">
          Not sure yet
        </button>
      </div>
    </div>
  );
}
