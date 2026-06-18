import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Target,
  Bell,
  Settings,
  Building2,
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '线索看板' },
  { path: '/customers', icon: Building2, label: '客户档案' },
  { path: '/analytics', icon: BarChart3, label: '数据分析' },
  { path: '/goals', icon: Target, label: '目标管理' },
  { path: '/notifications', icon: Bell, label: '通知中心' },
];

export function Sidebar() {
  const location = useLocation();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const currentUser = useUserStore(state => state.currentUser);
  const toggleRole = useUserStore(state => state.toggleRole);

  return (
    <aside className="w-64 bg-primary-950 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-primary-900">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-9 h-9 bg-accent-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          销售CRM
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/30'
                  : 'text-primary-200 hover:bg-primary-900 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-900">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-full bg-primary-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs text-primary-400">
              {currentUser?.role === 'manager' ? '销售经理' : '销售代表'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleRole}
          className="w-full text-xs text-primary-300 hover:text-white bg-primary-900 hover:bg-primary-800 rounded-lg py-2 transition-colors"
        >
          切换角色视图
        </button>
      </div>
    </aside>
  );
}
