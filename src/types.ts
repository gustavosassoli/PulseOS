export type Tab = 'life' | 'agenda' | 'health' | 'finances' | 'diet' | 'workout';

export interface Pillar {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  goalLabel: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  time: string; // "HH:mm"
  category: 'Trabalho' | 'Saúde' | 'Pessoal';
  icon: string;
  recurrence: {
    type: 'daily' | 'weekly' | 'weekdays' | 'weekends';
    days?: number[]; // [0-6] 0=dom, 1=seg, etc
  };
  active: boolean;
  createdAt: any;
  updatedAt: any;
  lastGeneratedDate: string;
  priority?: 'urgent' | 'important' | 'normal';
}

export interface AgendaItem {
  id: string;
  title: string;
  category: 'Trabalho' | 'Saúde' | 'Pessoal';
  categoryColor: string;
  time: string;
  date?: string; // ISO date YYYY-MM-DD
  duration: string;
  location: string;
  completed: boolean;
  icon: string;
  fromTemplate?: boolean;
  templateId?: string | null;
  priority?: 'urgent' | 'important' | 'normal';
}

export interface Transaction {
  id: string;
  name: string;
  category: string;
  time: string;
  date?: string; // ISO date YYYY-MM-DD
  amount: number;
  type: 'debit' | 'credit';
  icon: string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche';
  time: string;
  date?: string; // ISO date YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight?: number;
  unit?: 'g' | 'ml' | 'unidade';
  image: string;
  completed?: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  completed: boolean;
  muscles?: string;
  gifUrl?: string;
  caloriesBurned?: number;
  executionTip?: string;
}

export interface WorkoutDay {
  day: string; // 'Segunda', 'Terça', etc.
  title: string; // e.g., 'Treino de Braço'
  exercises: WorkoutExercise[];
  totalEstimatedCalories?: number;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date
  dayName: string;
  title: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  caloriesBurned?: number;
}

export interface WeightHistory {
  date: string; // ISO date
  weight: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'workout' | 'diet' | 'consistency' | 'finance';
}

export interface ScoreBreakdown {
  agenda: { pontos: number; maximo: 30 };
  treino: { pontos: number; maximo: 20 };
  dieta: { pontos: number; maximo: 20 };
  habitos: { pontos: number; maximo: 15 };
  bemEstar: { pontos: number; maximo: 10 };
  financas: { pontos: number; maximo: 5 };
}

export interface ScoreHistory {
  date: string;
  total: number;
  breakdown: ScoreBreakdown;
  archivedAt: any; // or Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  height?: string;
  age?: string;
  calorieGoal?: string;
  targetWeight?: string;
  currentWeight?: string;
  weightHistory?: WeightHistory[];
  trainingFocus?: 'lose' | 'gain';
  gender?: 'male' | 'female';
  notifications?: boolean;
  darkMode?: boolean;
  workoutPlan?: WorkoutDay[];
  badges?: Badge[];
  monthlyBudget?: string;
  lifeScore?: number;
  scoreDate?: string;
  scoreBreakdown?: ScoreBreakdown;
  scoreUpdatedAt?: any; // or Timestamp
  habits?: any[]; // added if needed for habits tracking in profile
  moodToday?: string; // or wellbeing
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: any;
  mainGoal?: 'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced';
  wakeUpTime?: string;
  sleepTime?: string;
  mealsPerDay?: number;
  workoutsPerWeek?: number;
  dailyCalorieGoal?: number;
  lastCheckinDate?: string;
  currentStreak?: number;
  longestStreak?: number;
  streaks?: UserStreaks;
}

export type PillarType = 'treino' | 'dieta' | 'habitos' | 'agenda' | 'financas' | 'checkin';

export interface PillarStreak {
  current: number;
  longest: number;
  lastCompletedDate: string;
  restDays?: string[]; // e.g., ["sunday", "saturday"]
}

export interface UserStreaks {
  treino: PillarStreak;
  dieta: PillarStreak;
  habitos: PillarStreak;
  agenda: PillarStreak;
  financas: PillarStreak;
  checkin: PillarStreak;
}

export interface DailyCheckin {
  date: string;
  completedAt: any;
  skipped: boolean;
  energyLevel: number;
  mood: number;
  sleepHours: number;
  sleepQuality: number;
  intention: string;
  wellbeingPoints: number;
}
