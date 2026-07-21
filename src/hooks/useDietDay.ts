import { useMemo } from 'react';
import { useDietStore } from '../stores/useDietStore';

export const useDietDay = () => {
  const { dietBase, dayProgress, toggleMealCompletion, removeExtraItem } = useDietStore();

  const dayMeals = useMemo(() => {
    if (!dietBase && !dayProgress) return [];

    const baseMeals = dietBase?.refeicoes.map(meal => ({
      ...meal,
      isExtra: false,
      isCompleted: dayProgress?.refeicoesConcluidas.includes(meal.id) || false
    })) || [];

    const extraMeals = dayProgress?.extrasDoDia.map(extra => ({
      ...extra,
      isExtra: true,
      isCompleted: true // Extra meals are implicitly completed
    })) || [];

    // Combine and sort by time
    const all = [...baseMeals, ...extraMeals];
    all.sort((a, b) => {
      if (!a.horario) return 1;
      if (!b.horario) return -1;
      return a.horario.localeCompare(b.horario);
    });

    return all;
  }, [dietBase, dayProgress]);

  const stats = useMemo(() => {
    const goal = dietBase?.profile?.metaCalorica || 2000;
    const consumed = dayProgress?.caloriasConsumidas || 0;
    const remaining = Math.max(0, goal - consumed);
    const progress = Math.min((consumed / goal) * 100, 100);

    return {
      goal,
      consumed,
      remaining,
      progress
    };
  }, [dietBase, dayProgress]);

  const activeSince = dietBase?.createdAt 
    ? new Date(dietBase.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) 
    : null;

  return {
    dayMeals,
    stats,
    activeSince,
    hasExtras: dayProgress && dayProgress.extrasDoDia.length > 0
  };
};
