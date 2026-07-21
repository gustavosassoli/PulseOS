import { doc, getDoc, collection, getDocs, writeBatch, serverTimestamp, query, where, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { calculateLifeScore } from '../utils/calculateLifeScore';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';

const DEBOUNCE_DELAY = 300;
let recalculateTimeout: ReturnType<typeof setTimeout> | null = null;
let isRecalculating = false;

export async function recalculateAndSaveImmediate(userId: string): Promise<number | null> {
  if (isRecalculating) return null;
  isRecalculating = true;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch Agenda
    const agendaSnap = await getDocs(query(collection(db, `users/${userId}/agenda`), where('date', '==', today)));
    const agendaTotal = agendaSnap.size;
    const agendaConcluidas = agendaSnap.docs.filter(d => d.data().completed).length;

    // 2. Fetch Workout
    const workoutSnap = await getDocs(query(collection(db, `users/${userId}/workoutSessions`), where('date', '==', today), where('completed', '==', true)));
    const treinouHoje = !workoutSnap.empty;

    // 3. Fetch Diet (Meals)
    const mealsSnap = await getDocs(query(collection(db, `users/${userId}/meals`), where('date', '==', today)));
    const refeicoesHoje = mealsSnap.size;

    // 4. Fetch Habits
    console.log("Fetching Habits...");
    let habitosTotal = 0;
    let habitosConcluidos = 0;
    try {
      const habitsSnap = await getDocs(query(collection(db, `users/${userId}/habits`)));
      if (!habitsSnap.empty) {
          // If subcollection exists
          const habitsList = habitsSnap.docs.map(d => d.data());
          habitosTotal = habitsList.length;
          habitosConcluidos = habitsList.filter(h => h.completedDates && h.completedDates.includes(today)).length;
      } else {
          // Fallback to UserProfile.habits
          const userDoc = await getDocFromServer(doc(db, 'users', userId));
          const userData = userDoc.data() || {};
          if (userData.habits && Array.isArray(userData.habits)) {
              habitosTotal = userData.habits.length;
              habitosConcluidos = userData.habits.filter(h => h.completedDates && h.completedDates.includes(today)).length;
          }
      }
    } catch (e) {
      console.error("Error fetching habits: ", e);
    }

    // 5. Fetch Wellbeing (moodToday/reflexao/lazer in user profile)
    const userDocRef = doc(db, 'users', userId);
    const userDocRes = await getDocFromServer(userDocRef);
    const uData = userDocRes.data() || {};
    
    // Evaluate wellbeing logic
    const registrouHumor = !!uData.moodToday && uData.moodDate === today;
    const registrouReflexao = !!uData.reflectionToday && uData.reflectionDate === today;
    const registrouLazer = !!uData.leisureToday && uData.leisureDate === today;
    
    let checkinWellbeingPoints = 0;
    try {
      const checkinRef = doc(db, `users/${userId}/checkins/${today}`);
      const checkinSnap = await getDocFromServer(checkinRef);
      if (checkinSnap.exists()) {
        const checkinData = checkinSnap.data();
        checkinWellbeingPoints = checkinData.wellbeingPoints || 0;
      }
    } catch (e) {
      console.error("Error fetching checkin wellBeing:", e);
    }

    // 6. Fetch Finances
    // Check if there is any transaction created today
    const transactionsSnap = await getDocs(query(collection(db, `users/${userId}/transactions`), where('date', '==', today)));
    const registrouFinancas = !transactionsSnap.empty;

    // Calculate
    const result = calculateLifeScore({
      agenda: { total: agendaTotal, concluidas: agendaConcluidas },
      treino: { treinouHoje },
      dieta: { refeicoesHoje },
      habitos: { total: habitosTotal, concluidos: habitosConcluidos },
      bemEstar: { registrouHumor, registrouReflexao, registrouLazer, checkinPoints: checkinWellbeingPoints },
      financas: { registrouHoje: registrouFinancas }
    });

    // Save to Firestore using Batch
    const batch = writeBatch(db);
    batch.update(userDocRef, {
      lifeScore: result.total,
      scoreBreakdown: result.breakdown,
      scoreUpdatedAt: serverTimestamp(),
      scoreDate: today
    });
    
    await batch.commit();

    // Update global store for UI reactivity without waiting for onSnapshot
    useLifeScoreStore.getState().setScore(result.total, result.breakdown, result.total - (uData.lifeScore || 0));

    return result.total;
  } catch (error) {
    console.error("Error recalculating life score:", error);
    return null;
  } finally {
    isRecalculating = false;
  }
}

export function recalculateAndSave(userId: string): Promise<void> {
  return new Promise((resolve) => {
    if (recalculateTimeout) {
      clearTimeout(recalculateTimeout);
    }
    recalculateTimeout = setTimeout(async () => {
      await recalculateAndSaveImmediate(userId);
      resolve();
    }, DEBOUNCE_DELAY);
  });
}

export async function checkAndResetDailyScore(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocFromServer(userRef);
    
    if (!userDoc.exists()) return;
    const data = userDoc.data();
    
    if (data.scoreDate && data.scoreDate !== today) {
        // Archive
        const batch = writeBatch(db);
        const historyRef = doc(db, `users/${userId}/scoreHistory`, data.scoreDate);
        batch.set(historyRef, {
            date: data.scoreDate,
            total: data.lifeScore || 0,
            breakdown: data.scoreBreakdown || null,
            archivedAt: serverTimestamp()
        });
        
        batch.update(userRef, {
            lifeScore: 0,
            scoreDate: today,
            scoreUpdatedAt: serverTimestamp(),
            scoreBreakdown: null // Reset breakdown or leave empty base
        });
        
        await batch.commit();
        useLifeScoreStore.getState().setScore(0, null, 0);

        // Delete old history > 90 days (Client side deletion logic to keep it simple, though functions are better)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const limitDateStr = ninetyDaysAgo.toISOString().split('T')[0];
        try {
            const oldHistorySnap = await getDocs(query(collection(db, `users/${userId}/scoreHistory`), where('date', '<', limitDateStr)));
            if (!oldHistorySnap.empty) {
                const delBatch = writeBatch(db);
                oldHistorySnap.forEach(snap => delBatch.delete(snap.ref));
                await delBatch.commit();
            }
        } catch (e) {
            console.error("Error deleting old score history: ", e);
        }
    }
  } catch (err) {
    console.error("Failed to check and reset daily score", err);
  }
}
