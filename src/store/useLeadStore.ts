import { create } from 'zustand';
import {
  Lead,
  LeadStage,
  Communication,
  CommunicationType,
  StageHistory,
  Customer,
  FunnelData,
  StageDuration,
  STAGE_CONFIG,
  STAGE_ORDER,
} from '@/types';
import { mockLeads, mockCommunications, mockStageHistories, mockCustomers } from '@/data/mockData';
import { differenceInDays, formatISO } from 'date-fns';
import { useUserStore } from './useUserStore';

const COOLING_THRESHOLD_DAYS = 7;

interface LeadState {
  leads: Lead[];
  communications: Communication[];
  stageHistories: StageHistory[];
  customers: Customer[];
  selectedSource: string | null;
  selectedOwner: string | null;
  searchQuery: string;

  setSelectedSource: (source: string | null) => void;
  setSelectedOwner: (owner: string | null) => void;
  setSearchQuery: (query: string) => void;

  getLeadsByStage: (stage: LeadStage) => Lead[];
  getFilteredLeads: () => Lead[];
  getLeadById: (leadId: string) => Lead | undefined;
  getCommunicationsByLeadId: (leadId: string) => Communication[];
  getStageHistoriesByLeadId: (leadId: string) => StageHistory[];

  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'isCooling' | 'coolingDays'>) => void;
  updateLeadStage: (leadId: string, newStage: LeadStage) => void;
  addCommunication: (leadId: string, type: CommunicationType, content: string) => void;
  convertToCustomer: (leadId: string) => void;
  markAsLost: (leadId: string, reason: string) => void;

  checkCoolingLeads: () => void;
  getFunnelData: () => FunnelData[];
  getStageDurations: () => StageDuration[];
  getDealsByMonth: (months: number) => { month: string; value: number; count: number }[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: mockLeads,
  communications: mockCommunications,
  stageHistories: mockStageHistories,
  customers: mockCustomers,
  selectedSource: null,
  selectedOwner: null,
  searchQuery: '',

  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedOwner: (owner) => set({ selectedOwner: owner }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getLeadsByStage: (stage) => {
    const { leads, selectedSource, selectedOwner, searchQuery, getFilteredLeads } = get();
    if (selectedSource || selectedOwner || searchQuery) {
      return getFilteredLeads().filter(l => l.stage === stage);
    }
    return leads.filter(l => l.stage === stage);
  },

  getFilteredLeads: () => {
    const { leads, selectedSource, selectedOwner, searchQuery } = get();
    return leads.filter(lead => {
      if (selectedSource && lead.source !== selectedSource) return false;
      if (selectedOwner && lead.ownerId !== selectedOwner) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          lead.companyName.toLowerCase().includes(query) ||
          lead.contactName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  },

  getLeadById: (leadId) => {
    return get().leads.find(l => l.id === leadId);
  },

  getCommunicationsByLeadId: (leadId) => {
    return get().communications
      .filter(c => c.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getStageHistoriesByLeadId: (leadId) => {
    return get().stageHistories
      .filter(s => s.leadId === leadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  addLead: (leadData) => {
    const now = formatISO(new Date());
    const currentUser = useUserStore.getState().currentUser;
    const newLead: Lead = {
      ...leadData,
      id: `lead-${generateId()}`,
      isCooling: false,
      coolingDays: 0,
      createdAt: now,
      updatedAt: now,
      ownerId: currentUser?.id || 'user-1',
      ownerName: currentUser?.name || '未知',
    };
    set(state => ({ leads: [newLead, ...state.leads] }));
  },

  updateLeadStage: (leadId, newStage) => {
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    const now = formatISO(new Date());
    const currentUser = useUserStore.getState().currentUser;

    const lastHistory = get().stageHistories
      .filter(s => s.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const durationDays = lastHistory
      ? differenceInDays(new Date(now), new Date(lastHistory.createdAt))
      : differenceInDays(new Date(now), new Date(lead.createdAt));

    const newHistory: StageHistory = {
      id: `sh-${generateId()}`,
      leadId,
      fromStage: lead.stage,
      toStage: newStage,
      operatorId: currentUser?.id || 'user-1',
      operatorName: currentUser?.name || '未知',
      createdAt: now,
      durationDays,
    };

    set(state => ({
      leads: state.leads.map(l =>
        l.id === leadId ? { ...l, stage: newStage, updatedAt: now } : l
      ),
      stageHistories: [...state.stageHistories, newHistory],
    }));
  },

  addCommunication: (leadId, type, content) => {
    const now = formatISO(new Date());
    const currentUser = useUserStore.getState().currentUser;

    const newComm: Communication = {
      id: `comm-${generateId()}`,
      leadId,
      type,
      content,
      operatorId: currentUser?.id || 'user-1',
      operatorName: currentUser?.name || '未知',
      createdAt: now,
    };

    set(state => ({
      communications: [newComm, ...state.communications],
      leads: state.leads.map(l =>
        l.id === leadId
          ? { ...l, lastFollowUpAt: now, isCooling: false, coolingDays: 0, updatedAt: now }
          : l
      ),
    }));
  },

  convertToCustomer: (leadId) => {
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead) return;

    const now = formatISO(new Date());
    const newCustomer: Customer = {
      id: `cust-${generateId()}`,
      leadId: lead.id,
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactPhone: lead.contactPhone,
      contactEmail: lead.contactEmail,
      source: lead.source,
      dealValue: lead.value,
      dealDate: now,
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      createdAt: now,
    };

    set(state => ({
      customers: [newCustomer, ...state.customers],
      leads: state.leads.map(l =>
        l.id === leadId ? { ...l, stage: 'won' as LeadStage, updatedAt: now } : l
      ),
    }));
  },

  markAsLost: (leadId, _reason) => {
    const now = formatISO(new Date());
    const currentUser = useUserStore.getState().currentUser;
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead) return;

    const lastHistory = get().stageHistories
      .filter(s => s.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const durationDays = lastHistory
      ? differenceInDays(new Date(now), new Date(lastHistory.createdAt))
      : differenceInDays(new Date(now), new Date(lead.createdAt));

    const newHistory: StageHistory = {
      id: `sh-${generateId()}`,
      leadId,
      fromStage: lead.stage,
      toStage: 'lost',
      operatorId: currentUser?.id || 'user-1',
      operatorName: currentUser?.name || '未知',
      createdAt: now,
      durationDays,
    };

    set(state => ({
      leads: state.leads.map(l =>
        l.id === leadId ? { ...l, stage: 'lost' as LeadStage, updatedAt: now } : l
      ),
      stageHistories: [...state.stageHistories, newHistory],
    }));
  },

  checkCoolingLeads: () => {
    const now = new Date();
    const activeStages: LeadStage[] = ['initial', 'requirement', 'proposal', 'negotiation'];

    set(state => ({
      leads: state.leads.map(lead => {
        if (!activeStages.includes(lead.stage)) {
          return { ...lead, isCooling: false, coolingDays: 0 };
        }
        const daysSinceFollowUp = differenceInDays(now, new Date(lead.lastFollowUpAt));
        if (daysSinceFollowUp >= COOLING_THRESHOLD_DAYS) {
          return { ...lead, isCooling: true, coolingDays: daysSinceFollowUp };
        }
        return { ...lead, isCooling: false, coolingDays: 0 };
      }),
    }));
  },

  getFunnelData: () => {
    const { leads } = get();
    const result: FunnelData[] = [];
    let prevCount = 0;

    STAGE_ORDER.forEach((stage, index) => {
      const stageLeads = leads.filter(l => l.stage === stage);
      const count = stageLeads.length;
      const value = stageLeads.reduce((sum, l) => sum + l.value, 0);
      const conversionRate = index === 0 ? 100 : prevCount > 0 ? (count / prevCount) * 100 : 0;

      result.push({
        stage,
        stageName: STAGE_CONFIG[stage].name,
        count,
        conversionRate: Math.round(conversionRate * 10) / 10,
        value,
      });

      if (stage !== 'lost') {
        prevCount = count;
      }
    });

    return result;
  },

  getStageDurations: () => {
    const { stageHistories } = get();
    const result: StageDuration[] = [];

    const activeStages: LeadStage[] = ['initial', 'requirement', 'proposal', 'negotiation'];

    activeStages.forEach(stage => {
      const histories = stageHistories.filter(s => s.toStage === stage && s.durationDays !== undefined);
      const durations = histories.map(s => s.durationDays as number);

      if (durations.length > 0) {
        const avgDays = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
        const minDays = Math.min(...durations);
        const maxDays = Math.max(...durations);

        result.push({
          stage,
          stageName: STAGE_CONFIG[stage].name,
          avgDays,
          minDays,
          maxDays,
        });
      } else {
        result.push({
          stage,
          stageName: STAGE_CONFIG[stage].name,
          avgDays: 0,
          minDays: 0,
          maxDays: 0,
        });
      }
    });

    return result;
  },

  getDealsByMonth: (months) => {
    const { customers } = get();
    const result: { month: string; value: number; count: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getMonth() + 1}月`;

      const monthDeals = customers.filter(c => {
        const dealDate = new Date(c.dealDate);
        return dealDate.getFullYear() === date.getFullYear() && dealDate.getMonth() === date.getMonth();
      });

      result.push({
        month: monthStr,
        value: monthDeals.reduce((sum, c) => sum + c.dealValue, 0),
        count: monthDeals.length,
      });
    }

    return result;
  },
}));
