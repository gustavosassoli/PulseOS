import { motion } from 'motion/react';
import { Dumbbell, Utensils, Zap, CheckSquare, Wallet, Sun, Flame } from 'lucide-react';
import { UserProfile, PillarType } from '../../types';

interface Props {
  userProfile: UserProfile | null;
}

const pillarConfig: Record<PillarType, { icon: any, label: string, color: string }> = {
  treino: { icon: Dumbbell, label: 'Treino', color: '#00FF88' },
  dieta: { icon: Utensils, label: 'Dieta', color: '#FFD166' },
  habitos: { icon: Zap, label: 'Hábitos', color: '#FF9F43' },
  agenda: { icon: CheckSquare, label: 'Agenda', color: '#60A5FA' },
  financas: { icon: Wallet, label: 'Finanças', color: '#A78BFA' },
  checkin: { icon: Sun, label: 'Check-in', color: '#FB923C' },
};

export default function StreakScroll({ userProfile }: Props) {
  if (!userProfile) return null;

  const streaks = userProfile.streaks || {
    treino: { current: 0, longest: 0, lastCompletedDate: '' },
    dieta: { current: 0, longest: 0, lastCompletedDate: '' },
    habitos: { current: 0, longest: 0, lastCompletedDate: '' },
    agenda: { current: 0, longest: 0, lastCompletedDate: '' },
    financas: { current: 0, longest: 0, lastCompletedDate: '' },
    checkin: { current: userProfile.currentStreak || 0, longest: userProfile.longestStreak || 0, lastCompletedDate: '' }
  };

  const pillarsOrder: PillarType[] = ['treino', 'dieta', 'habitos', 'agenda', 'checkin', 'financas'];

  return (
    <div className="w-full mb-8">
      <h2 className="text-white font-black text-xl mb-4 font-sans tracking-tight">Suas Sequências</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {pillarsOrder.map((pillar, index) => {
          const config = pillarConfig[pillar];
          const Icon = config.icon;
          const streakData = streaks[pillar] || { current: 0 };
          const isActive = streakData.current > 0;

          return (
            <motion.div
               key={pillar}
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: isActive ? 1 : 0.5 }}
               transition={{ delay: index * 0.08, duration: 0.3 }}
               className="shrink-0 w-[100px] h-[110px] bg-[#1C1B1B] rounded-xl flex flex-col items-center justify-center relative shadow-sm"
               style={{
                 border: isActive ? `1px solid ${config.color}4D` : '1px solid transparent'
               }}
            >
               <Icon className="w-5 h-5 mb-1" style={{ color: config.color }} />
               <span className="text-[#B9CBB9] text-[10px] uppercase tracking-wide font-bold mb-1">
                 {config.label}
               </span>
               <span className="text-white font-sans font-black text-[32px] leading-none mb-1">
                 {isActive ? streakData.current : '--'}
               </span>
               <div className="flex items-center gap-1">
                 {isActive && <Flame className="w-3.5 h-3.5 text-[#FF9F43]" />}
                 <span className="text-[#B9CBB9] text-[11px] font-medium leading-none">
                   dias
                 </span>
               </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
