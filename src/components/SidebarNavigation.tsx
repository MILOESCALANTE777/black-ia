import { motion } from 'framer-motion';
import { Home, Brain, Camera, Atom, User, TrendingUp, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'gold-analysis', label: 'Quant SP500', Icon: Zap },
  { key: 'ai-brain', label: 'AI Brain', Icon: Brain },
  { key: 'analyze', label: 'Analyze', Icon: Camera },
  { key: 'markets', label: 'Markets', Icon: Atom },
  { key: 'profile', label: 'Profile', Icon: User },
];

export default function SidebarNavigation() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-full z-50"
      style={{
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid #38383A',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 mb-2">
        <TrendingUp size={22} color="#FFFFFF" strokeWidth={2} />
        <span className="text-lg font-bold text-white tracking-tight">PROFIT AI</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isAnalyze = tab.key === 'analyze';

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group"
              style={{
                background: isActive ? '#1C1C1E' : 'transparent',
                color: isActive ? '#FFFFFF' : '#636366',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-white"
                />
              )}
              {isAnalyze ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? '#FFFFFF' : '#1C1C1E',
                    border: '1px solid #38383A',
                  }}
                >
                  <tab.Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    color={isActive ? '#000000' : '#FFFFFF'}
                  />
                </div>
              ) : (
                <tab.Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  color={isActive ? '#FFFFFF' : '#636366'}
                />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: isActive ? '#FFFFFF' : '#636366', fontWeight: isActive ? 600 : 500 }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom version */}
      <div className="px-6 py-5">
        <span className="text-xs text-[#38383A]">v1.0.0</span>
      </div>
    </aside>
  );
}
