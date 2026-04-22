import { motion } from 'framer-motion';
import { Home, Brain, Camera, Atom, User, TrendingUp, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { key: 'home',          label: 'Home',     Icon: Home },
  { key: 'gold-analysis', label: 'Quant',    Icon: Zap },
  { key: 'ai-brain',      label: 'AI Brain', Icon: Brain },
  { key: 'analyze',       label: 'Analyze',  Icon: Camera },
  { key: 'markets',       label: 'Markets',  Icon: Atom },
  { key: 'profile',       label: 'Profile',  Icon: User },
];

export default function SidebarNavigation() {
  const activeTab    = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-full z-50 theme-bg-nav"
      style={{ backdropFilter: 'blur(20px)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 mb-2">
        <TrendingUp size={22} strokeWidth={2} style={{ color: 'var(--text-primary)' }} />
        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          PROFIT AI
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const isActive   = activeTab === tab.key;
          const isAnalyze  = tab.key === 'analyze';

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative"
              style={{
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                  style={{ background: 'var(--text-primary)' }}
                />
              )}

              {isAnalyze ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? 'var(--text-primary)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}>
                  <tab.Icon size={16} strokeWidth={isActive ? 2.5 : 1.5}
                    style={{ color: isActive ? 'var(--bg-app)' : 'var(--text-secondary)' }} />
                </div>
              ) : (
                <tab.Icon size={20} strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }} />
              )}

              <span className="text-sm"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-5">
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>v1.0.0</span>
      </div>
    </aside>
  );
}
