import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DietUserProfile, GeneratedDiet } from '../services/DietAIService';

interface DietAIState {
  profile: DietUserProfile;
  activeDiet: GeneratedDiet | null;
  history: GeneratedDiet[];
  setProfile: (profile: Partial<DietUserProfile>) => void;
  setActiveDiet: (diet: GeneratedDiet) => void;
  addToHistory: (diet: GeneratedDiet) => void;
  clearActiveDiet: () => void;
}

const defaultProfile: DietUserProfile = {
  objective: 'Manter peso',
  activityLevel: 'Moderado',
  restrictions: '',
  calorieGoal: 2000,
  mealsPerDay: 4,
};

export const useDietAIStore = create<DietAIState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      activeDiet: null,
      history: [],
      setProfile: (profileUpdates) => 
        set((state) => ({ profile: { ...state.profile, ...profileUpdates } })),
      setActiveDiet: (diet) => 
        set(() => ({ activeDiet: diet })),
      addToHistory: (diet) =>
        set((state) => {
          const newHistory = [diet, ...state.history].slice(0, 3); // Keep only last 3
          return { history: newHistory };
        }),
      clearActiveDiet: () => set({ activeDiet: null }),
    }),
    {
      name: 'diet-ai-storage', // Key in localStorage
    }
  )
);
