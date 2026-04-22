import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ReviewPromptScreen() {
  const dismissReview = useStore((s) => s.dismissReview);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-end"
      onClick={dismissReview}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-black rounded-t-3xl px-6 pt-8 pb-10"
        style={{ borderTop: '1px solid #38383A' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#38383A] rounded-full mx-auto mb-8" />

        <h2 className="text-[28px] font-bold text-white leading-tight mb-3">
          Help Profit AI{'\n'}grow!
        </h2>
        <p className="text-base text-[#8E8E93] mb-8">
          Help us improve by leaving a review on the app store.
        </p>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center">
            <Heart size={40} color="#FFFFFF" fill="#FFFFFF" />
          </div>
        </motion.div>

        <button
          onClick={dismissReview}
          className="w-full py-4 rounded-full bg-white text-black font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
