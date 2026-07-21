import { motion } from "motion/react";

interface Props {
  energy: number;
  onChange: (val: number) => void;
}

export default function CheckinEnergy({ energy, onChange }: Props) {
  const levels = [
    { value: 1, emoji: "😫", label: "Esgotado", color: "#FF4D4D" },
    { value: 2, emoji: "🥱", label: "Cansado", color: "#FF9F43" },
    { value: 3, emoji: "😐", label: "Normal", color: "#FFD166" },
    { value: 4, emoji: "🙂", label: "Bem", color: "#00FF88" },
    { value: 5, emoji: "🔥", label: "Ótimo", color: "#00FF88" },
  ];

  return (
    <div className="w-full flex justify-between gap-2 max-w-[340px] mx-auto px-1">
      {levels.map((level) => {
        const isSelected = energy === level.value;
        return (
          <motion.div
            key={level.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(level.value)}
            className={`flex flex-col items-center justify-center w-[60px] h-[60px] rounded-xl cursor-pointer transition-colors ${
              isSelected
                ? "border-2"
                : "bg-[#2A2A2A] border-2 border-transparent"
            }`}
            style={{
              borderColor: isSelected ? level.color : "transparent",
              backgroundColor: isSelected
                ? `${level.color}${level.value === 5 ? "4D" : "33"}` // 30% or 20% opacity using hex
                : undefined,
              boxShadow:
                isSelected && level.value === 5
                  ? `0 0 12px ${level.color}40`
                  : undefined,
            }}
          >
            <span className="text-[28px] leading-none mb-1">{level.emoji}</span>
            <span className="text-[10px] text-[#B9CBB9] font-medium leading-none">
              {level.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
