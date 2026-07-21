import { doc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format, subDays, getDay } from 'date-fns';
import { PillarType, UserProfile, UserStreaks } from '../types';

let debounceTimeout: Record<string, NodeJS.Timeout> = {};

export async function checkPillarStreak(userId: string, pillar: PillarType, date: string): Promise<boolean> {
  try {
    switch (pillar) {
      case 'treino': {
        const sessionsSnap = await getDocs(query(
          collection(db, `users/${userId}/workoutSessions`),
          where('date', '==', date),
          where('completed', '==', true)
        ));
        return !sessionsSnap.empty;
      }
      case 'dieta': {
        const mealsSnap = await getDocs(query(
          collection(db, `users/${userId}/meals`),
          where('date', '==', date)
        ));
        // Needs 3+ meals
        return mealsSnap.size >= 3;
      }
      case 'habitos': {
        const habitsSnap = await getDocs(collection(db, `users/${userId}/habits`));
        const total = habitsSnap.size;
        if (total === 0) return false;
        
        let completed = 0;
        habitsSnap.forEach(doc => {
          const data = doc.data();
          if (data.completedDates && data.completedDates.includes(date)) {
            completed++;
          }
        });
        return (completed / total) >= 0.5;
      }
      case 'agenda': {
        const itemsSnap = await getDocs(query(
          collection(db, `users/${userId}/agenda`),
          where('date', '==', date)
        ));
        const total = itemsSnap.size;
        if (total === 0) return false;
        let completed = 0;
        itemsSnap.forEach(doc => {
          if (doc.data().completed === true) completed++;
        });
        return (completed / total) >= 0.5;
      }
      case 'financas': {
        const transactionsSnap = await getDocs(query(
          collection(db, `users/${userId}/transactions`),
          where('date', '==', date)
        ));
        return !transactionsSnap.empty;
      }
      case 'checkin': {
        const checkinSnap = await getDoc(doc(db, `users/${userId}/checkins/${date}`));
        return checkinSnap.exists() && checkinSnap.data().skipped === false;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking pillar ${pillar} for date ${date}:`, error);
    return false;
  }
}

export async function updateStreak(userId: string, userProfile: UserProfile, pillar: PillarType): Promise<number> {
  const debounceKey = `${userId}_${pillar}`;
  
  return new Promise((resolve) => {
    if (debounceTimeout[debounceKey]) {
      clearTimeout(debounceTimeout[debounceKey]);
    }

    debounceTimeout[debounceKey] = setTimeout(async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        // Usar data local ou padronizada. Estamos usando strings geradas por format.
        const yesterdayDate = subDays(new Date(), 1);
        const yesterday = format(yesterdayDate, 'yyyy-MM-dd');

        // Migrate fallback
        const defaultStreak = { current: 0, longest: 0, lastCompletedDate: '' };
        const streaks: UserStreaks = userProfile.streaks || {
          treino: { ...defaultStreak },
          dieta: { ...defaultStreak },
          habitos: { ...defaultStreak },
          agenda: { ...defaultStreak },
          financas: { ...defaultStreak },
          checkin: { 
            current: userProfile.currentStreak || 0,
            longest: userProfile.longestStreak || 0,
            lastCompletedDate: userProfile.lastCheckinDate || ''
          }
        };

        const currentData = streaks[pillar] || { ...defaultStreak };
        
        let completedToday = await checkPillarStreak(userId, pillar, today);
        let completedYesterday = await checkPillarStreak(userId, pillar, yesterday);

        // Tratamento dia de descanso para treino
        let isRestDayToday = false;
        let isRestDayYesterday = false;
        
        if (pillar === 'treino') {
          const restDays = currentData.restDays || ['0']; // 0 is Sunday in date-fns getDay()
          
          if (restDays.includes(String(getDay(new Date())))) {
            isRestDayToday = true;
          }
          if (restDays.includes(String(getDay(yesterdayDate)))) {
            isRestDayYesterday = true;
          }
        }

        let newCurrent = currentData.current;

        if (completedToday) {
          if (currentData.lastCompletedDate === today) {
            // Already counted today do nothing
            newCurrent = currentData.current;
          } else if (currentData.lastCompletedDate === yesterday || isRestDayYesterday) {
            newCurrent = currentData.current + 1;
          } else {
            // Se o último dia não for nem ontem nem tiver sido rest day ontem, mas hj completou, começa a nova base
            newCurrent = 1; 
          }
        } else {
           if (!completedYesterday && !isRestDayYesterday && currentData.lastCompletedDate !== today && !isRestDayToday) {
              newCurrent = 0;
           } else if (isRestDayToday && currentData.lastCompletedDate === yesterday) {
              // Mantém streak se hj for rest day e ontem fez
              newCurrent = currentData.current;
           }
        }

        const newLongest = Math.max(newCurrent, currentData.longest || 0);

        await updateDoc(doc(db, 'users', userId), {
          [`streaks.${pillar}.current`]: newCurrent,
          [`streaks.${pillar}.longest`]: newLongest,
          [`streaks.${pillar}.lastCompletedDate`]: completedToday ? today : currentData.lastCompletedDate,
        });

        const milestones = [3, 7, 14, 30, 100];
        if (newCurrent > currentData.current && milestones.includes(newCurrent)) {
          import('../stores/useStreakStore').then(({ useStreakStore }) => {
            useStreakStore.getState().addMilestone(pillar, newCurrent);
          });
        }

        resolve(newCurrent);
      } catch (error) {
        console.error(`Error updating streak for ${pillar}:`, error);
        resolve(userProfile.streaks?.[pillar]?.current || 0);
      }
    }, 500);
  });
}

export async function updateAllStreaks(userId: string, userProfile: UserProfile): Promise<void> {
  const pillars: PillarType[] = ['treino', 'dieta', 'habitos', 'agenda', 'financas', 'checkin'];
  
  for (const pillar of pillars) {
    updateStreak(userId, userProfile, pillar);
  }
}
