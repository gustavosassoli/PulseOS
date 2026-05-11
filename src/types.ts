export type Tab = 'life' | 'agenda' | 'health' | 'finances' | 'settings' | 'diet' | 'workout';

export interface Pillar {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  goalLabel: string;
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
}
