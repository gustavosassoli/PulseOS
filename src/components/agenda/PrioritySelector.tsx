import { motion } from 'motion/react';
import { AlertCircle, AlertTriangle, Circle } from 'lucide-react';

interface Props {
  value: 'urgent' | 'important' | 'normal';
  onChange: (value: 'urgent' | 'important' | 'normal') => void;
}

export default function PrioritySelector({ value, onChange }: Props) {
  const options = [
    {
      id: 'urgent',
      label: 'Urgente',
      icon: AlertCircle,
      colors: 'bg-[#FF4D4D]/20 border border-[#FF4D4D] text-[#FF4D4D]',
      unselected: 'bg-[#2A2A2A] text-[#B9CBB9] border border-transparent'
    },
    {
      id: 'important',
      label: 'Importante',
      icon: AlertTriangle,
      colors: 'bg-[#FFD166]/20 border border-[#FFD166] text-[#FFD166]',
      unselected: 'bg-[#2A2A2A] text-[#B9CBB9] border border-transparent'
    },
    {
      id: 'normal',
      label: 'Normal',
      icon: Circle,
      colors: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
      unselected: 'bg-[#2A2A2A] text-[#B9CBB9] border border-transparent'
    }
  ] as const;

  return (
    <div className="flex flex-row gap-2 w-full">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const Icon = opt.icon;
        
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 rounded-xl transition-colors font-medium text-xs sm:text-sm ${
              isSelected ? opt.colors : opt.unselected
            }`}
          >
            {isSelected ? (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
