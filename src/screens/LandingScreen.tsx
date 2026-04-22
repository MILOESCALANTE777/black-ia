import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function LandingScreen() {
  const navigate = useStore((s) => s.navigate);

  return (
    <div className="flex-1 flex flex-col bg-black relative">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pt-12 px-6"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={24} color="#FFFFFF" strokeWidth={2} />
          <span className="text-xl font-bold text-white tracking-tight">PROFIT AI</span>
        </div>
      </motion.div>

      {/* Headline */}
      <div className="flex-1 flex items-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[40px] font-extrabold text-white leading-tight tracking-tight"
        >
          Your next winning trade starts with a photo.
        </motion.h1>
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="px-6 pb-8 flex flex-col gap-3"
      >
        <button
          onClick={() => navigate('OnboardingFeaturesScreen')}
          className="w-full py-4 rounded-full bg-[#1C1C1E] border border-[#38383A] text-white font-semibold text-base active:scale-[0.98] transition-transform"
        >
          I have an account
        </button>
        <button
          onClick={() => navigate('OnboardingFeaturesScreen')}
          className="w-full py-4 rounded-full bg-white text-black font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs text-[#8E8E93] underline">Privacy Policy</span>
          <span className="text-xs text-[#8E8E93]">|</span>
          <span className="text-xs text-[#8E8E93] underline">Terms of Use</span>
        </div>
      </motion.div>
    </div>
  );
}
