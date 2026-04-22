import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';

const options = [
  { key: 'beginner', label: 'Beginner', emoji: '🐣' },
  { key: 'intermediate', label: 'Intermediate', emoji: '🧠' },
  { key: 'expert', label: 'Expert', emoji: '🚀' },
];

export default function ExperienceSelectScreen() {
  const navigate = useStore((s) => s.navigate);
  const setExperience = useStore((s) => s.setExperience);
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      setExperience(selected);
      navigate('MarketSelectScreen');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black px-6">
      {/* Header */}
      <div className="pt-6 flex items-center gap-4">
        <button onClick={() => navigate('LandingScreen')} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
        <div className="flex-1 h-1 bg-[#38383A] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '25%' }}
            className="h-full bg-white rounded-full"
          />
        </div>
        <div className="w-10" />
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[28px] font-bold text-white leading-tight tracking-tight mt-8"
      >
        What&apos;s your trading{'\n'}experience?
      </motion.h2>

      {/* Options */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            onClick={() => setSelected(opt.key)}
            className="w-full py-5 rounded-2xl text-center text-lg font-semibold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected === opt.key ? '#2C2C2E' : '#1C1C1E',
              border: `1.5px solid ${selected === opt.key ? '#FFFFFF' : '#38383A'}`,
              color: '#FFFFFF',
            }}
          >
            {opt.label} {opt.emoji}
          </motion.button>
        ))}
      </div>

      {/* CTA */}
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
