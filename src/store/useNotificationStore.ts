import { create } from 'zustand';
import { Notification, LeadStage, STAGE_CONFIG } from '@/types';
import { mockNotifications } from '@/data/mockData';
import { formatISO } from 'date-fns';
import { useUserStore } from './useUserStore';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;

  notifyStageChange: (leadId: string, companyName: string, newStage: LeadStage, value: number) => void;
  notifyLost: (leadId: string, companyName: string, reason: string) => void;
  notifyCooling: (leadId: string, companyName: string, days: number) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.isRead).length,

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
    const currentUser = useUserStore.getState().currentUser;
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

    if (currentUser?.role === 'manager') {
    }
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

  notifyCooling: (leadId, companyName, days) => {
    const { addNotification } = get();
    const lead = useUserStore.getState();
    const currentUser = useUserStore.getState().currentUser;

    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        type: 'cooling',
        title: '冷却线索提醒',
        content: `${companyName} 已超过${days}天未跟进，请及时处理`,
        relatedId: leadId,
      });
    }
  },
}));
