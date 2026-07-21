import { WorkoutXExercise } from '../services/workoutXService';

export function cacheExercises(query: string, results: WorkoutXExercise[]): void {
  try {
    const key = `workoutx_${query.toLowerCase().trim()}`;
    const cacheObj = {
      timestamp: Date.now(),
      data: results,
      expiresIn: 3600000 // 1 hour
    };
    sessionStorage.setItem(key, JSON.stringify(cacheObj));

    cleanOldEntries();
  } catch (err) {
    console.error("Error caching exercises:", err);
  }
}

export function getCachedExercises(query: string): WorkoutXExercise[] | null {
  try {
    const key = `workoutx_${query.toLowerCase().trim()}`;
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > parsed.expiresIn) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error("Error retrieving cached exercises:", err);
    return null;
  }
}

export function clearExpiredCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('workoutx_')) {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp > parsed.expiresIn) {
                    keysToRemove.push(key);
                }
            }
        }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.error("Error clearing expired cache:", err);
  }
}

function cleanOldEntries() {
  const cacheKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('workoutx_')) {
      cacheKeys.push(key);
    }
  }

  if (cacheKeys.length > 50) {
    // Sort by timestamp
    const entries = cacheKeys.map(k => {
      const item = sessionStorage.getItem(k);
      return {
        key: k,
        timestamp: item ? JSON.parse(item).timestamp : 0
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest until we have 50
    const toRemove = entries.length - 50;
    for (let i = 0; i < toRemove; i++) {
      sessionStorage.removeItem(entries[i].key);
    }
  }
}
