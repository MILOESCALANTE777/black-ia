import { motion } from 'framer-motion';
import { Camera, TrendingUp, Rocket, Brain, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';

const features = [
  { Icon: Camera, label: 'Snap & Analyze', sub: 'Instantly', color: '#FF9500' },
  { Icon: TrendingUp, label: 'Understand Key', sub: 'Market Trends', color: '#34C759' },
  { Icon: Rocket, label: 'Get Actionable', sub: 'Insights', color: '#007AFF' },
  { Icon: Brain, label: 'Define Your', sub: 'Own Strategy', color: '#AF52DE' },
  { Icon: Star, label: 'Start Trading Like', sub: 'a Pro', color: '#FF9500' },
];

export default function OnboardingFeaturesScreen() {
  const navigate = useStore((s) => s.navigate);

  return (
    <div className="flex-1 flex flex-col bg-black px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-12"
      >
        <h2 className="text-[28px] font-bold text-white leading-tight tracking-tight">
          Transform your{'\n'}trading journey!
        </h2>
      </motion.div>

      {/* Features List */}
      <div className="flex-1 flex items-center">
        <div
          className="w-full rounded-3xl p-5 space-y-4"
          style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${feat.color}20` }}
              >
                <feat.Icon size={22} color={feat.color} strokeWidth={2} />
              </div>
              <div>
                <span className="text-base font-semibold text-white">{feat.label}</span>{' '}
                <span className="text-base font-semibold text-white">{feat.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pb-8"
      >
        <button
          onClick={() => navigate('ExperienceSelectScreen')}
          className="w-full py-4 rounded-full bg-white text-black font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
