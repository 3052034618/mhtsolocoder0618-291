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
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Target,
  CalendarRange,
  Gauge,
} from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';
import { SOURCE_CONFIG } from '@/types';
import { formatCurrency } from '@/utils/format';
import { startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function AnalyticsPage() {
  const getFunnelData = useLeadStore(state => state.getFunnelData);
  const getStageDurations = useLeadStore(state => state.getStageDurations);
  const getDealsByMonth = useLeadStore(state => state.getDealsByMonth);
  const getDealCycleDistribution = useLeadStore(state => state.getDealCycleDistribution);
  const getAverageDealCycle = useLeadStore(state => state.getAverageDealCycle);
  const leads = useLeadStore(state => state.leads);
  const customers = useLeadStore(state => state.customers);
  const users = useUserStore(state => state.users);

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const periodRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let months: number;

    switch (selectedPeriod) {
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        months = 1;
        break;
      case 'quarter':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        months = 3;
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        months = 12;
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        months = 1;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      months,
      label: format(start, 'yyyy年M月d日', { locale: zhCN }) + ' - ' + format(end, 'M月d日', { locale: zhCN }),
    };
  }, [selectedPeriod]);

  const funnelData = useMemo(
    () => getFunnelData({ startDate: periodRange.startDate, endDate: periodRange.endDate }),
    [getFunnelData, periodRange]
  );

  const stageDurations = useMemo(
    () => getStageDurations({ startDate: periodRange.startDate, endDate: periodRange.endDate }),
    [getStageDurations, periodRange]
  );

  const dealsByMonth = useMemo(
    () => getDealsByMonth(periodRange.months),
    [getDealsByMonth, periodRange]
  );

  const dealCycleDistribution = useMemo(
    () => getDealCycleDistribution({ startDate: periodRange.startDate, endDate: periodRange.endDate }),
    [getDealCycleDistribution, periodRange]
  );

  const averageDealCycle = useMemo(
    () => getAverageDealCycle({ startDate: periodRange.startDate, endDate: periodRange.endDate }),
    [getAverageDealCycle, periodRange]
  );

  const periodLeads = useMemo(() => {
    return leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= new Date(periodRange.startDate) && createdAt <= new Date(periodRange.endDate);
    });
  }, [leads, periodRange]);

  const periodCustomers = useMemo(() => {
    return customers.filter(customer => {
      const dealDate = new Date(customer.dealDate);
      return dealDate >= new Date(periodRange.startDate) && dealDate <= new Date(periodRange.endDate);
    });
  }, [customers, periodRange]);

  const sourceDistribution = useMemo(() => {
    const sources: Record<string, { name: string; value: number; color: string }> = {};
    Object.entries(SOURCE_CONFIG).forEach(([key, config]) => {
      sources[key] = { name: config.name, value: 0, color: key === 'website' ? '#0EA5E9' : key === 'exhibition' ? '#8B5CF6' : '#10B981' };
    });
    periodLeads.forEach(lead => {
      if (sources[lead.source]) {
        sources[lead.source].value++;
      }
    });
    return Object.values(sources);
  }, [periodLeads]);

  const salesRanking = useMemo(() => {
    const ranking = users
      .filter(u => u.role === 'sales')
      .map(user => {
        const userCustomers = periodCustomers.filter(c => c.ownerId === user.id);
        const totalValue = userCustomers.reduce((sum, c) => sum + c.dealValue, 0);
        const dealCount = userCustomers.length;
        const userLeads = periodLeads.filter(l => l.ownerId === user.id);
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
  }, [users, periodCustomers, periodLeads]);

  const stats = useMemo(() => {
    const totalLeads = periodLeads.length;
    const wonLeads = periodLeads.filter(l => l.stage === 'won').length;
    const lostLeads = periodLeads.filter(l => l.stage === 'lost').length;
    const totalValue = periodCustomers.reduce((sum, c) => sum + c.dealValue, 0);
    const winRate = totalLeads > 0 ? (wonLeads / Math.max((wonLeads + lostLeads), 1)) * 100 : 0;

    return [
      { label: '新增线索', value: totalLeads, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', trend: '本期新增' },
      { label: '成交客户', value: periodCustomers.length, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', trend: '本期成交' },
      { label: '总成交额', value: formatCurrency(totalValue), icon: DollarSign, color: 'text-accent-600', bgColor: 'bg-accent-50', trend: '本期累计' },
      { label: '平均成交周期', value: `${averageDealCycle.avgDays}天`, icon: CalendarRange, color: 'text-purple-600', bgColor: 'bg-purple-50', trend: `中位数 ${averageDealCycle.medianDays}天` },
    ];
  }, [periodLeads, periodCustomers, averageDealCycle]);

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

  const cycleChartData = dealCycleDistribution.map(d => ({
    name: d.name,
    成交单数: d.count,
    金额万元: Math.round(d.value / 10000 * 10) / 10,
  }));

  const monthlyDealsData = dealsByMonth.map(d => ({
    name: d.month,
    成交金额: d.value / 10000,
    成交数: d.count,
  }));

  const totalDealsInCycle = dealCycleDistribution.reduce((sum, b) => sum + b.count, 0);
  const maxCycleBucket = dealCycleDistribution.reduce((max, b) => b.count > max.count ? b : max, dealCycleDistribution[0]);
  const peakPercentage = totalDealsInCycle > 0 ? Math.round(maxCycleBucket.count / totalDealsInCycle * 100) : 0;

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">数据分析</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {periodRange.label} · 共 {averageDealCycle.totalCount} 条成交样本
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
                  <span className="text-xs text-slate-400">{stat.trend}</span>
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
              各阶段停留时长（基于实际线索停留）
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
                  <Legend />
                  <Bar dataKey="平均天数" name="平均" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="最长" name="最长" fill="#C4B5FD" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="最短" name="最短" fill="#A78BFA" radius={[6, 6, 0, 0]} />
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

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2 card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-accent-600" />
                  成交周期分布
                </h3>
                <p className="text-xs text-slate-500 mt-1">从线索创建到成交的天数区间分布，识别销售效率瓶颈</p>
              </div>
              {totalDealsInCycle > 0 && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">集中区间</p>
                  <p className="text-sm font-bold text-accent-600">
                    {maxCycleBucket.name} · {peakPercentage}%
                  </p>
                </div>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycleChartData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" unit="万" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="成交单数" name="成交单数" fill="#FF6B35" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="金额万元" name="金额(万元)" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-950 to-primary-800 text-white">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-accent-400" />
              成交周期洞察
            </h3>
            <div className="space-y-5">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-primary-200 text-xs mb-1">平均成交周期</p>
                <p className="text-3xl font-bold">{averageDealCycle.avgDays} <span className="text-lg">天</span></p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(averageDealCycle.avgDays / 60 * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-primary-200 text-xs mb-1">中位数周期</p>
                <p className="text-2xl font-bold">{averageDealCycle.medianDays} <span className="text-base">天</span></p>
                <p className="text-xs text-primary-300 mt-1">
                  {averageDealCycle.medianDays <= 30 ? '✓ 效率优秀，多数在1个月内成交' :
                   averageDealCycle.medianDays <= 60 ? '⚡ 正常水平，1-2个月成交' :
                   '⚠ 周期偏长，建议优化流程'}
                </p>
              </div>

              <div className="space-y-3">
                {dealCycleDistribution.filter(b => b.count > 0).slice(0, 3).map((bucket, i) => (
                  <div key={bucket.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-primary-200">{bucket.name}</span>
                      <span className="text-white font-medium">
                        {bucket.count}单 · {totalDealsInCycle > 0 ? Math.round(bucket.count / totalDealsInCycle * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-accent-400' : i === 1 ? 'bg-purple-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${totalDealsInCycle > 0 ? (bucket.count / totalDealsInCycle * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" unit="万" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" unit="单" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="成交金额"
                  name="成交金额(万元)"
                  stroke="#FF6B35"
                  strokeWidth={3}
                  dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#FF6B35' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="成交数"
                  name="成交数"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
