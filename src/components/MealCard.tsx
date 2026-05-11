import React from 'react';
import { motion } from 'motion/react';

interface MealCardProps {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  items: {
    name: string;
    quantity: string;
    calories: number;
  }[];
}

export function MealCard({ name, time, calories, protein, carbs, fats, items }: MealCardProps) {
  const getIcon = (mealName: string) => {
    const l = mealName.toLowerCase();
    if (l.includes('café') || l.includes('cafe')) return 'coffee';
    if (l.includes('almoço') || l.includes('almoco')) return 'restaurant';
    if (l.includes('jantar')) return 'dinner_dining';
    if (l.includes('lanche')) return 'tapas';
    return 'restaurant';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container rounded-xl p-5 border border-white/5 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">{getIcon(name)}</span>
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">{name}</h4>
            <div className="flex items-center gap-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {time}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="block font-black text-primary-container text-xl">{calories}</span>
          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">kcal</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex flex-col">
              <span className="text-white font-medium">{item.name}</span>
              <span className="text-on-surface-variant text-xs">{item.quantity}</span>
            </div>
            <span className="text-on-surface-variant font-bold">{item.calories} kcal</span>
          </div>
        ))}
      </div>

      {(protein !== undefined || carbs !== undefined || fats !== undefined) && (
        <div className="pt-2 flex gap-3 border-t border-surface-container-highest mt-2">
          {protein !== undefined && <span className="text-[10px] font-bold text-[#B9CBB9] uppercase">P: {protein}g</span>}
          {carbs !== undefined && <span className="text-[10px] font-bold text-[#A3B8CC] uppercase">C: {carbs}g</span>}
          {fats !== undefined && <span className="text-[10px] font-bold text-primary-container uppercase">G: {fats}g</span>}
        </div>
      )}
    </motion.div>
  );
}
