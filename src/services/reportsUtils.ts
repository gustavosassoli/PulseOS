export interface DailyMacros {
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyDietLog {
  total: number;
  meals: number;
  macros: DailyMacros;
}

export interface DietHistoryData {
  [date: string]: DailyDietLog;
}

export function calculateAverage(data: DietHistoryData, dates: string[], key: 'total' | 'protein' | 'carbs' | 'fats'): number {
  const validDays = dates.filter(date => data[date] && data[date].total > 0);
  if (validDays.length === 0) return 0;

  const sum = validDays.reduce((acc, date) => {
    if (key === 'total') return acc + data[date].total;
    return acc + data[date].macros[key];
  }, 0);
  
  return Math.round(sum / validDays.length);
}

export function getConsistencyCount(data: DietHistoryData, dates: string[]): number {
  return dates.filter(date => data[date] && data[date].total > 0).length;
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0; // Avoid division by zero
  const change = ((current - previous) / previous) * 100;
  return Math.round(change);
}

export function getPastDates(days: number): string[] {
  const dates = [];
  const today = new Date();
  
  // Use today as the last date, going backwards
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function calculateStreak(data: DietHistoryData, today: string, type: 'logged' | 'goal' | 'balanced', goal: number = 2000): number {
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const log = data[dateStr];

    if (!log || log.total === 0) {
      // Allow missing today if early in the day, but normally breaks streak
      if (streak === 0 && dateStr === today) {
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }

    if (type === 'logged') {
      streak++;
    } else if (type === 'goal') {
      // Goal is considered met if within 10% of the goal or below? Let's say +/- 200 kcal is "hitting goal", or just strictly below goal depending on objective. For simplicity, say > 0 and <= goal + 100
      if (log.total <= goal + 150 && log.total >= goal - 400) streak++;
      else break;
    } else if (type === 'balanced') {
      // Simple heuristic: > 80g protein, etc.
      if (log.macros.protein >= 80) streak++;
      else break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}
