import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReportsData } from '../hooks/useReportsData';
import { WeeklyCalorieChart } from './WeeklyCalorieChart';
import { MacroSparkline } from './MacroSparkline';
import { AchievementBadge } from './AchievementBadge';
import { DietHistoryCard } from './DietHistoryCard';

export default function Reports({ onBack }: { onBack?: () => void }) {
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const { isLoading, reports, calorieGoal, dietHistory, activeDiet, reactivateDiet } = useReportsData(period);

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-container"></div>
      </div>
    );
  }

  if (!reports.hasSufficientData) {
    return (
      <div className="w-full space-y-6">
        <header className="mb-8 flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full text-[#00FF88] hover:bg-[#2A2A2A] transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-headline font-black text-white tracking-tight">Relatórios de Dieta</h1>
            <p className="text-on-surface-variant text-sm mt-1">Seu progresso e evolução nutricional.</p>
          </div>
        </header>

        <div className="bg-surface-container rounded-2xl p-8 text-center border border-white/5">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">insights</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Poucos Dados</h3>
          <p className="text-on-surface-variant text-sm mb-6 max-w-xs mx-auto">
            Registre suas refeições por pelo menos 2 dias para ver sua evolução aqui. 📊
          </p>
          <button 
            onClick={() => {
                // Emulate cross-component navigation in App by changing activeTab, 
              // but since we don't have navigate fn, we can dispatch a custom event.
              if (onBack) {
                onBack();
              } else {
                const event = new CustomEvent('navigate', { detail: 'diet' });
                window.dispatchEvent(event);
              }
            }}
            className="px-6 py-3 bg-gradient-to-br from-[#00E479] to-[#00FF88] text-[#003919] font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-sm"
          >
            Ir para Dieta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10 bg-[#131313]">
      <header className="flex items-center gap-4">
        {onBack && (
            <button onClick={onBack} className="p-2 rounded-full text-[#00FF88] hover:bg-[#2A2A2A] transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
        )}
        <div>
          <h1 className="text-3xl font-headline font-black text-white tracking-tight">Relatórios de Dieta</h1>
          <p className="text-on-surface-variant text-sm mt-1">Seu progresso e evolução nutricional.</p>
        </div>
      </header>

      {/* Hero Card - Week Summary */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#00E479]/10 to-[#00FF88]/5 border border-primary-container/20 rounded-[24px] p-6 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/20 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-bold text-primary-container uppercase tracking-widest block mb-1">Média Diária</span>
              <h2 className="text-3xl font-black text-white flex items-baseline gap-1">
                {reports.averages.total} <span className="text-base font-medium text-on-surface-variant">kcal/dia</span>
              </h2>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${reports.changes.total <= 0 ? 'bg-primary-container/20 text-primary-container' : 'bg-error/20 text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {reports.changes.total <= 0 ? 'trending_down' : 'trending_up'}
              </span>
              {Math.abs(reports.changes.total)}%
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary-container">target</span>
              Meta: {calorieGoal} kcal
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#FFD166]">local_fire_department</span>
              {reports.consistencyCount} de {period} dias
            </div>
          </div>
        </div>
      </motion.section>

      {/* Calorie Evolution Chart */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-headline font-bold text-white">Evolução Calórica</h3>
          
          <div className="flex bg-surface-container-lowest rounded-full p-1 border border-white/5">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d as 7|14|30)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${period === d ? 'bg-surface-container-high text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-[24px] p-4 border border-white/5">
          <WeeklyCalorieChart data={reports.chartData} goal={calorieGoal} />
        </div>
      </section>

      {/* Macros Evolution */}
      <section className="space-y-4">
        <h3 className="text-xl font-headline font-bold text-white">Macronutrientes</h3>
        <div className="grid grid-cols-3 gap-3">
          <MacroSparkline 
            name="Proteína" 
            average={reports.averages.protein} 
            change={reports.changes.protein} 
            color="#00FF88" 
            data={reports.chartData.map(d => ({ value: d.macros.protein }))} 
            delay={0.1}
          />
          <MacroSparkline 
            name="Carbo" 
            average={reports.averages.carbs} 
            change={reports.changes.carbs} 
            color="#FFD166" 
            data={reports.chartData.map(d => ({ value: d.macros.carbs }))} 
            delay={0.2}
          />
          <MacroSparkline 
            name="Gordura" 
            average={reports.averages.fats} 
            change={reports.changes.fats} 
            color="#FF6B6B" 
            data={reports.chartData.map(d => ({ value: d.macros.fats }))} 
            delay={0.3}
          />
        </div>
      </section>

      {/* Streaks and Achievements */}
      <section className="space-y-4">
        <h3 className="text-xl font-headline font-bold text-white">Conquistas</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface-container-low rounded-xl p-4 text-center border border-white/5">
            <span className="text-2xl mb-1 block">🔥</span>
            <span className="text-xl font-black text-white">{reports.streaks.logged}</span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mt-1">Dias Seguidos</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center border border-white/5">
            <span className="text-2xl mb-1 block">🎯</span>
            <span className="text-xl font-black text-white">{reports.streaks.goal}</span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mt-1">Na Meta</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center border border-white/5">
            <span className="text-2xl mb-1 block">🥗</span>
            <span className="text-xl font-black text-white">{reports.streaks.balanced}</span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mt-1">Equilíbrio</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AchievementBadge 
            id="first_ai" 
            title="Primeira Dieta IA" 
            description="Você gerou sua primeira dieta com Inteligência Artificial." 
            icon="auto_awesome" 
            isUnlocked={dietHistory.length > 0} 
            delay={0.1} 
          />
          <AchievementBadge 
            id="perfect_week" 
            title="Semana Perfeita" 
            description="Registrou suas refeições por 7 dias consecutivos." 
            icon="calendar_month" 
            isUnlocked={reports.streaks.logged >= 7} 
            delay={0.2} 
          />
          <AchievementBadge 
            id="goal_met" 
            title="Meta Batida" 
            description="Atingiu sua meta calórica por 5 dias seguidamente." 
            icon="workspace_premium" 
            isUnlocked={reports.streaks.goal >= 5} 
            delay={0.3} 
          />
          <AchievementBadge 
            id="consistent" 
            title="Consistente" 
            description="Manteve o foco por 30 dias contínuos." 
            icon="local_fire_department" 
            isUnlocked={reports.streaks.logged >= 30} 
            delay={0.4} 
          />
        </div>
      </section>

      {/* AI Diet History */}
      {dietHistory.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-headline font-bold text-white">Histórico de Dietas IA</h3>
          <div className="flex flex-col gap-3">
            {dietHistory.map((diet, idx) => (
              <DietHistoryCard 
                key={idx} 
                diet={diet} 
                isActive={activeDiet?.meals[0]?.id === diet.meals[0]?.id && activeDiet?.totalCalories === diet.totalCalories} 
                onReactivate={reactivateDiet} 
                index={idx} 
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
