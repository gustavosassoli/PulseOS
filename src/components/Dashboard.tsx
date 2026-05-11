import { Pillar, AgendaItem, Tab } from '../types';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { subscribeToAgenda, subscribeToTransactions, subscribeToMeals } from '../services/firestore';

const IconMap: Record<string, string> = {
  wallet: 'wallet',
  dumbbell: 'fitness_center',
  apple: 'restaurant',
};

interface DashboardProps {
  onTabChange: (tab: Tab) => void;
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    const unsubAgenda = subscribeToAgenda(setAgenda);
    const unsubTransactions = subscribeToTransactions(setTransactions);
    const unsubMeals = subscribeToMeals(setMeals);
    return () => {
      unsubAgenda();
      unsubTransactions();
      unsubMeals();
    };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const transactionsToday = transactions.filter(t => t.date === today);
  const financesProgress = Math.min((transactionsToday.length / 5) * 100, 100); 
  const workoutProgress = Math.min((agenda.filter(i => (i.category === 'Saúde' || i.category === 'Pessoal') && i.completed).length / Math.max(agenda.length, 1)) * 100, 100); 
  const nutritionProgress = Math.min((meals.length / 3) * 100, 100); 

  const pillars: Pillar[] = [
    { id: 'finances', name: 'Finanças', icon: 'wallet', color: 'primary-container', progress: financesProgress, goalLabel: `${Math.round(financesProgress)}%` },
    { id: 'workout', name: 'Treino', icon: 'dumbbell', color: 'primary-container', progress: workoutProgress, goalLabel: `${Math.round(workoutProgress)}%` },
    { id: 'diet', name: 'Nutrição', icon: 'apple', color: 'primary-container', progress: nutritionProgress, goalLabel: `${Math.round(nutritionProgress)}%` },
  ];

  const lifeScore = Math.round(pillars.reduce((acc, curr) => acc + curr.progress, 0) / pillars.length);

  return (
    <div className="space-y-10 pb-10">
      {/* Life Score Central Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[80px]"></div>
          
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle className="text-surface-container-highest" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="12"></circle>
              <motion.circle 
                initial={{ strokeDashoffset: 628 }}
                animate={{ strokeDashoffset: 628 - (628 * lifeScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-primary-container drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]" 
                cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeDasharray="628" strokeLinecap="round" strokeWidth="12"
              ></motion.circle>
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-white font-headline tracking-tighter">{lifeScore}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mt-1">Life Score</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-black tracking-tighter text-white italic">MANTENHA O MOMENTUM.</h2>
            <p className="text-on-surface-variant mt-2 text-sm max-w-[240px]">
              {lifeScore > 50 ? 'Seu desempenho está excelente!' : 'Continue focado nos seus pilares.'}
            </p>
          </div>
        </div>
      </section>

      {/* Pillars Bento Grid */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Visão Geral</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {pillars.map((pillar) => {
            const iconName = IconMap[pillar.icon];
            return (
              <motion.div 
                key={pillar.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange(pillar.id as Tab)}
                className="bg-surface-container-high rounded-xl p-5 hover:bg-surface-container-highest transition-all cursor-pointer border-l-4 border-transparent hover:border-primary-container"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary-container text-xl">{iconName}</span>
                  <span className="font-bold text-white text-sm tracking-tight">{pillar.name}</span>
                </div>
                <div className="w-full bg-surface-container-lowest rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pillar.progress}%` }}
                    className={`bg-primary-container h-full rounded-full`} 
                  ></motion.div>
                </div>
                <p className="text-[10px] mt-2 font-bold tracking-widest uppercase text-on-surface-variant flex justify-between">
                  <span>Conclusão</span>
                  <span className="text-primary-container">{pillar.goalLabel}</span>
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Insight of the Day */}
      <section>
        <div className="glass-panel relative rounded-xl p-8 overflow-hidden bg-surface-container-low">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary-container/20 rounded-full blur-[60px]"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-sm text-primary-container">lightbulb</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">Insight Pulse</span>
            </div>
            <p className="text-xl font-bold italic tracking-tight text-white leading-relaxed">"A consistência é o catalisador que transforma o esforço comum em resultados extraordinários."</p>
          </div>
        </div>
      </section>
    </div>
  );
}
