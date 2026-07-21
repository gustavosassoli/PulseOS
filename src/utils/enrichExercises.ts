import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { searchExercisesByName } from '../services/workoutXService';

export async function enrichMissingGifUrls(userId: string): Promise<{ updated: number; failed: number; skipped: number }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return { updated: 0, failed: 0, skipped: 0 };

    const data = userDoc.data();
    if (!data.workoutPlan || !Array.isArray(data.workoutPlan)) {
      return { updated: 0, failed: 0, skipped: 0 };
    }

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let needsUpdate = false;
    const newPlan = [...data.workoutPlan];

    for (let i = 0; i < newPlan.length; i++) {
        const p = newPlan[i];
      if (p && Array.isArray(p.exercises)) {
        for (let j = 0; j < p.exercises.length; j++) {
          const ex = p.exercises[j];
          if (!ex.gifUrl) {
            // Need to fetch
            const results = await searchExercisesByName(ex.name);
            if (results && results.length > 0) {
              const bestMatch = results[0];
              newPlan[i].exercises[j] = {
                ...ex,
                gifUrl: bestMatch.gifUrl,
                muscles: bestMatch.target || ex.muscles,
                caloriesBurned: bestMatch.calorieEstimate ? parseInt(String(bestMatch.calorieEstimate), 10) : ex.caloriesBurned
              };
              updatedCount++;
              needsUpdate = true;
            } else {
              failedCount++;
            }
            // Delay 200ms
            await new Promise(r => setTimeout(r, 200));
          } else {
              skippedCount++;
          }
        }
      }
    }

    if (needsUpdate) {
      await updateDoc(userRef, {
        workoutPlan: newPlan
      });
    }

    return { updated: updatedCount, failed: failedCount, skipped: skippedCount };
  } catch (error) {
    console.error("Error enriching exercises:", error);
    return { updated: 0, failed: 1, skipped: 0 };
  }
}
