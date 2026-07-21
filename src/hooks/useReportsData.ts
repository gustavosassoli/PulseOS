import { useState, useEffect, useMemo } from 'react';
import { DietHistoryData, getPastDates, calculateAverage, getConsistencyCount, calculatePercentageChange, calculateStreak } from '../services/reportsUtils';
import { useDietAIStore } from '../stores/useDietAIStore';
import { GeneratedDiet } from '../services/DietAIService';

// Mock Data as fallback
const mockHistoryData: DietHistoryData = {
  "2025-05-04": { "total": 1920, "meals": 4, "macros": { "protein": 145, "carbs": 210, "fats": 68 }},
  "2025-05-05": { "total": 2100, "meals": 5, "macros": { "protein": 160, "carbs": 230, "fats": 72 }},
  "2025-05-06": { "total": 1750, "meals": 3, "macros": { "protein": 130, "carbs": 190, "fats": 61 }},
  "2025-05-07": { "total": 0,    "meals": 0, "macros": { "protein": 0,   "carbs": 0,   "fats": 0  }},
  "2025-05-08": { "total": 2050, "meals": 4, "macros": { "protein": 155, "carbs": 220, "fats": 70 }},
  "2025-05-09": { "total": 1840, "meals": 4, "macros": { "protein": 142, "carbs": 110, "fats": 52 }},
  "2025-05-10": { "total": 1680, "meals": 3, "macros": { "protein": 138, "carbs": 180, "fats": 58 }}
};

export function useReportsData(periodDays: number = 7) {
  const [data, setData] = useState<DietHistoryData>({});
  const [isLoading, setIsLoading] = useState(true);

  const { profile, history, activeDiet, setActiveDiet } = useDietAIStore();
  const calorieGoal = profile.calorieGoal || 2000;

  useEffect(() => {
    // Simulate AsyncStorage load with delay
    const loadData = async () => {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem('diet_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Object.keys(parsed).length > 2) {
             setData(parsed);
          } else {
             setData(mockHistoryData);
          }
        } else {
          setData(mockHistoryData);
        }
      } catch (e) {
        console.error('Error loading diet history', e);
        setData(mockHistoryData);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add small delay to show loading state (as requested)
    setTimeout(loadData, 600);
  }, []);

  const reports = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Dates for current period
    const currentDates = getPastDates(periodDays);
    // Dates for previous period (for comparison)
    const previousDates = getPastDates(periodDays * 2).filter(d => !currentDates.includes(d));

    // Averages
    const currentAvgTotal = calculateAverage(data, currentDates, 'total');
    const prevAvgTotal = calculateAverage(data, previousDates, 'total');
    
    const currentAvgProtein = calculateAverage(data, currentDates, 'protein');
    const prevAvgProtein = calculateAverage(data, previousDates, 'protein');
    
    const currentAvgCarbs = calculateAverage(data, currentDates, 'carbs');
    const prevAvgCarbs = calculateAverage(data, previousDates, 'carbs');
    
    const currentAvgFats = calculateAverage(data, currentDates, 'fats');
    const prevAvgFats = calculateAverage(data, previousDates, 'fats');

    // Changes
    const totalChange = calculatePercentageChange(currentAvgTotal, prevAvgTotal);
    const proteinChange = calculatePercentageChange(currentAvgProtein, prevAvgProtein);
    const carbsChange = calculatePercentageChange(currentAvgCarbs, prevAvgCarbs);
    const fatsChange = calculatePercentageChange(currentAvgFats, prevAvgFats);

    const consistencyCount = getConsistencyCount(data, currentDates);

    // Streaks
    const loggedStreak = calculateStreak(data, todayStr, 'logged');
    const goalStreak = calculateStreak(data, todayStr, 'goal', calorieGoal);
    const balancedStreak = calculateStreak(data, todayStr, 'balanced');

    // Chart Data
    const chartData = currentDates.map(date => {
      const d = new Date(date);
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      return {
        date,
        dayName,
        total: data[date]?.total || 0,
        macros: data[date]?.macros || { protein: 0, carbs: 0, fats: 0 },
        meals: data[date]?.meals || 0
      };
    });

    return {
      currentDates,
      chartData,
      averages: {
        total: currentAvgTotal,
        protein: currentAvgProtein,
        carbs: currentAvgCarbs,
        fats: currentAvgFats,
      },
      changes: {
        total: totalChange,
        protein: proteinChange,
        carbs: carbsChange,
        fats: fatsChange,
      },
      consistencyCount,
      streaks: {
        logged: loggedStreak,
        goal: goalStreak,
        balanced: balancedStreak
      },
      hasSufficientData: Object.keys(data).length >= 2
    };
  }, [data, periodDays, calorieGoal]);

  return {
    isLoading,
    reports,
    calorieGoal,
    dietHistory: history,
    activeDiet,
    reactivateDiet: setActiveDiet
  };
}
