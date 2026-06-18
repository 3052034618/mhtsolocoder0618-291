import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Building2,
  TrendingUp,
  X as XIcon,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  SOURCE_CONFIG,
  STAGE_CONFIG,
  STAGE_ORDER,
  CommunicationType,
  LeadStage,
  COMMUNICATION_CONFIG,
} from '@/types';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = useLeadStore(state => state.getLeadById(id || ''));
  const communications = useLeadStore(state => state.getCommunicationsByLeadId(id || ''));
  const stageHistories = useLeadStore(state => state.getStageHistoriesByLeadId(id || ''));
  const existingCustomer = useLeadStore(state => state.getCustomerByLeadId(id || ''));
  const updateLeadStage = useLeadStore(state => state.updateLeadStage);
  const addCommunication = useLeadStore(state => state.addCommunication);
  const convertToCustomer = useLeadStore(state => state.convertToCustomer);
  const markAsLost = useLeadStore(state => state.markAsLost);

  const notifyStageChange = useNotificationStore(state => state.notifyStageChange);
  const notifyLost = useNotificationStore(state => state.notifyLost);

  const [showAddComm, setShowAddComm] = useState(false);
  const [commType, setCommType] = useState<CommunicationType>('call');
  const [commContent, setCommContent] = useState('');
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-slate-500">线索不存在</p>
      </div>
    );
  }

  const sourceConfig = SOURCE_CONFIG[lead.source];
  const stageConfig = STAGE_CONFIG[lead.stage];

  const handleAddCommunication = () => {
    if (!commContent.trim()) return;
    addCommunication(lead.id, commType, commContent);
    setCommContent('');
    setShowAddComm(false);
  };

  const handleStageChange = (newStage: LeadStage) => {
    if (newStage === lead.stage) return;
    updateLeadStage(lead.id, newStage);
    notifyStageChange(lead.id, lead.companyName, newStage, lead.value);
  };

  const handleConvertToCustomer = () => {
    convertToCustomer(lead.id);
    notifyStageChange(lead.id, lead.companyName, 'won', lead.value);
    navigate('/customers');
  };

  const handleMarkLost = () => {
    markAsLost(lead.id, lostReason);
    notifyLost(lead.id, lead.companyName, lostReason);
    setShowLostModal(false);
    setLostReason('');
  };

  const nextStage = (): LeadStage | null => {
    const currentIndex = STAGE_ORDER.indexOf(lead.stage);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 2) {
      return STAGE_ORDER[currentIndex + 1];
    }
    return null;
  };

  const commTypeOptions: { value: CommunicationType; icon: any; label: string }[] = [
    { value: 'call', icon: Phone, label: '电话' },
    { value: 'email', icon: Mail, label: '邮件' },
    { value: 'visit', icon: MapPin, label: '拜访' },
  ];

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                {lead.companyName}
                <span className={`badge ${sourceConfig.bgColor} ${sourceConfig.color}`}>
                  {sourceConfig.name}
                </span>
                {lead.isCooling && (
                  <span className="badge bg-cooling-100 text-cooling-600">
                    <Clock className="w-3 h-3 mr-1" />
                    冷却{lead.coolingDays}天
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                当前阶段：<span className={stageConfig.color + ' font-medium'}>{stageConfig.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lead.stage !== 'won' && lead.stage !== 'lost' && nextStage() && (
              <button
                onClick={() => handleStageChange(nextStage()!)}
                className="btn btn-primary"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                推进到 {STAGE_CONFIG[nextStage()!].name}
              </button>
            )}
            {lead.stage !== 'won' && lead.stage !== 'lost' && (
              <button
                onClick={() => setShowLostModal(true)}
                className="btn btn-danger"
              >
                <XCircle className="w-4 h-4 mr-2" />
                标记流失
              </button>
            )}
            {lead.stage === 'won' && existingCustomer && (
              <button
                onClick={() => navigate('/customers')}
                className="btn bg-success-100 text-success-700 hover:bg-success-200 border border-success-200"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                已生成客户档案
              </button>
            )}
            {lead.stage === 'won' && !existingCustomer && (
              <button
                onClick={handleConvertToCustomer}
                className="btn bg-success-600 text-white hover:bg-success-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                转化为客户
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">沟通记录</h2>
                <button
                  onClick={() => setShowAddComm(true)}
                  className="btn btn-sm btn-primary"
                >
                  <Phone className="w-4 h-4 mr-1.5" />
                  添加跟进
                </button>
              </div>

              {showAddComm && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl animate-slide-up">
                  <div className="flex gap-2 mb-3">
                    {commTypeOptions.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setCommType(value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          commType === value
                            ? 'bg-accent-100 text-accent-700'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={commContent}
                    onChange={(e) => setCommContent(e.target.value)}
                    placeholder="记录沟通内容..."
                    className="input resize-none h-24"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setShowAddComm(false)}
                      className="btn btn-sm btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddCommunication}
                      className="btn btn-sm btn-primary"
                      disabled={!commContent.trim()}
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-6">
                  {communications.map((comm, index) => {
                    const commConfig = COMMUNICATION_CONFIG[comm.type];
                    const Icon = comm.type === 'call' ? Phone : comm.type === 'email' ? Mail : MapPin;
                    return (
                      <div key={comm.id} className="relative pl-10 animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
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
                              {commConfig.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatRelativeTime(comm.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {comm.content}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            <span>{comm.operatorName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {communications.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>暂无沟通记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="section-title">阶段历史</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-4">
                  {stageHistories.map((history, index) => (
                    <div key={history.id} className="relative pl-10" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                        history.toStage === 'won' ? 'bg-success-500' :
                        history.toStage === 'lost' ? 'bg-cooling-500' :
                        'bg-accent-500'
                      }`} />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {history.fromStage ? STAGE_CONFIG[history.fromStage].name : '新建'}
                            <span className="mx-2 text-slate-400">→</span>
                            {STAGE_CONFIG[history.toStage].name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            操作人：{history.operatorName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-700">
                            {formatDate(history.createdAt, 'MM-dd HH:mm')}
                          </p>
                          {history.durationDays !== undefined && history.fromStage && (
                            <p className="text-xs text-slate-400">
                              停留 {history.durationDays} 天
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="section-title">基本信息</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">公司名称</p>
                    <p className="text-sm font-medium text-slate-900">{lead.companyName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">联系人</p>
                    <p className="text-sm font-medium text-slate-900">{lead.contactName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">联系电话</p>
                    <p className="text-sm font-medium text-slate-900">{lead.contactPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">邮箱</p>
                    <p className="text-sm font-medium text-slate-900">{lead.contactEmail || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">预估金额</p>
                    <p className="text-lg font-bold text-accent-600">{formatCurrency(lead.value)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">负责人</p>
                    <p className="text-sm font-medium text-slate-900">{lead.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">创建时间</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(lead.createdAt, 'yyyy-MM-dd')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">最近跟进</p>
                    <p className="text-sm font-medium text-slate-900">{formatRelativeTime(lead.lastFollowUpAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="section-title">阶段推进</h2>
              <div className="space-y-2">
                {STAGE_ORDER.filter(s => s !== 'lost').map((stage) => {
                  const config = STAGE_CONFIG[stage];
                  const isActive = lead.stage === stage;
                  const isPast = STAGE_ORDER.indexOf(lead.stage) > STAGE_ORDER.indexOf(stage);
                  return (
                    <button
                      key={stage}
                      onClick={() => handleStageChange(stage)}
                      disabled={isActive || lead.stage === 'won' || lead.stage === 'lost'}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-accent-50 border-2 border-accent-300'
                          : isPast
                          ? 'bg-success-50 border border-success-200'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      } ${(lead.stage === 'won' || lead.stage === 'lost') ? 'cursor-default' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-accent-600 text-white' :
                        isPast ? 'bg-success-500 text-white' : 'bg-slate-300'
                      }`}>
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{STAGE_ORDER.filter(s => s !== 'lost').indexOf(stage) + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-accent-700' :
                        isPast ? 'text-success-700' : 'text-slate-600'
                      }`}>
                        {config.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLostModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-bounce-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">标记线索流失</h3>
              <button
                onClick={() => setShowLostModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="label">流失原因</label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input resize-none h-24"
                placeholder="请输入流失原因..."
                autoFocus
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLostModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleMarkLost}
                  className="btn btn-danger flex-1"
                  disabled={!lostReason.trim()}
                >
                  确认流失
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
