export type LeadStage = 'initial' | 'requirement' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type LeadSource = 'website' | 'exhibition' | 'referral';

export type CommunicationType = 'call' | 'email' | 'visit';

export type UserRole = 'sales' | 'manager';

export type NotificationType = 'stage_change' | 'lost' | 'cooling' | 'goal';

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  source: LeadSource;
  stage: LeadStage;
  ownerId: string;
  ownerName: string;
  value: number;
  isCooling: boolean;
  coolingDays: number;
  lastFollowUpAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  leadId: string;
  type: CommunicationType;
  content: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

export interface StageHistory {
  id: string;
  leadId: string;
  fromStage: LeadStage | null;
  toStage: LeadStage;
  operatorId: string;
  operatorName: string;
  createdAt: string;
  durationDays?: number;
}

export interface Customer {
  id: string;
  leadId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  source: LeadSource;
  dealValue: number;
  dealDate: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Goal {
  id: string;
  userId: string;
  userName: string;
  period: 'monthly' | 'quarterly';
  targetAmount: number;
  currentAmount: number;
  year: number;
  month: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

export interface FunnelData {
  stage: LeadStage;
  stageName: string;
  count: number;
  conversionRate: number;
  value: number;
}

export interface StageDuration {
  stage: LeadStage;
  stageName: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
}

export const STAGE_CONFIG: Record<LeadStage, { name: string; color: string; bgColor: string }> = {
  initial: { name: '初步接触', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  requirement: { name: '需求确认', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  proposal: { name: '方案报价', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  negotiation: { name: '谈判', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  won: { name: '成交', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  lost: { name: '流失', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' },
};

export const SOURCE_CONFIG: Record<LeadSource, { name: string; color: string; bgColor: string }> = {
  website: { name: '官网表单', color: 'text-sky-700', bgColor: 'bg-sky-100' },
  exhibition: { name: '展会', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  referral: { name: '转介绍', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
};

export const COMMUNICATION_CONFIG: Record<CommunicationType, { name: string; icon: string; color: string }> = {
  call: { name: '电话', icon: 'phone', color: 'text-blue-500' },
  email: { name: '邮件', icon: 'mail', color: 'text-purple-500' },
  visit: { name: '拜访', icon: 'map-pin', color: 'text-orange-500' },
};

export const STAGE_ORDER: LeadStage[] = ['initial', 'requirement', 'proposal', 'negotiation', 'won', 'lost'];
