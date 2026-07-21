import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Utensils, Zap, CheckSquare, Wallet, Sun } from 'lucide-react';
import { PillarType } from '../../types';

interface Props {
  pillar: PillarType;
  days: number;
  message: string;
  onClose: () => void;
}

const pillarConfig: Record<PillarType, { icon: any, label: string, color: string }> = {
  treino: { icon: Dumbbell, label: 'Treino', color: '#00FF88' },
  dieta: { icon: Utensils, label: 'Dieta', color: '#FFD166' },
  habitos: { icon: Zap, label: 'Hábitos', color: '#FF9F43' },
  agenda: { icon: CheckSquare, label: 'Agenda', color: '#60A5FA' },
  financas: { icon: Wallet, label: 'Finanças', color: '#A78BFA' },
  checkin: { icon: Sun, label: 'Check-in', color: '#FB923C' },
};

export default function StreakMilestoneModal({ pillar, days, message, onClose }: Props) {
  const config = pillarConfig[pillar];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm bg-[#1C1B1B] rounded-xl p-8 relative flex flex-col items-center shadow-2xl z-10 border border-white/5"
        >
          {/* Particles wrapper */}
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            {/* Particles can go here */}
          </div>

          <div 
             className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
             style={{ backgroundColor: `${config.color}20` }}
          >
             <Icon className="w-10 h-10" style={{ color: config.color }} />
          </div>

          <h2 className="text-white font-sans font-black text-[28px] leading-tight text-center mb-2 tracking-tight">
            {days} dias de {config.label}!
          </h2>
          <p className="text-[#B9CBB9] text-center text-lg font-medium mb-8">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] font-bold py-4 rounded-xl text-lg hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,255,136,0.15)]"
          >
            Continuar 🚀
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
