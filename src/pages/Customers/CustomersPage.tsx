import { useState } from 'react';
import {
  Search, Building2, Phone, Mail, User, Calendar, DollarSign, X,
  Clock, TrendingUp, History, CheckCircle2,
} from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';
import { Customer, SOURCE_CONFIG, STAGE_CONFIG, COMMUNICATION_CONFIG, Communication, StageHistory } from '@/types';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format';

export function CustomersPage() {
  const customers = useLeadStore(state => state.customers);
  const getCommunicationsByLeadId = useLeadStore(state => state.getCommunicationsByLeadId);
  const getStageHistoriesByLeadId = useLeadStore(state => state.getStageHistoriesByLeadId);
  const users = useUserStore(state => state.users);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'communications' | 'history'>('communications');

  const filteredCustomers = customers.filter(c => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!c.companyName.toLowerCase().includes(query) && !c.contactName.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedOwner && c.ownerId !== selectedOwner) return false;
    return true;
  });

  const totalValue = filteredCustomers.reduce((sum, c) => sum + c.dealValue, 0);

  const communications = selectedCustomer
    ? getCommunicationsByLeadId(selectedCustomer.leadId)
    : [] as Communication[];

  const stageHistories = selectedCustomer
    ? getStageHistoriesByLeadId(selectedCustomer.leadId)
    : [] as StageHistory[];

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">客户档案</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              共 {filteredCustomers.length} 个客户 · 总成交金额 {formatCurrency(totalValue)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索客户..."
                className="input pl-9 w-64"
              />
            </div>

            <select
              value={selectedOwner || ''}
              onChange={(e) => setSelectedOwner(e.target.value || null)}
              className="input w-40"
            >
              <option value="">全部负责人</option>
              {users.filter(u => u.role === 'sales').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer, index) => {
            const sourceConfig = SOURCE_CONFIG[customer.source];
            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="card card-hover p-6 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{customer.companyName}</h3>
                      <span className={`badge text-xs ${sourceConfig.bgColor} ${sourceConfig.color}`}>
                        {sourceConfig.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-accent-600 font-medium">
                    查看详情
                    <TrendingUp className="w-3.5 h-3.5 rotate-45" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>联系人：</span>
                    <span className="font-medium text-slate-800">{customer.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{customer.contactPhone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate max-w-[180px]">{customer.contactEmail || '-'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">成交金额</p>
                    <p className="text-lg font-bold text-accent-600">{formatCurrency(customer.dealValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">成交日期</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(customer.dealDate, 'yyyy-MM-dd')}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={users.find(u => u.id === customer.ownerId)?.avatar}
                      alt={customer.ownerName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs text-slate-500">{customer.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(customer.createdAt, 'MM-dd')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">暂无客户数据</p>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-4xl max-h-[90vh] flex flex-col animate-bounce-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-primary-950 to-primary-800 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.companyName}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                        {SOURCE_CONFIG[selectedCustomer.source].name}
                      </span>
                      <span className="text-primary-200 text-sm flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {selectedCustomer.ownerName}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">联系人</p>
                  <p className="font-semibold text-white">{selectedCustomer.contactName}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">联系电话</p>
                  <p className="font-semibold text-white">{selectedCustomer.contactPhone || '-'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">成交金额</p>
                  <p className="font-bold text-accent-300">{formatCurrency(selectedCustomer.dealValue)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">成交日期</p>
                  <p className="font-semibold text-white">{formatDate(selectedCustomer.dealDate, 'yyyy-MM-dd')}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 px-6 flex-shrink-0">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('communications')}
                  className={`py-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'communications'
                      ? 'border-accent-600 text-accent-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  沟通记录 ({communications.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'history'
                      ? 'border-accent-600 text-accent-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  阶段历程 ({stageHistories.length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 scrollbar-thin">
              {activeTab === 'communications' ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-6">
                    {communications.map((comm, index) => {
                      const Icon = comm.type === 'call' ? Phone : comm.type === 'email' ? Mail : User;
                      return (
                        <div key={comm.id} className="relative pl-10 animate-slide-up" style={{ animationDelay: `${index * 0.03}s` }}>
                          <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                            comm.type === 'call' ? 'bg-blue-100' :
                            comm.type === 'email' ? 'bg-purple-100' : 'bg-orange-100'
                          }`}>
                            <Icon className={`w-3 h-3 ${
                              comm.type === 'call' ? 'text-blue-600' :
                              comm.type === 'email' ? 'text-purple-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div className="card p-4 card-hover">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                comm.type === 'call' ? 'text-blue-600' :
                                comm.type === 'email' ? 'text-purple-600' : 'text-orange-600'
                              }`}>
                                {COMMUNICATION_CONFIG[comm.type].name}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {comm.operatorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatRelativeTime(comm.createdAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{comm.content}</p>
                            <p className="mt-2 text-xs text-slate-400">{formatDate(comm.createdAt, 'yyyy-MM-dd HH:mm')}</p>
                          </div>
                        </div>
                      );
                    })}

                    {communications.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无沟通记录</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-5">
                    <div key="create" className="relative pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center border-2 border-white shadow">
                        <span className="text-[10px] font-bold text-white">0</span>
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium text-slate-900">线索创建</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(selectedCustomer.createdAt, 'yyyy-MM-dd')}
                        </p>
                      </div>
                    </div>

                    {stageHistories.map((history, index) => (
                      <div key={history.id} className="relative pl-10 animate-slide-up" style={{ animationDelay: `${index * 0.03}s` }}>
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center ${
                          history.toStage === 'won' ? 'bg-success-500' : 'bg-accent-500'
                        }`}>
                          {history.toStage === 'won' ? (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-white">{index + 1}</span>
                          )}
                        </div>
                        <div className="card p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm">
                                {history.fromStage && (
                                  <span className="text-slate-500">{STAGE_CONFIG[history.fromStage].name}</span>
                                )}
                                {history.fromStage && <span className="mx-2 text-slate-300">→</span>}
                                <span className={`font-semibold ${STAGE_CONFIG[history.toStage].color}`}>
                                  {STAGE_CONFIG[history.toStage].name}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1">操作人：{history.operatorName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-700">
                                {formatDate(history.createdAt, 'yyyy-MM-dd')}
                              </p>
                              {history.durationDays !== undefined && history.fromStage && (
                                <p className="text-xs text-accent-600 mt-0.5">
                                  停留 {history.durationDays} 天
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div key="win" className="relative pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-success-500 flex items-center justify-center border-2 border-white shadow">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <div className="card p-4 bg-success-50/50 border-success-200">
                        <p className="text-sm font-semibold text-success-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          成交！
                        </p>
                        <p className="text-xs text-success-600 mt-1">
                          {formatDate(selectedCustomer.dealDate, 'yyyy-MM-dd')} · 成交金额 {formatCurrency(selectedCustomer.dealValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
