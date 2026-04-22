import { motion } from 'framer-motion';

interface StatusDotsProps {
  filled: number;
  total?: number;
}

const COLORS = ['#34C759', '#FF9500', '#FF3B30'];

export default function StatusDots({ filled, total = 4 }: StatusDotsProps) {
  const getColor = () => {
    if (filled >= 4) return COLORS[0];
    if (filled >= 2) return COLORS[1];
    return COLORS[2];
  };

  const color = getColor();

  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 500, damping: 30 }}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: i < filled ? color : '#38383A',
          }}
        />
      ))}
    </div>
  );
}
