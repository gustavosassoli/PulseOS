import { useState } from 'react';
import { motion } from 'motion/react';

interface Props {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { id: 1, label: 'S' }, // Seg
  { id: 2, label: 'T' },
  { id: 3, label: 'Q' },
  { id: 4, label: 'Q' },
  { id: 5, label: 'S' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' }, // Dom
];

export default function RecurrenceSelector({ selectedDays, onChange }: Props) {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  };

  return (
    <div className="flex justify-between w-full">
      {DAYS.map((day) => {
        const isSelected = selectedDays.includes(day.id);
        return (
          <button
            key={day.id}
            onClick={() => toggleDay(day.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors relative overflow-hidden ${
              isSelected ? 'text-[#003919]' : 'text-[#B9CBB9] bg-[#2A2A2A] hover:bg-[#353534]'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`bg-${day.id}`}
                className="absolute inset-0 bg-[#00FF88]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
            <span className="relative z-10">{day.label}</span>
          </button>
        );
      })}
    </div>
  );
}
