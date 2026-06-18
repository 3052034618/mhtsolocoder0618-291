import { useState } from 'react';
import { Search, Building2, Phone, Mail, User, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';
import { SOURCE_CONFIG } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export function CustomersPage() {
  const customers = useLeadStore(state => state.customers);
  const users = useUserStore(state => state.users);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

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
                className="card card-hover p-6 animate-slide-up"
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
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
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
                    <span>{customer.contactEmail || '-'}</span>
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
    </div>
  );
}
