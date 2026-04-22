import { motion } from 'framer-motion';
import {
  User, Bell, Palette, Globe, Volume2, HelpCircle,
  Mail, Star, FileText, ChevronRight, BookOpen
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const SETTINGS_GROUPS = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile' },
      { icon: BookOpen, label: 'Trading Preferences' },
      { icon: Bell, label: 'Notifications' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: Palette, label: 'Theme' },
      { icon: Globe, label: 'Language' },
      { icon: Volume2, label: 'Sound Effects' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center' },
      { icon: Mail, label: 'Contact Us' },
      { icon: Star, label: 'Rate App' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: FileText, label: 'Privacy Policy' },
      { icon: FileText, label: 'Terms of Service' },
    ],
  },
];

export default function ProfileScreen() {
  const navigate = useStore((s) => s.navigate);

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 px-6 md:px-8 py-4 md:py-5"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}
      >
        <h3 className="text-xl md:text-2xl font-bold text-white">Profile</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 md:px-0 pb-8">
        {/* Desktop: two-column layout */}
        <div className="md:grid md:grid-cols-[320px_1fr] md:gap-0 md:h-full">

          {/* Left: User info + journal */}
          <div className="md:border-r md:border-[#1C1C1E] md:px-8 md:py-6">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 py-6 md:py-0 md:mb-6"
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}
              >
                JD
              </div>
              <div>
                <div className="text-lg md:text-xl font-semibold text-white">John Doe</div>
                <div className="text-sm text-[#8E8E93]">john.doe@email.com</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  <span className="text-xs text-[#34C759] font-medium">Elite Trader</span>
                </div>
              </div>
            </motion.div>

            {/* Journal Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate('JournalScreen')}
              className="w-full p-4 rounded-2xl flex items-center justify-between mb-6 active:scale-[0.98] transition-transform"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34C759]/15 flex items-center justify-center">
                  <BookOpen size={20} color="#34C759" />
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold text-white">Trading Journal</div>
                  <div className="text-xs text-[#8E8E93]">Track your performance</div>
                </div>
              </div>
              <ChevronRight size={18} color="#8E8E93" />
            </motion.button>

            {/* Sign Out — visible on desktop in left column */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="hidden md:block w-full py-3 text-center text-base font-medium active:opacity-70 transition-opacity rounded-2xl border border-[#38383A]"
              style={{ color: '#FF3B30' }}
            >
              Sign Out
            </motion.button>
          </div>

          {/* Right: Settings */}
          <div className="md:px-8 md:py-6 md:overflow-y-auto">
            {SETTINGS_GROUPS.map((group, gi) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + gi * 0.1 }}
                className="mb-6"
              >
                <h4 className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-2 px-1">
                  {group.title}
                </h4>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
                >
                  {group.items.map((item, ii) => (
                    <button
                      key={item.label}
                      className="flex items-center justify-between w-full px-4 py-3.5 text-left active:bg-[#2C2C2E] hover:bg-[#2C2C2E] transition-colors"
                      style={{
                        borderBottom: ii < group.items.length - 1 ? '1px solid #38383A' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} color="#8E8E93" />
                        <span className="text-base text-white">{item.label}</span>
                      </div>
                      <ChevronRight size={16} color="#636366" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Sign Out — mobile only */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="md:hidden w-full py-3 text-center text-base font-medium active:opacity-70 transition-opacity"
              style={{ color: '#FF3B30' }}
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
