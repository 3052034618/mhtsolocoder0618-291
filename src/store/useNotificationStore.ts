import { create } from 'zustand';
import { Notification, LeadStage, STAGE_CONFIG } from '@/types';
import { mockNotifications } from '@/data/mockData';
import { formatISO, differenceInDays } from 'date-fns';
import { useUserStore } from './useUserStore';

const STORAGE_KEY = 'crm_notification_state_v1';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;

  notifyStageChange: (leadId: string, companyName: string, newStage: LeadStage, value: number) => void;
  notifyLost: (leadId: string, companyName: string, reason: string) => void;
  notifyCooling: (leadId: string, companyName: string, days: number, ownerId: string, ownerName: string) => void;
  resetToMock: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const notifications = parsed.notifications ?? mockNotifications;
      return {
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
      };
    }
  } catch {
    console.warn('Failed to load notification state from localStorage, using mock data');
  }
  return {
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter(n => !n.isRead).length,
  };
};

const initialData = loadInitialState();

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialData.notifications,
  unreadCount: initialData.unreadCount,

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: `notif-${generateId()}`,
      createdAt: formatISO(new Date()),
      isRead: false,
    };
    set(state => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: state.notifications.find(n => n.id === notificationId && !n.isRead)
        ? state.unreadCount - 1
        : state.unreadCount,
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.isRead).length;
  },

  notifyStageChange: (leadId, companyName, newStage, value) => {
    const { addNotification } = get();
    const stageName = STAGE_CONFIG[newStage].name;

    const managerUsers = useUserStore.getState().users.filter(u => u.role === 'manager');
    managerUsers.forEach(manager => {
      addNotification({
        userId: manager.id,
        type: 'stage_change',
        title: '线索阶段推进',
        content: `${companyName} 已推进到 ${stageName} 阶段，金额 ¥${value.toLocaleString()}`,
        relatedId: leadId,
      });
    });
  },

  notifyLost: (leadId, companyName, reason) => {
    const { addNotification } = get();
    const managerUsers = useUserStore.getState().users.filter(u => u.role === 'manager');

    managerUsers.forEach(manager => {
      addNotification({
        userId: manager.id,
        type: 'lost',
        title: '线索流失提醒',
        content: `${companyName} 已标记为流失，原因：${reason}`,
        relatedId: leadId,
      });
    });
  },

  notifyCooling: (leadId, companyName, days, ownerId, ownerName) => {
    const { addNotification, notifications } = get();
    const now = new Date();

    const shouldNotify = (userId: string) => {
      const recent = notifications.find(n =>
        n.userId === userId &&
        n.type === 'cooling' &&
        n.relatedId === leadId &&
        !n.isRead
      );
      if (recent) {
        const daysSince = differenceInDays(now, new Date(recent.createdAt));
        return daysSince >= 3;
      }
      return true;
    };

    if (shouldNotify(ownerId)) {
      addNotification({
        userId: ownerId,
        type: 'cooling',
        title: '⚠ 冷却线索提醒',
        content: `您负责的【${companyName}】已超过${days}天未跟进，请尽快处理避免流失！`,
        relatedId: leadId,
      });
    }

    const managerUsers = useUserStore.getState().users.filter(u => u.role === 'manager');
    managerUsers.forEach(manager => {
      if (shouldNotify(manager.id)) {
        addNotification({
          userId: manager.id,
          type: 'cooling',
          title: '🔔 团队冷却预警',
          content: `【${ownerName}】负责的【${companyName}】已超过${days}天未跟进，请督促处理`,
          relatedId: leadId,
        });
      }
    });
  },

  resetToMock: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
    });
  },
}));

useNotificationStore.subscribe((state, prevState) => {
  try {
    const changed = state.notifications !== prevState.notifications;
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        notifications: state.notifications,
      }));
    }
  } catch {
    console.warn('Failed to save notification state to localStorage');
  }
});
