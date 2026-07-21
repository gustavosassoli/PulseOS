import { motion } from 'motion/react';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';
import { subscribeToUserProfile } from '../services/firestore';

export default function ScoreBreakdown() {
  const { breakdown } = useLifeScoreStore();
  const [dbBreakdown, setDbBreakdown] = useState(breakdown);

  useEffect(() => {
    const unsub = subscribeToUserProfile((data) => {
      if (data && data.scoreBreakdown) {
          setDbBreakdown(data.scoreBreakdown);
      }
    });
    return () => unsub();
  }, []);

  const currentBreakdown = dbBreakdown || breakdown;

  if (!currentBreakdown) return null;

  const pillars = [
    { id: 'agenda', name: 'Agenda', max: currentBreakdown.agenda?.maximo || 30, pts: currentBreakdown.agenda?.pontos || 0, icon: 'CheckSquare' },
    { id: 'treino', name: 'Treino', max: currentBreakdown.treino?.maximo || 20, pts: currentBreakdown.treino?.pontos || 0, icon: 'Dumbbell' },
    { id: 'dieta', name: 'Dieta', max: currentBreakdown.dieta?.maximo || 20, pts: currentBreakdown.dieta?.pontos || 0, icon: 'Utensils' },
    { id: 'habitos', name: 'Hábitos', max: currentBreakdown.habitos?.maximo || 15, pts: currentBreakdown.habitos?.pontos || 0, icon: 'Zap' },
    { id: 'bemEstar', name: 'Bem-Estar', max: currentBreakdown.bemEstar?.maximo || 10, pts: currentBreakdown.bemEstar?.pontos || 0, icon: 'Heart' },
    { id: 'financas', name: 'Finanças', max: currentBreakdown.financas?.maximo || 5, pts: currentBreakdown.financas?.pontos || 0, icon: 'Wallet' },
  ];

  return (
    <section className="mb-10">
      <div className="flex justify-between items-end mb-4 sm:mb-6">
        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Detalhamento do Dia</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {pillars.map(pillar => {
          const Icon = (LucideIcons as any)[pillar.icon];
          const progress = Math.min((pillar.pts / pillar.max) * 100, 100) || 0;
          let barColor = '#353534';
          if (progress >= 100) barColor = '#00FF88';
          else if (progress >= 50) barColor = '#FFD166';
          else if (progress > 0) barColor = '#FF9F43';

          return (
            <div key={pillar.id} className="bg-[#1C1B1B] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-on-surface-variant" />}
                  <span className="font-bold text-white text-xs tracking-tight">{pillar.name}</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">{pillar.pts} / {pillar.max}</span>
              </div>
              <div className="w-full bg-[#353534] rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ backgroundColor: barColor }}
                  className="h-full rounded-full"
                ></motion.div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  );
}
