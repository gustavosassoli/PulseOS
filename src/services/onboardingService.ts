import { 
  doc, 
  updateDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { createRecurringTemplate, generateTodayInstances } from './recurringService';

export interface OnboardingData {
  name: string;
  mainGoal: 'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced';
  wakeUpTime: string;
  sleepTime: string;
  mealsPerDay: number;
  workoutsPerWeek: number;
  dailyCalorieGoal: number;
  currentWeight: number | null;
  height: number | null;
}

// Helper to adjust time in string formatted "HH:MM"
function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hStr = h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

function adjustTime(timeStr: string, minutesToAdjust: number): string {
  try {
    let mins = parseTime(timeStr) + minutesToAdjust;
    if (mins < 0) mins += 1440;
    mins = mins % 1440;
    return formatTime(mins);
  } catch (e) {
    return timeStr;
  }
}

export async function finishOnboarding(userId: string, data: OnboardingData) {
  const userRef = doc(db, 'users', userId);

  try {
    // 1. Update User Profile
    await updateDoc(userRef, {
      displayName: data.name,
      mainGoal: data.mainGoal,
      wakeUpTime: data.wakeUpTime,
      sleepTime: data.sleepTime,
      mealsPerDay: data.mealsPerDay,
      workoutsPerWeek: data.workoutsPerWeek,
      calorieGoal: String(data.dailyCalorieGoal),
      currentWeight: data.currentWeight ? String(data.currentWeight) : "",
      height: data.height ? String(data.height) : "",
      onboardingCompleted: true,
      onboardingCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const today = new Date().toISOString().split('T')[0];

    // 2. Generate habits
    const baseHabits = [
      { name: 'Beber 2L de água', icon: 'droplet', category: 'saude', frequency: 'daily', completedDates: [] },
      { name: 'Dormir 7-8 horas', icon: 'moon', category: 'bemetar', frequency: 'daily', completedDates: [] },
      { name: 'Ler 20 minutos', icon: 'book', category: 'desenvolvimento', frequency: 'daily', completedDates: [] },
    ];

    let extraHabits: any[] = [];
    if (data.mainGoal === 'productivity') {
      extraHabits = [
        { name: 'Revisar tarefas do dia', icon: 'check-square', category: 'trabalho', frequency: 'daily', completedDates: [] },
        { name: 'Bloco de foco de 90min', icon: 'timer', category: 'trabalho', frequency: 'daily', completedDates: [] }
      ];
    } else if (data.mainGoal === 'muscle' || data.mainGoal === 'weightLoss') {
      extraHabits = [
        { name: 'Registrar refeições', icon: 'soup', category: 'dieta', frequency: 'daily', completedDates: [] },
        { name: 'Proteína no café da manhã', icon: 'egg', category: 'dieta', frequency: 'daily', completedDates: [] }
      ];
    } else if (data.mainGoal === 'wellness') {
      extraHabits = [
        { name: 'Meditação 10 minutos', icon: 'heart', category: 'bemestar', frequency: 'daily', completedDates: [] },
        { name: 'Diário de gratidão', icon: 'pen-tool', category: 'bemestar', frequency: 'daily', completedDates: [] }
      ];
    } else if (data.mainGoal === 'finance') {
      extraHabits = [
        { name: 'Registrar gastos do dia', icon: 'wallet', category: 'financas', frequency: 'daily', completedDates: [] },
        { name: 'Revisar orçamento semanal', icon: 'trending-up', category: 'financas', frequency: 'weekly', completedDates: [] }
      ];
    } else if (data.mainGoal === 'balanced') {
      extraHabits = [
        { name: 'Registrar gastos do dia', icon: 'wallet', category: 'financas', frequency: 'daily', completedDates: [] },
        { name: 'Meditação 10 minutos', icon: 'heart', category: 'bemestar', frequency: 'daily', completedDates: [] }
      ];
    }

    const allHabits = [...baseHabits, ...extraHabits];
    const habitsPath = `users/${userId}/habits`;
    for (const habit of allHabits) {
      await addDoc(collection(db, habitsPath), {
        ...habit,
        uid: userId,
        createdAt: serverTimestamp()
      });
    }

    // 3. Create initial recurring templates
    const wake = data.wakeUpTime || "06:30";
    const sleep = data.sleepTime || "23:00";

    const getWorkoutDays = (perWeek: number) => {
      if (perWeek <= 1) return [1];
      if (perWeek === 2) return [1, 4];
      if (perWeek === 3) return [1, 3, 5];
      if (perWeek === 4) return [1, 2, 4, 5];
      if (perWeek === 5) return [1, 2, 3, 4, 5];
      return [1, 2, 3, 4, 5, 6];
    };

    const templates = [
      {
        title: 'Café da manhã',
        time: adjustTime(wake, 30),
        category: 'Pessoal' as const,
        icon: 'soup_kitchen',
        recurrence: { type: 'daily' as const }
      },
      {
        title: 'Treino',
        time: adjustTime(wake, 90),
        category: 'Saúde' as const,
        icon: 'fitness_center',
        recurrence: { type: 'weekly' as const, days: getWorkoutDays(data.workoutsPerWeek || 3) }
      },
      {
        title: 'Almoço',
        time: '12:30',
        category: 'Pessoal' as const,
        icon: 'restaurant',
        recurrence: { type: 'weekdays' as const }
      },
      {
        title: 'Jantar',
        time: adjustTime(sleep, -120),
        category: 'Pessoal' as const,
        icon: 'restaurant',
        recurrence: { type: 'daily' as const }
      },
      {
        title: 'Registrar o dia no PulseOS',
        time: adjustTime(sleep, -30),
        category: 'Pessoal' as const,
        icon: 'monitoring',
        recurrence: { type: 'daily' as const }
      }
    ];

    for (const template of templates) {
      await createRecurringTemplate(userId, { ...template, active: true });
    }
    await generateTodayInstances(userId);

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/onboarding`);
  }
}
