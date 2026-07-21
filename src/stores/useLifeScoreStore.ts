import { create } from 'zustand';
import { ScoreBreakdown } from '../types';

interface LifeScoreState {
  score: number;
  breakdown: ScoreBreakdown | null;
  lastPointsEarned: number;
  toastMessage: string | null;
  toastIcon: string | null;
  setScore: (newScore: number, newBreakdown: ScoreBreakdown | null, pointsDiff: number) => void;
  showToast: (message: string, icon: string, pointsEarned: number) => void;
  hideToast: () => void;
}

export const useLifeScoreStore = create<LifeScoreState>((set) => ({
  score: 0,
  breakdown: null,
  lastPointsEarned: 0,
  toastMessage: null,
  toastIcon: null,
  
  setScore: (newScore, newBreakdown, pointsDiff) => {
    set({ score: newScore, breakdown: newBreakdown, lastPointsEarned: pointsDiff });
  },

  showToast: (message, icon, pointsEarned = 0) => {
    set((state) => ({ 
      toastMessage: message, 
      toastIcon: icon, 
      lastPointsEarned: pointsEarned !== 0 ? pointsEarned : 0 
    }));
    setTimeout(() => {
      set({ toastMessage: null, toastIcon: null })
    }, 2500);
  },

  hideToast: () => {
    set({ toastMessage: null, toastIcon: null });
  }
}));
