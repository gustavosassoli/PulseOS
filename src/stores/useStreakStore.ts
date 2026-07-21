import { create } from 'zustand';
import { PillarType } from '../types';

export interface MilestoneEvent {
  pillar: PillarType;
  days: number;
}

interface StreakStore {
  riskPillars: { pillar: PillarType; days: number }[];
  milestones: MilestoneEvent[];
  addRisk: (pillar: PillarType, days: number) => void;
  removeRisk: (pillar: PillarType) => void;
  addMilestone: (pillar: PillarType, days: number) => void;
  popMilestone: () => MilestoneEvent | null;
}

export const useStreakStore = create<StreakStore>((set, get) => ({
  riskPillars: [],
  milestones: [],
  addRisk: (pillar, days) => set((state) => ({ 
    riskPillars: [...state.riskPillars.filter(r => r.pillar !== pillar), { pillar, days }] 
  })),
  removeRisk: (pillar) => set((state) => ({
    riskPillars: state.riskPillars.filter((p) => p.pillar !== pillar),
  })),
  addMilestone: (pillar, days) => set((state) => ({
    milestones: [...state.milestones, { pillar, days }]
  })),
  popMilestone: () => {
    const { milestones } = get();
    if (milestones.length === 0) return null;
    const first = milestones[0];
    set({ milestones: milestones.slice(1) });
    return first;
  }
}));
