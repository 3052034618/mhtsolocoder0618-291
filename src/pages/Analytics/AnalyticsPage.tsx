import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Clock, Users, DollarSign, BarChart3, Target } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';
import { useGoalStore } from '@/store/useGoalStore';
import { STAGE_CONFIG, SOURCE_CONFIG } from '@/types';
import { formatCurrency } from '@/utils/format';

export function AnalyticsPage() {
  const funnelData = useLeadStore(state => state.getFunnelData());
  const stageDurations = useLeadStore(state => state.getStageDurations());
  const dealsByMonth = useLeadStore(state => state.getDealsByMonth(6));
  const leads = useLeadStore(state => state.leads);
  const customers = useLeadStore(state => state.customers);
  const users = useUserStore(state => state.users);
  const goals = useGoalStore(state => state.goals);

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const sourceDistribution = useMemo(() => {
    const sources: Record<string, { name: string; value: number; color: string }> = {};
    Object.entries(SOURCE_CONFIG).forEach(([key, config]) => {
      sources[key] = { name: config.name, value: 0, color: key === 'website' ? '#0EA5E9' : key === 'exhibition' ? '#8B5CF6' : '#10B981' };
    });
    leads.forEach(lead => {
      if (sources[lead.source]) {
        sources[lead.source].value++;
      }
    });
    return Object.values(sources);
  }, [leads]);

  const salesRanking = useMemo(() => {
    const ranking = users
      .filter(u => u.role === 'sales')
      .map(user => {
        const userCustomers = customers.filter(c => c.ownerId === user.id);
        const totalValue = userCustomers.reduce((sum, c) => sum + c.dealValue, 0);
        const dealCount = userCustomers.length;
        const userLeads = leads.filter(l => l.ownerId === user.id);
        const conversionRate = userLeads.length > 0 ? (dealCount / userLeads.length) * 100 : 0;
        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          totalValue,
          dealCount,
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);
    return ranking;
  }, [users, customers, leads]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.stage === 'won').length;
    const lostLeads = leads.filter(l => l.stage === 'lost').length;
    const totalValue = customers.reduce((sum, c) => sum + c.dealValue, 0);
    const avgDealValue = customers.length > 0 ? totalValue / customers.length : 0;
    const winRate = totalLeads > 0 ? (wonLeads / (wonLeads + lostLeads)) * 100 : 0;

    return [
      { label: '总线索数', value: totalLeads, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: '成交客户', value: customers.length, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: '总成交额', value: formatCurrency(totalValue), icon: DollarSign, color: 'text-accent-600', bgColor: 'bg-accent-50' },
      { label: '成交率', value: `${Math.round(winRate)}%`, icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    ];
  }, [leads, customers]);

  const COLORS = ['#FF6B35', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'];

  const funnelChartData = funnelData
    .filter(d => d.stage !== 'lost')
    .map(d => ({
      name: d.stageName,
      数量: d.count,
      金额: d.value / 10000,
    }));

  const durationChartData = stageDurations.map(d => ({
    name: d.stageName,
    平均天数: d.avgDays,
    最短: d.minDays,
    最长: d.maxDays,
  }));

  const monthlyDealsData = dealsByMonth.map(d => ({
    name: d.month,
    成交金额: d.value / 10000,
    成交数: d.count,
  }));

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">数据分析</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              全团队线索漏斗与转化分析
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            {[
              { value: 'month', label: '本月' },
              { value: 'quarter', label: '本季度' },
              { value: 'year', label: '本年' },
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-5 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="card p-5 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-slate-400">
                    {index % 2 === 0 ? '↑ 12%' : '↑ 8%'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-600" />
                销售漏斗
              </h3>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-accent-500" />
                  线索数量
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData} layout="vertical" barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={80} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="数量" fill="#FF6B35" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-4">
              {funnelData.slice(0, 4).map((item, index) => (
                <div key={item.stage} className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{item.count}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.stageName}</p>
                  {index > 0 && (
                    <p className="text-xs text-accent-600 font-medium mt-0.5">
                      转化率 {item.conversionRate}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-600" />
              来源分布
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {sourceDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2 card p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-600" />
              各阶段停留时长
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationChartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="天" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="平均天数" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-600" />
              销售排行榜
            </h3>
            <div className="space-y-4">
              {salesRanking.map((person, index) => (
                <div key={person.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-9 h-9 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {person.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {person.dealCount} 单 · 转化率 {person.conversionRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-600">
                      {formatCurrency(person.totalValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent-600" />
            近6个月成交趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDealsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="万" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="成交金额"
                  stroke="#FF6B35"
                  strokeWidth={3}
                  dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#FF6B35' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
