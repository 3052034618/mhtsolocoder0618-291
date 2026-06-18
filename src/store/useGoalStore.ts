import { create } from 'zustand';
import { Goal } from '@/types';
import { mockGoals } from '@/data/mockData';
import { getMonth, getYear } from 'date-fns';

const STORAGE_KEY = 'crm_goal_state_v1';

interface GoalState {
  goals: Goal[];

  getGoalsByPeriod: (period: 'monthly' | 'quarterly') => Goal[];
  getTeamGoal: (period: 'monthly' | 'quarterly') => Goal | undefined;
  updateGoal: (goalId: string, targetAmount: number) => void;
  getProgress: (goal: Goal) => number;
  addDealAmount: (userId: string, dealDate: string, amount: number) => void;
  resetToMock: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.goals && Array.isArray(parsed.goals) && parsed.goals.length > 0) {
        return parsed.goals;
      }
    }
  } catch {
    console.warn('Failed to load goal state from localStorage, using mock data');
  }
  return mockGoals;
};

const initialGoals = loadInitialState();

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: initialGoals,

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

  addDealAmount: (userId, dealDate, amount) => {
    const dealTime = new Date(dealDate);
    const dealMonth = getMonth(dealTime);
    const dealYear = getYear(dealTime);
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);
    const isCurrentMonth = dealMonth === currentMonth && dealYear === currentYear;

    if (!isCurrentMonth) return;

    const managerUserId = 'user-4';

    set(state => ({
      goals: state.goals.map(g => {
        if (g.period !== 'monthly') return g;
        if (g.userId === userId || g.userId === managerUserId) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      }),
    }));
  },

  resetToMock: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ goals: mockGoals });
  },
}));

useGoalStore.subscribe((state, prevState) => {
  try {
    if (state.goals !== prevState.goals) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        goals: state.goals,
      }));
    }
  } catch {
    console.warn('Failed to save goal state to localStorage');
  }
});
