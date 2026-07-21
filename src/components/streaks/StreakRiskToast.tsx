import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { PillarType } from '../../types';

interface Props {
  pillar: PillarType;
  days: number;
  onNavigate: (pillar: PillarType) => void;
  onClose: () => void;
}

const pillarConfig: Record<PillarType, string> = {
  treino: 'Treino',
  dieta: 'Dieta',
  habitos: 'Hábitos',
  agenda: 'Agenda',
  financas: 'Finanças',
  checkin: 'Check-in',
};

export default function StreakRiskToast({ pillar, days, onNavigate, onClose }: Props) {
  const label = pillarConfig[pillar];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-16 inset-x-4 z-[200] max-w-sm mx-auto bg-[#2A2A2A] rounded-xl border-l-[3px] border-l-[#FF9F43] shadow-lg p-4 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-[#FF9F43] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[#B9CBB9] text-[13px] font-medium leading-tight">
            <span className="font-bold text-white block mb-1">
              ⚠️ Seu streak de {label} está em risco!
            </span>
            Você tem até meia-noite para não perder seus {days} dias consecutivos.
          </p>
          <button
            onClick={() => onNavigate(pillar)}
            className="text-[#00FF88] text-[13px] font-bold mt-2 hover:underline active:scale-95 transition-transform origin-left"
          >
            [Ver {label}]
          </button>
        </div>
        <button onClick={onClose} className="text-[#B9CBB9] hover:text-white p-1">
           ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
