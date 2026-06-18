import { useState } from 'react';
import { X } from 'lucide-react';
import { LeadSource } from '@/types';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'website', label: '官网表单' },
  { value: 'exhibition', label: '展会' },
  { value: 'referral', label: '转介绍' },
];

export function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const addLead = useLeadStore(state => state.addLead);
  const currentUser = useUserStore(state => state.currentUser);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    source: 'website' as LeadSource,
    value: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName) return;

    const now = new Date().toISOString();
    addLead({
      companyName: formData.companyName,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      source: formData.source,
      stage: 'initial',
      value: Number(formData.value) || 0,
      lastFollowUpAt: now,
      ownerId: currentUser?.id || 'user-1',
      ownerName: currentUser?.name || '未知',
    });

    setFormData({
      companyName: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      source: 'website',
      value: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-bounce-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">新建线索</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">公司名称 *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="input"
              placeholder="请输入公司名称"
              required
            />
          </div>

          <div>
            <label className="label">联系人 *</label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="input"
              placeholder="请输入联系人姓名"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">联系电话</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="input"
                placeholder="请输入电话"
              />
            </div>
            <div>
              <label className="label">邮箱</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="input"
                placeholder="请输入邮箱"
              />
            </div>
          </div>

          <div>
            <label className="label">来源渠道</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
              className="input"
            >
              {sourceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">预估金额 (元)</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="input"
              placeholder="请输入预估金额"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              创建线索
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
