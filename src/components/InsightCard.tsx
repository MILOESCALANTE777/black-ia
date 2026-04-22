import { TrendingUp, AlertTriangle, BarChart2, Activity, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  index?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  'minus': Minus,
  'alert-triangle': AlertTriangle,
  'bar-chart-2': BarChart2,
  'activity': Activity,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  green: { bg: 'rgba(52,199,89,0.15)', text: '#34C759' },
  orange: { bg: 'rgba(255,149,0,0.15)', text: '#FF9500' },
  red: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30' },
  purple: { bg: 'rgba(175,82,222,0.15)', text: '#AF52DE' },
};

export default function InsightCard({ label, value, icon, color, index = 0 }: InsightCardProps) {
  const IconComponent = ICON_MAP[icon] || Minus;
  const colors = COLOR_MAP[color] || COLOR_MAP.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: '#1C1C1E' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: colors.bg }}
      >
        <IconComponent size={20} color={colors.text} strokeWidth={2} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-[#8E8E93] font-medium">{label}</span>
        <span className="text-base text-white font-semibold truncate">{value}</span>
      </div>
    </motion.div>
  );
}
