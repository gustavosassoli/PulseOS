import { cacheExercises, getCachedExercises } from '../utils/exerciseCache';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const API_KEY = (import.meta as any).env.VITE_WORKOUTX_API_KEY;
const BASE_URL = 'https://workoutxapp.com/api';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export interface WorkoutXExercise {
  id: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: string;
  category: string;
  calorieEstimate: number;
}

export async function checkAndIncrementUsage() {
  if (!auth.currentUser) return false;
  const userId = auth.currentUser.uid;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const usage = data.workoutXUsage || { count: 0, month: currentMonth };
      
      if (usage.month !== currentMonth) {
        usage.month = currentMonth;
        usage.count = 0;
      }
      
      if (usage.count >= 500) {
        alert("Limite mensal de buscas atingido.");
        return false;
      }
      
      await updateDoc(userRef, {
        workoutXUsage: {
          count: usage.count + 1,
          month: currentMonth
        }
      });
      return true;
    }
  } catch (error) {
    console.error("Error tracking API usage", error);
  }
  return true; // proceed if error fetching
}

async function fetchFromApi(endpoint: string): Promise<any> {
  const canProceed = await checkAndIncrementUsage();
  if (!canProceed) throw new Error('Rate limit');

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
    if (response.status === 401) {
      alert("Chave de API inválida. Verifique o .env");
      return null;
    }
    if (response.status === 429) {
      alert("Limite mensal de buscas atingido.");
      return null;
    }
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if ((error as Error).message !== 'Rate limit') {
      console.error("Network error accessing WorkoutX API", error);
    }
    return null;
  }
}

export async function searchExercisesByName(name: string): Promise<WorkoutXExercise[]> {
  if (!name || name.length < 3) return [];
  const cached = getCachedExercises(name);
  if (cached) return cached;

  const data = await fetchFromApi(`/exercises?name=${encodeURIComponent(name)}`);
  if (data && Array.isArray(data)) {
    cacheExercises(name, data);
    return data;
  }
  return [];
}

export async function getExercisesByMuscle(muscle: string): Promise<WorkoutXExercise[]> {
  const cached = getCachedExercises(`muscle_${muscle}`);
  if (cached) return cached;

  const data = await fetchFromApi(`/exercises?muscle=${encodeURIComponent(muscle)}`);
  if (data && Array.isArray(data)) {
    cacheExercises(`muscle_${muscle}`, data);
    return data;
  }
  return [];
}

export async function getExercisesByBodyPart(bodyPart: string): Promise<WorkoutXExercise[]> {
  const cached = getCachedExercises(`bodyPart_${bodyPart}`);
  if (cached) return cached;

  const data = await fetchFromApi(`/exercises?bodyPart=${encodeURIComponent(bodyPart)}`);
  if (data && Array.isArray(data)) {
    cacheExercises(`bodyPart_${bodyPart}`, data);
    return data;
  }
  return [];
}

export async function getExerciseById(id: string): Promise<WorkoutXExercise | null> {
  const cached = getCachedExercises(`id_${id}`);
  if (cached && cached.length > 0) return cached[0];

  const data = await fetchFromApi(`/exercises/${encodeURIComponent(id)}`);
  if (data && !Array.isArray(data)) {
    cacheExercises(`id_${id}`, [data]);
    return data;
  }
  return null;
}
