import { motion } from 'motion/react';

interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  delay?: number;
}

export function AchievementBadge({ title, description, icon, isUnlocked, delay = 0 }: AchievementBadgeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`flex items-center gap-4 p-4 rounded-xl border ${isUnlocked ? 'bg-surface-container-low border-primary-container/20' : 'bg-surface-container-lowest border-white/5 opacity-50'}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-primary-container/10 text-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>
        <span className="material-symbols-outlined text-[24px]">
          {isUnlocked ? icon : 'lock'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate ${isUnlocked ? 'text-white' : 'text-on-surface-variant'}`}>{title}</h4>
        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5 leading-snug">{description}</p>
      </div>
    </motion.div>
  );
}
