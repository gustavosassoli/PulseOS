import { motion } from 'motion/react';

interface GoalOption {
  id: 'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced';
  label: string;
  icon: string;
}

interface Props {
  userName: string;
  selectedGoal: string;
  onSelectGoal: (goal: 'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced') => void;
}

export default function OnboardingStep2({ userName, selectedGoal, onSelectGoal }: Props) {
  const options: GoalOption[] = [
    { id: 'productivity', label: 'Produtividade', icon: '🎯' },
    { id: 'muscle', label: 'Ganhar massa', icon: '💪' },
    { id: 'weightLoss', label: 'Perder peso', icon: '⚖️' },
    { id: 'wellness', label: 'Bem-estar', icon: '🧘' },
    { id: 'finance', label: 'Finanças', icon: '💰' },
    { id: 'balanced', label: 'Tudo equilibrado', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col py-2 px-1 h-full select-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white leading-tight font-sans tracking-tight">
          Qual é o seu foco principal, <span className="text-[#00FF88] font-black">{userName || 'parceiro'}</span>?
        </h2>
        <p className="text-[#B9CBB9] text-[14px] font-medium mt-2">
          Isso vai personalizar suas metas e o seu Life Score
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full mt-2">
        {options.map((option) => {
          const isSelected = selectedGoal === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => onSelectGoal(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: isSelected ? 1.02 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer transition-all border outline-none text-center ${
                isSelected
                  ? 'border-2 border-[#00FF88] bg-[#00FF88]/10 shadow-[0_4px_20px_rgba(0,255,136,0.1)]'
                  : 'border-[#3B4B3D] bg-[#1C1B1B] hover:border-[#00FF88]/40'
              }`}
            >
              <span className="text-3xl mb-3 block filter drop-shadow-sm">{option.icon}</span>
              <span className="font-bold text-[13px] text-white tracking-tight">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
