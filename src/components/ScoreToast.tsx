import { motion, AnimatePresence } from 'motion/react';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import * as LucideIcons from 'lucide-react';

export default function ScoreToast() {
  const { toastMessage, toastIcon, lastPointsEarned } = useLifeScoreStore();

  const IconComponent = toastIcon && (LucideIcons as any)[toastIcon];

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-[#2A2A2A] rounded-full px-4 py-2 flex items-center gap-3 shadow-lg border border-white/5">
            {IconComponent && <IconComponent className="w-4 h-4 text-[#00FF88]" />}
            <span className="text-sm font-medium text-[#B9CBB9]">{toastMessage}</span>
            {lastPointsEarned !== 0 && (
              <span className={`text-sm font-bold ${lastPointsEarned > 0 ? 'text-[#00FF88]' : 'text-[#FF4C4C]'}`}>
                {lastPointsEarned > 0 ? '+' : ''}{lastPointsEarned} pts
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
