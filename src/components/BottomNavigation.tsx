import { motion } from 'framer-motion';
import { Home, Brain, Camera, Atom, User, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'gold-analysis', label: 'Quant', Icon: Zap },
  { key: 'analyze', label: '', Icon: Camera },
  { key: 'markets', label: 'Markets', Icon: Atom },
  { key: 'profile', label: 'Profile', Icon: User },
];

export default function BottomNavigation() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const capturedImage = useStore((s) => s.capturedImage);
  const hasAnalysis = useStore((s) => s.hasAnalysis);

  const handleTabPress = (key: string) => {
    if (key === 'analyze') {
      setActiveTab('analyze');
    } else {
      setActiveTab(key);
    }
  };

  return (
    <nav
      className="shrink-0 h-20 relative z-50"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid #38383A',
      }}
    >
      <div className="flex items-center justify-around h-full pb-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isCenter = tab.key === 'analyze';

          if (isCenter) {
            return (
              <button
                key={tab.key}
                onClick={() => handleTabPress(tab.key)}
                className="relative flex flex-col items-center justify-center -mt-5"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{
                    background: '#1C1C1E',
                    border: '1px solid #38383A',
                    boxShadow: isActive
                      ? '0 0 20px rgba(175,82,222,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <tab.Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    color="#FFFFFF"
                  />
                  {capturedImage && !hasAnalysis && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full" />
                  )}
                </motion.div>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => handleTabPress(tab.key)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2"
            >
              <tab.Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                color={isActive ? '#FFFFFF' : '#636366'}
              />
              <span
                className="text-[11px] tracking-wide"
                style={{
                  color: isActive ? '#FFFFFF' : '#636366',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="w-1 h-1 rounded-full bg-white mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
