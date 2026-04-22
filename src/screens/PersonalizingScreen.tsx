import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function PersonalizingScreen() {
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOnboardingComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [setOnboardingComplete]);

  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-8 py-5 rounded-full flex items-center gap-3"
        style={{
          background: '#1C1C1E',
          border: '1px solid #38383A',
        }}
      >
        <span className="text-white font-medium">Personalizing Profit AI</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white"
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
