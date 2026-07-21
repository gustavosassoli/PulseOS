import { AsyncStorage } from '../utils/AsyncStorage';
import { DietDayProgress } from '../types/diet';

const getTodayFormat = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export class DietResetService {
  async checkAndResetIfNeeded(): Promise<void> {
    try {
      const today = getTodayFormat();
      const savedProgress = await AsyncStorage.getItem('diet_progress_current');

      if (!savedProgress) {
        await this.createFreshDayProgress(today);
        return;
      }

      const progress: DietDayProgress = JSON.parse(savedProgress);

      if (progress.date !== today) {
        await this.archivePreviousDay(progress);
        await this.createFreshDayProgress(today);
      }
    } catch (e) {
      console.error('Error in DietResetService:', e);
      // Fallback: create fresh if corrupted
      await this.createFreshDayProgress(getTodayFormat());
    }
  }

  private async archivePreviousDay(progress: DietDayProgress): Promise<void> {
    await AsyncStorage.setItem(
      `diet_history_${progress.date}`,
      JSON.stringify(progress)
    );
    await AsyncStorage.removeItem('diet_progress_current');
    await this.purgeOldHistory();
  }

  private async purgeOldHistory(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const historyKeys = keys.filter(k => k.startsWith('diet_history_'));
    
    const now = new Date();
    // Keep last 90 days
    const maxAgeMs = 90 * 24 * 60 * 60 * 1000;

    for (const key of historyKeys) {
      const dateStr = key.replace('diet_history_', '');
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        if (now.getTime() - d.getTime() > maxAgeMs) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  }

  private async createFreshDayProgress(date: string): Promise<void> {
    const freshProgress: DietDayProgress = {
      date,
      refeicoesConcluidas: [],
      caloriasConsumidas: 0,
      macrosConsumidos: { proteina: 0, carboidrato: 0, gordura: 0 },
      extrasDoDia: [],
    };
    await AsyncStorage.setItem(
      'diet_progress_current',
      JSON.stringify(freshProgress)
    );
  }
}

export const dietResetService = new DietResetService();
