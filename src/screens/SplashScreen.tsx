import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function SplashScreen() {
  const navigate = useStore((s) => s.navigate);
  const showOnboarding = useStore((s) => s.showOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showOnboarding) {
        navigate('LandingScreen');
      } else {
        navigate('HomeScreen');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, showOnboarding]);

  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <TrendingUp size={64} color="#FFFFFF" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </div>
  );
}
