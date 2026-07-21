import { Pillar, AgendaItem, Tab } from '../types';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { subscribeToAgenda, subscribeToTransactions, subscribeToMeals, subscribeToUserProfile } from '../services/firestore';
import LifeScoreRing from './LifeScoreRing';
import StreakScroll from './streaks/StreakScroll';
import ScoreBreakdown from './ScoreBreakdown';
import { useTodayCheckin } from '../hooks/useTodayCheckin';
import { Quote } from 'lucide-react';
import { UserProfile } from '../types';

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { checkin } = useTodayCheckin();

  useEffect(() => {
    const unsubAgenda = subscribeToAgenda(setAgenda);
    const unsubTransactions = subscribeToTransactions(setTransactions);
    const unsubMeals = subscribeToMeals(setMeals);
    const unsubProfile = subscribeToUserProfile(setUserProfile);
    return () => {
      unsubAgenda();
      unsubTransactions();
      unsubMeals();
      unsubProfile();
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

  return (
    <div className="space-y-10 pb-10">
      {checkin && checkin.intention && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1B1B] border border-transparent border-l-3 border-l-[#00FF88] rounded-r-xl p-4 flex gap-3 max-w-sm"
        >
          <Quote className="w-5 h-5 text-[#00FF88] shrink-0 mt-0.5" />
          <p className="text-white text-sm font-medium italic">"{checkin.intention}"</p>
        </motion.div>
      )}

      <LifeScoreRing />
      
      <ScoreBreakdown />
      
      <StreakScroll userProfile={userProfile} />

      {/* Agenda Summary */}
      <section>
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Agenda de Hoje</h3>
          
          <div className="flex gap-2 items-center">
            {agenda.filter(i => (i.priority === 'urgent') && !i.completed).length > 0 && (
              <div className="flex items-center gap-1 bg-[#FF4D4D]/10 rounded-full px-2 py-0.5 border border-[#FF4D4D]/30">
                <span className="text-[8px]">🔴</span>
                <span className="text-[#FF4D4D] text-[11px] font-bold">{agenda.filter(i => (i.priority === 'urgent') && !i.completed).length}</span>
              </div>
            )}
            {agenda.filter(i => (i.priority === 'important') && !i.completed).length > 0 && (
              <div className="flex items-center gap-1 bg-[#FFD166]/10 rounded-full px-2 py-0.5 border border-[#FFD166]/30">
                <span className="text-[8px]">🟡</span>
                <span className="text-[#FFD166] text-[11px] font-bold">{agenda.filter(i => (i.priority === 'important') && !i.completed).length}</span>
              </div>
            )}
            {agenda.filter(i => (!i.priority || i.priority === 'normal') && !i.completed).length > 0 && (
              <div className="flex items-center gap-1 bg-[#00FF88]/10 rounded-full px-2 py-0.5 border border-[#00FF88]/30">
                <span className="text-[8px]">🟢</span>
                <span className="text-[#00FF88] text-[11px] font-bold">{agenda.filter(i => (!i.priority || i.priority === 'normal') && !i.completed).length}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pillars Bento Grid */}
      <section>
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Visão Geral</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
