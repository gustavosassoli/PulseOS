import { motion } from 'motion/react';
import { GeneratedDiet } from '../services/DietAIService';
import React from 'react';

export interface DietHistoryCardProps {
  diet: GeneratedDiet;
  isActive: boolean;
  onReactivate: (diet: GeneratedDiet) => void;
  index: number;
}

export const DietHistoryCard: React.FC<DietHistoryCardProps> = ({ diet, isActive, onReactivate, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`p-5 rounded-xl border ${isActive ? 'bg-primary-container/10 border-primary-container' : 'bg-surface-container border-white/5'} flex flex-col gap-4`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex gap-2 items-center mb-1">
            <span className="material-symbols-outlined text-[16px] text-primary-container">auto_awesome</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Dieta IA</span>
          </div>
          <h4 className="font-bold text-white text-lg">{diet.totalCalories} kcal/dia</h4>
        </div>
        {isActive ? (
          <span className="px-3 py-1 bg-primary-container text-[#131313] text-[10px] font-black uppercase tracking-widest rounded-full">Ativa</span>
        ) : (
          <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-full">Anterior</span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <span className="block text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">Refeições</span>
          <span className="text-white font-medium text-sm">{diet.meals.length} por dia</span>
        </div>
        <div className="flex-1">
          <span className="block text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">Foco</span>
          <span className="text-white font-medium text-sm">Personalizado</span>
        </div>
      </div>

      {!isActive && (
        <button 
          onClick={() => {
            if (window.confirm("Deseja substituir sua dieta ativa por esta?")) {
              onReactivate(diet);
            }
          }}
          className="w-full mt-2 py-3 bg-transparent border border-primary-container/50 text-primary-container rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-primary-container/10 transition-colors"
        >
          Reativar esta dieta
        </button>
      )}
    </motion.div>
  );
}
