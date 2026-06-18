import { create } from 'zustand';
import { Goal } from '@/types';
import { mockGoals } from '@/data/mockData';

interface GoalState {
  goals: Goal[];

  getGoalsByPeriod: (period: 'monthly' | 'quarterly') => Goal[];
  getTeamGoal: (period: 'monthly' | 'quarterly') => Goal | undefined;
  updateGoal: (goalId: string, targetAmount: number) => void;
  getProgress: (goal: Goal) => number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: mockGoals,

  getGoalsByPeriod: (period) => {
    return get().goals.filter(g => g.period === period && g.userId !== 'user-4');
  },

  getTeamGoal: (period) => {
    return get().goals.find(g => g.period === period && g.userId === 'user-4');
  },

  updateGoal: (goalId, targetAmount) => {
    set(state => ({
      goals: state.goals.map(g =>
        g.id === goalId ? { ...g, targetAmount } : g
      ),
    }));
  },

  getProgress: (goal) => {
    if (goal.targetAmount === 0) return 0;
    return Math.round((goal.currentAmount / goal.targetAmount) * 100 * 10) / 10;
  },
}));
