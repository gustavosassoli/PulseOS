/*
=============================================================================
 DIAGRAMA DE FLUXO DE DADOS - DIET LIFECYCLE (TRÊS CAMADAS)
=============================================================================

 [ASYNC STORAGE]
       │
       ├── "diet_base" (Camada 1: Permanente)
       │    └─ Estrutura mestre gerada pela IA, perfil, restrições e refeições.
       │       Persiste até nova geração/edição manual profunda.
       │
       ├── "diet_progress_current" (Camada 2: Progresso Diário)
       │    └─ O que foi feito *hoje* (IDs marcados + Extras adicionados).
       │       Controla a UI de checkboxes e soma térmica. Zera à meia-noite.
       │
       ├── "diet_history_YYYY-MM-DD" (Camada 3: Histórico)
       │    └─ Arquivamento do 'diet_progress_current' dos dias anteriores.
       │       Usado para relatórios (Mantém até 90 dias).
       │
       └── "diet_ai_history" 
            └─ Histórico das últimas dietas geradas pela IA.

 LÓGICA DE RESET AUTOMÁTICO:
  DietResetService.checkAndResetIfNeeded() avalia se 'diet_progress_current.date'
  equivale ao dia de HOJE. Se divergir, move para history e cria um array fresh.
=============================================================================
*/

import { create } from 'zustand';
import { DietBase, DietDayProgress, DietExtraItem, DietMeal } from '../types/diet';
import { AsyncStorage } from '../utils/AsyncStorage';
import { dietResetService } from '../services/DietResetService';

interface DietStoreState {
  dietBase: DietBase | null;
  dayProgress: DietDayProgress | null;
  aiHistory: DietBase[];
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  setDietBase: (diet: DietBase) => Promise<void>;
  updateDietMeal: (meal: DietMeal) => Promise<void>;
  removeDietMeal: (mealId: string) => Promise<void>;
  
  toggleMealCompletion: (mealId: string) => Promise<void>;
  addExtraItem: (extra: DietExtraItem) => Promise<void>;
  removeExtraItem: (extraId: string) => Promise<void>;
}

export const useDietStore = create<DietStoreState>((set, get) => ({
  dietBase: null,
  dayProgress: null,
  aiHistory: [],
  isLoading: true,

  init: async () => {
    set({ isLoading: true });
    
    // Check and reset daily progress if needed
    await dietResetService.checkAndResetIfNeeded();

    // Load data
    const [baseStr, progressStr, historyStr] = await Promise.all([
      AsyncStorage.getItem('diet_base'),
      AsyncStorage.getItem('diet_progress_current'),
      AsyncStorage.getItem('diet_ai_history')
    ]);

    set({
      dietBase: baseStr ? JSON.parse(baseStr) : null,
      dayProgress: progressStr ? JSON.parse(progressStr) : null,
      aiHistory: historyStr ? JSON.parse(historyStr) : [],
      isLoading: false,
    });
  },

  setDietBase: async (diet: DietBase) => {
    const state = get();
    // Save current base to history if exists
    if (state.dietBase) {
      const newHistory = [state.dietBase, ...state.aiHistory].slice(0, 3);
      await AsyncStorage.setItem('diet_ai_history', JSON.stringify(newHistory));
      set({ aiHistory: newHistory });
    }

    // Save new base
    await AsyncStorage.setItem('diet_base', JSON.stringify(diet));
    set({ dietBase: diet });

    // Reset daily progress for today when generating a new diet
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const freshProgress: DietDayProgress = {
      date: today,
      refeicoesConcluidas: [],
      caloriasConsumidas: 0,
      macrosConsumidos: { proteina: 0, carboidrato: 0, gordura: 0 },
      extrasDoDia: []
    };
    await AsyncStorage.setItem('diet_progress_current', JSON.stringify(freshProgress));
    set({ dayProgress: freshProgress });
  },

  updateDietMeal: async (meal: DietMeal) => {
    const { dietBase } = get();
    if (!dietBase) return;

    const updatedBase = {
      ...dietBase,
      updatedAt: new Date().toISOString(),
      refeicoes: dietBase.refeicoes.map(m => m.id === meal.id ? meal : m)
    };

    await AsyncStorage.setItem('diet_base', JSON.stringify(updatedBase));
    set({ dietBase: updatedBase });
  },

  removeDietMeal: async (mealId: string) => {
    const { dietBase } = get();
    if (!dietBase) return;

    const updatedBase = {
      ...dietBase,
      updatedAt: new Date().toISOString(),
      refeicoes: dietBase.refeicoes.filter(m => m.id !== mealId)
    };

    await AsyncStorage.setItem('diet_base', JSON.stringify(updatedBase));
    set({ dietBase: updatedBase });
  },

  toggleMealCompletion: async (mealId: string) => {
    const { dayProgress, dietBase } = get();
    if (!dayProgress || !dietBase) return;

    const meal = dietBase.refeicoes.find(m => m.id === mealId);
    if (!meal) return;

    const isCompleted = dayProgress.refeicoesConcluidas.includes(mealId);
    let newConcluidas = [];
    let calDiff = 0;

    if (isCompleted) {
      newConcluidas = dayProgress.refeicoesConcluidas.filter(id => id !== mealId);
      calDiff = -meal.calorias;
    } else {
      newConcluidas = [...dayProgress.refeicoesConcluidas, mealId];
      calDiff = meal.calorias;
    }

    const updatedProgress = {
      ...dayProgress,
      refeicoesConcluidas: newConcluidas,
      caloriasConsumidas: Math.max(0, dayProgress.caloriasConsumidas + calDiff),
    };

    await AsyncStorage.setItem('diet_progress_current', JSON.stringify(updatedProgress));
    set({ dayProgress: updatedProgress });
  },

  addExtraItem: async (extra: DietExtraItem) => {
    const { dayProgress } = get();
    if (!dayProgress) return;

    const updatedProgress = {
      ...dayProgress,
      extrasDoDia: [...dayProgress.extrasDoDia, extra],
      caloriasConsumidas: dayProgress.caloriasConsumidas + extra.calorias,
    };

    await AsyncStorage.setItem('diet_progress_current', JSON.stringify(updatedProgress));
    set({ dayProgress: updatedProgress });
  },

  removeExtraItem: async (extraId: string) => {
    const { dayProgress } = get();
    if (!dayProgress) return;

    const extra = dayProgress.extrasDoDia.find(e => e.id === extraId);
    if (!extra) return;

    const updatedProgress = {
      ...dayProgress,
      extrasDoDia: dayProgress.extrasDoDia.filter(e => e.id !== extraId),
      caloriasConsumidas: Math.max(0, dayProgress.caloriasConsumidas - extra.calorias),
    };

    await AsyncStorage.setItem('diet_progress_current', JSON.stringify(updatedProgress));
    set({ dayProgress: updatedProgress });
  }
}));
