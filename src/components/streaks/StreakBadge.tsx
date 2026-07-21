import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PillarType } from '../../types';

interface StreakBadgeProps {
  pillar: PillarType;
  current: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StreakBadge({ pillar, current, size = 'md', showLabel = true }: StreakBadgeProps) {
  const isActive = current > 0;
  
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-1 ${isActive ? 'text-[#FF9F43]' : 'text-[#353534]'}`}>
        <Flame className="w-3.5 h-3.5" />
        <span className="text-[13px] font-bold">{current}</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="w-[80px] h-[80px] bg-[#1C1B1B] rounded-xl flex flex-col items-center justify-center border border-[#3B4B3D]/30 shadow-sm relative overflow-hidden">
        <AnimatePresence>
          {current >= 7 && (
             <motion.div
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-1 right-[28px] w-6 h-6 bg-[#FF9F43]/30 rounded-full blur-md"
             />
          )}
        </AnimatePresence>
        <Flame className={`w-7 h-7 mb-0.5 ${isActive ? 'text-[#FF9F43]' : 'text-[#353534]'}`} />
        <span className="text-white font-sans font-black text-2xl leading-none tracking-tight block">
          {isActive ? current : '--'}
        </span>
        {showLabel && <span className="text-[#B9CBB9] text-[11px] font-medium leading-none mt-1">dias</span>}
      </div>
    );
  }

  // Medium (md) default
  if (!isActive) return null; // md typically hides if zero in context, but up to usage

  return (
    <div className="flex items-center gap-1.5 bg-[#FF9F43]/10 px-[10px] py-1 rounded-full">
      <Flame className="w-[18px] h-[18px] text-[#FF9F43]" />
      <span className="text-[#FF9F43] text-[12px] font-bold flex items-center gap-1">
        <span className="text-[16px] leading-none mb-[1px]">{current}</span> 
        {showLabel && <span>dias</span>}
      </span>
    </div>
  );
}
