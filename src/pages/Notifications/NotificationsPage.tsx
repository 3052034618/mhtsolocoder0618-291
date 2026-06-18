import { useNavigate } from 'react-router-dom';
import {
  Bell,
  TrendingUp,
  XCircle,
  AlertCircle,
  Target,
  CheckCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { formatRelativeTime } from '@/utils/format';
import { NotificationType } from '@/types';

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const currentUser = useUserStore(state => state.currentUser);

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'stage_change':
        return { icon: TrendingUp, color: 'text-success-600', bg: 'bg-success-100' };
      case 'lost':
        return { icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-100' };
      case 'cooling':
        return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'goal':
        return { icon: Target, color: 'text-accent-600', bg: 'bg-accent-100' };
      default:
        return { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100' };
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.type === 'stage_change' || notification.type === 'lost' || notification.type === 'cooling') {
      navigate(`/lead/${notification.relatedId}`);
    } else if (notification.type === 'goal') {
      navigate('/goals');
    }
  };

  const unreadNotifications = userNotifications.filter(n => !n.isRead);
  const readNotifications = userNotifications.filter(n => n.isRead);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">通知中心</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              您有 {unreadCount} 条未读通知
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary btn-sm"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              全部已读
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                未读通知
              </h3>
              <div className="space-y-2">
                {unreadNotifications.map((notification, index) => {
                  const { icon: Icon, color, bg } = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="card card-hover p-4 cursor-pointer border-l-4 border-l-accent-500 animate-slide-up bg-accent-50/30"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-medium text-slate-900">{notification.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(notification.createdAt)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-xs text-accent-600 font-medium">
                            查看详情
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3">
                历史通知
              </h3>
              <div className="space-y-2">
                {readNotifications.map((notification, index) => {
                  const { icon: Icon, color, bg } = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="card card-hover p-4 cursor-pointer opacity-75 hover:opacity-100 animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-medium text-slate-700">{notification.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(notification.createdAt)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {userNotifications.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500">暂无通知</p>
              <p className="text-sm text-slate-400 mt-1">重要变动会在这里提醒您</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
