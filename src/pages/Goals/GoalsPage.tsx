import { useState } from 'react';
import { Target, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Edit2, Check, X } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useUserStore } from '@/store/useUserStore';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/format';

export function GoalsPage() {
  const goals = useGoalStore(state => state.getGoalsByPeriod('monthly'));
  const teamGoal = useGoalStore(state => state.getTeamGoal('monthly'));
  const getProgress = useGoalStore(state => state.getProgress);
  const updateGoal = useGoalStore(state => state.updateGoal);
  const currentUser = useUserStore(state => state.currentUser);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditValue(goal.targetAmount.toString());
  };

  const saveEdit = (goalId: string) => {
    const value = Number(editValue);
    if (value > 0) {
      updateGoal(goalId, value);
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const CircularProgress = ({ progress, size = 120, strokeWidth = 10, color = '#FF6B35' }: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">目标管理</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              2026年6月 销售目标追踪
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button className="px-4 py-1.5 text-sm font-medium rounded-md bg-white text-slate-900 shadow-sm">
              月度
            </button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900">
              季度
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {teamGoal && (
          <div className="card p-8 mb-6 bg-gradient-to-br from-primary-950 to-primary-800 text-white animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  团队总目标
                </h3>
                <p className="text-primary-300 text-sm">2026年6月团队销售目标</p>
              </div>

              <div className="flex items-center gap-8">
                <div className="relative">
                  <CircularProgress
                    progress={getProgress(teamGoal)}
                    size={140}
                    strokeWidth={12}
                    color="#FF6B35"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{getProgress(teamGoal)}%</span>
                    <span className="text-xs text-primary-300">达成率</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-primary-300 text-sm">目标金额</p>
                    <p className="text-2xl font-bold">{formatCurrency(teamGoal.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-primary-300 text-sm">已完成</p>
                    <p className="text-2xl font-bold text-accent-400">{formatCurrency(teamGoal.currentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-primary-300 text-sm">剩余缺口</p>
                    <p className="text-xl font-semibold text-danger-400">
                      {formatCurrency(teamGoal.targetAmount - teamGoal.currentAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-600" />
          个人目标
        </h3>

        <div className="grid grid-cols-3 gap-5">
          {goals.map((goal, index) => {
            const progress = getProgress(goal);
            const isEditing = editingId === goal.id;
            const gap = goal.targetAmount - goal.currentAmount;

            return (
              <div
                key={goal.id}
                className="card p-6 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${goal.userName}`}
                      alt={goal.userName}
                      className="w-11 h-11 rounded-full bg-slate-100"
                    />
                    <div>
                      <h4 className="font-semibold text-slate-900">{goal.userName}</h4>
                      <p className="text-xs text-slate-500">销售代表</p>
                    </div>
                  </div>
                  {currentUser?.role === 'manager' && !isEditing && (
                    <button
                      onClick={() => startEdit(goal)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <CircularProgress
                      progress={progress}
                      size={100}
                      strokeWidth={8}
                      color={progress >= 100 ? '#10B981' : progress >= 60 ? '#FF6B35' : '#EF4444'}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">目标金额</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(goal.id)}
                          className="p-1 text-success-600 hover:bg-success-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-danger-500 hover:bg-danger-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-900">{formatCurrency(goal.targetAmount)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">已完成</span>
                    <span className="font-medium text-success-600">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">缺口</span>
                    <span className={`font-medium ${gap > 0 ? 'text-danger-500' : 'text-success-600'}`}>
                      {gap > 0 ? formatCurrency(gap) : '已完成'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        progress >= 100 ? 'bg-success-500' : progress >= 60 ? 'bg-accent-500' : 'bg-danger-400'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 card p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-600" />
            目标完成预测
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success-50 rounded-xl">
              <TrendingUp className="w-8 h-8 text-success-600 mx-auto mb-2" />
              <p className="text-sm text-success-600 font-medium">乐观预测</p>
              <p className="text-2xl font-bold text-success-700 mt-1">92%</p>
              <p className="text-xs text-success-500 mt-1">按当前速度可完成</p>
            </div>
            <div className="text-center p-4 bg-accent-50 rounded-xl">
              <Target className="w-8 h-8 text-accent-600 mx-auto mb-2" />
              <p className="text-sm text-accent-600 font-medium">保守预测</p>
              <p className="text-2xl font-bold text-accent-700 mt-1">78%</p>
              <p className="text-xs text-accent-500 mt-1">考虑波动因素</p>
            </div>
            <div className="text-center p-4 bg-danger-50 rounded-xl">
              <TrendingDown className="w-8 h-8 text-danger-500 mx-auto mb-2" />
              <p className="text-sm text-danger-600 font-medium">当前进度</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">50%</p>
              <p className="text-xs text-danger-500 mt-1">已过半程需加速</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
