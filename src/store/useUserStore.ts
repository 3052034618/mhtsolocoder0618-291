import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface UserState {
  users: User[];
  currentUserId: string;
  currentUser: User | null;
  setCurrentUser: (userId: string) => void;
  toggleRole: () => void;
  getUserById: (userId: string) => User | undefined;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: mockUsers,
  currentUserId: 'user-1',
  currentUser: mockUsers[0],

  setCurrentUser: (userId: string) => {
    const user = get().users.find(u => u.id === userId);
    set({ currentUserId: userId, currentUser: user || null });
  },

  toggleRole: () => {
    const { currentUserId, users } = get();
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser) return;

    const targetRole: UserRole = currentUser.role === 'sales' ? 'manager' : 'sales';
    const targetUser = users.find(u => u.role === targetRole);
    if (targetUser) {
      set({ currentUserId: targetUser.id, currentUser: targetUser });
    }
  },

  getUserById: (userId: string) => {
    return get().users.find(u => u.id === userId);
  },
}));
