import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format, subDays } from 'date-fns';
import { DailyCheckin, UserProfile } from '../types';
import { recalculateAndSave } from './lifeScoreService';

export interface CheckinData {
  energyLevel: number;
  sleepHours: number;
  sleepQuality: number;
  intention: string;
}

export function calcularPontosCheckin(dados: CheckinData): number {
  let pontos = 0;

  // Completou o checkin → +5 pontos base
  pontos += 5;

  // Qualidade do sono >= 3 → +3 pontos
  if (dados.sleepQuality >= 3) pontos += 3;

  // Dormiu >= 7 horas → +2 pontos
  if (dados.sleepHours >= 7) pontos += 2;

  // Preencheu intenção → +0 pontos (só benefício pessoal)

  return Math.min(10, pontos); // máximo 10 pontos
}

export async function submitMorningCheckin(userId: string, dados: CheckinData, isSkipped: boolean, userProfile: UserProfile): Promise<{ pointsEarned: number, newStreak: number }> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const checkinRef = doc(db, `users/${userId}/checkins/${today}`);
    
    // Check if checkin already exists to avoid duplicates
    const checkinSnap = await getDoc(checkinRef);
    if (checkinSnap.exists()) {
      return { pointsEarned: 0, newStreak: userProfile.currentStreak || 0 };
    }

    if (isSkipped) {
      await setDoc(checkinRef, {
        date: today,
        completedAt: serverTimestamp(),
        skipped: true,
        energyLevel: 0,
        mood: 0,
        sleepHours: 0,
        sleepQuality: 0,
        intention: '',
        wellbeingPoints: 0
      });
      return { pointsEarned: 0, newStreak: userProfile.currentStreak || 0 };
    }

    const pointsEarned = calcularPontosCheckin(dados);

    await setDoc(checkinRef, {
      date: today,
      completedAt: serverTimestamp(),
      skipped: false,
      energyLevel: dados.energyLevel,
      mood: dados.energyLevel, // usar energia como humor base
      sleepHours: dados.sleepHours,
      sleepQuality: dados.sleepQuality,
      intention: dados.intention || '',
      wellbeingPoints: pointsEarned,
    });

    const userRef = doc(db, `users/${userId}`);
    await updateDoc(userRef, {
      lastCheckinDate: today
    });

    // Replace manual calculation with updateStreak
    const newStreak = await import('./streakService').then(m => m.updateStreak(userId, userProfile, 'checkin'));

    // Recalculate LifeScore
    await recalculateAndSave(userId);

    return { pointsEarned, newStreak };
  } catch (error) {
    console.error("Error submitting morning checkin:", error);
    throw error;
  }
}
