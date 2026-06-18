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
import { useNotificationStore } from './useNotificationStore';
import { useGoalStore } from './useGoalStore';

const COOLING_THRESHOLD_DAYS = 7;
const STORAGE_KEY = 'crm_lead_state_v1';

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
  getFunnelData: (options?: { startDate?: string; endDate?: string }) => FunnelData[];
  getStageDurations: (options?: { startDate?: string; endDate?: string }) => StageDuration[];
  getDealsByMonth: (months: number) => { month: string; value: number; count: number }[];
  getDealCycleDistribution: (options?: { startDate?: string; endDate?: string }) => { name: string; min: number; max: number; count: number; value: number }[];
  getAverageDealCycle: (options?: { startDate?: string; endDate?: string }) => { avgDays: number; medianDays: number; totalCount: number };
  resetToMock: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        leads: parsed.leads ?? mockLeads,
        communications: parsed.communications ?? mockCommunications,
        stageHistories: parsed.stageHistories ?? mockStageHistories,
        customers: parsed.customers ?? mockCustomers,
      };
    }
  } catch {
    console.warn('Failed to load lead state from localStorage, using mock data');
  }
  return {
    leads: mockLeads,
    communications: mockCommunications,
    stageHistories: mockStageHistories,
    customers: mockCustomers,
  };
};

const initialData = loadInitialState();

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: initialData.leads,
  communications: initialData.communications,
  stageHistories: initialData.stageHistories,
  customers: initialData.customers,
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
    const { customers, leads } = get();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const alreadyConverted = customers.some(c => c.leadId === leadId);
    if (alreadyConverted) return;

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

    const lastHistory = get().stageHistories
      .filter(s => s.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const durationDays = lastHistory
      ? differenceInDays(new Date(now), new Date(lastHistory.createdAt))
      : differenceInDays(new Date(now), new Date(lead.createdAt));

    const currentUser = useUserStore.getState().currentUser;

    const newHistory: StageHistory = {
      id: `sh-${generateId()}`,
      leadId,
      fromStage: lead.stage,
      toStage: 'won',
      operatorId: currentUser?.id || 'user-1',
      operatorName: currentUser?.name || '未知',
      createdAt: now,
      durationDays,
    };

    set(state => ({
      customers: [newCustomer, ...state.customers],
      stageHistories: [...state.stageHistories, newHistory],
      leads: state.leads.map(l =>
        l.id === leadId ? { ...l, stage: 'won' as LeadStage, updatedAt: now } : l
      ),
    }));

    useGoalStore.getState().addDealAmount(lead.ownerId, now, lead.value);
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
    const notifyCooling = useNotificationStore.getState().notifyCooling;

    const newlyCoolingLeads: { leadId: string; companyName: string; days: number; ownerId: string; ownerName: string }[] = [];

    set(state => ({
      leads: state.leads.map(lead => {
        if (!activeStages.includes(lead.stage)) {
          return { ...lead, isCooling: false, coolingDays: 0 };
        }
        const daysSinceFollowUp = differenceInDays(now, new Date(lead.lastFollowUpAt));
        if (daysSinceFollowUp >= COOLING_THRESHOLD_DAYS) {
          if (!lead.isCooling) {
            newlyCoolingLeads.push({
              leadId: lead.id,
              companyName: lead.companyName,
              days: daysSinceFollowUp,
              ownerId: lead.ownerId,
              ownerName: lead.ownerName,
            });
          }
          return { ...lead, isCooling: true, coolingDays: daysSinceFollowUp };
        }
        return { ...lead, isCooling: false, coolingDays: 0 };
      }),
    }));

    newlyCoolingLeads.forEach(item => {
      notifyCooling(item.leadId, item.companyName, item.days, item.ownerId, item.ownerName);
    });
  },

  getFunnelData: (options?: { startDate?: string; endDate?: string }) => {
    const { leads } = get();
    const result: FunnelData[] = [];
    let prevCount = 0;

    const startDate = options?.startDate ? new Date(options.startDate) : null;
    const endDate = options?.endDate ? new Date(options.endDate) : null;

    const filteredLeads = leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
      return true;
    });

    STAGE_ORDER.forEach((stage, index) => {
      const stageLeads = filteredLeads.filter(l => l.stage === stage);
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

  getStageDurations: (options?: { startDate?: string; endDate?: string }) => {
    const { stageHistories, leads } = get();
    const result: StageDuration[] = [];
    const activeStages: LeadStage[] = ['initial', 'requirement', 'proposal', 'negotiation'];
    const now = new Date();
    const endDate = options?.endDate ? new Date(options.endDate) : now;
    const startDate = options?.startDate ? new Date(options.startDate) : null;

    const getLeadStageDurations = (leadId: string): Record<string, number> => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return {};

      const histories = stageHistories
        .filter(s => s.leadId === leadId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const durations: Record<string, number> = {};
      let currentStage: LeadStage = 'initial';
      let currentEnterTime = new Date(lead.createdAt);

      histories.forEach(history => {
        const exitTime = new Date(history.createdAt);
        let duration = differenceInDays(exitTime, currentEnterTime);
        if (startDate) {
          const effectiveEnter = currentEnterTime > startDate ? currentEnterTime : startDate;
          duration = differenceInDays(exitTime, effectiveEnter);
        }
        if (duration < 0) duration = 0;

        if (!durations[currentStage]) durations[currentStage] = 0;
        durations[currentStage] += duration;

        currentStage = history.toStage as LeadStage;
        currentEnterTime = exitTime;
      });

      if (activeStages.includes(currentStage)) {
        const exitTime = endDate < now ? endDate : now;
        let duration = differenceInDays(exitTime, currentEnterTime);
        if (startDate) {
          const effectiveEnter = currentEnterTime > startDate ? currentEnterTime : startDate;
          duration = differenceInDays(exitTime, effectiveEnter);
        }
        if (duration < 0) duration = 0;
        if (!durations[currentStage]) durations[currentStage] = 0;
        durations[currentStage] += duration;
      }

      return durations;
    };

    activeStages.forEach(stage => {
      const allDurations: number[] = [];

      leads.forEach(lead => {
        if (startDate && new Date(lead.createdAt) > endDate) return;
        const leadDurations = getLeadStageDurations(lead.id);
        if (leadDurations[stage] !== undefined && leadDurations[stage] >= 0) {
          allDurations.push(leadDurations[stage]);
        }
      });

      if (allDurations.length > 0) {
        const avgDays = Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length * 10) / 10;
        const minDays = Math.min(...allDurations);
        const maxDays = Math.max(...allDurations);

        result.push({ stage, stageName: STAGE_CONFIG[stage].name, avgDays, minDays, maxDays });
      } else {
        result.push({ stage, stageName: STAGE_CONFIG[stage].name, avgDays: 0, minDays: 0, maxDays: 0 });
      }
    });

    return result;
  },

  getDealCycleDistribution: (options?: { startDate?: string; endDate?: string }) => {
    const { leads, stageHistories, customers } = get();
    const buckets = [
      { name: '0-7天', min: 0, max: 7, count: 0, value: 0 },
      { name: '8-14天', min: 8, max: 14, count: 0, value: 0 },
      { name: '15-30天', min: 15, max: 30, count: 0, value: 0 },
      { name: '31-60天', min: 31, max: 60, count: 0, value: 0 },
      { name: '61-90天', min: 61, max: 90, count: 0, value: 0 },
      { name: '90天以上', min: 91, max: Infinity, count: 0, value: 0 },
    ];

    const dealInfos: { dealDate: Date; leadCreatedAt: Date; value: number }[] = [];

    customers.forEach(customer => {
      const lead = leads.find(l => l.id === customer.leadId);
      if (!lead) return;
      dealInfos.push({
        dealDate: new Date(customer.dealDate),
        leadCreatedAt: new Date(lead.createdAt),
        value: customer.dealValue,
      });
    });

    stageHistories
      .filter(s => s.toStage === 'won')
      .forEach(sh => {
        const hasCustomer = customers.some(c => c.leadId === sh.leadId);
        if (hasCustomer) return;
        const lead = leads.find(l => l.id === sh.leadId);
        if (!lead) return;
        dealInfos.push({
          dealDate: new Date(sh.createdAt),
          leadCreatedAt: new Date(lead.createdAt),
          value: lead.value,
        });
      });

    const startDate = options?.startDate ? new Date(options.startDate) : null;
    const endDate = options?.endDate ? new Date(options.endDate) : null;

    dealInfos.forEach(info => {
      if (startDate && info.dealDate < startDate) return;
      if (endDate && info.dealDate > endDate) return;

      const totalDays = differenceInDays(info.dealDate, info.leadCreatedAt);
      const bucket = buckets.find(b => totalDays >= b.min && totalDays <= b.max);
      if (bucket) {
        bucket.count++;
        bucket.value += info.value;
      }
    });

    return buckets;
  },

  getAverageDealCycle: (options?: { startDate?: string; endDate?: string }) => {
    const { leads, stageHistories, customers } = get();
    const cycles: number[] = [];

    const dealInfos: { dealDate: Date; leadCreatedAt: Date }[] = [];

    customers.forEach(customer => {
      const lead = leads.find(l => l.id === customer.leadId);
      if (!lead) return;
      dealInfos.push({
        dealDate: new Date(customer.dealDate),
        leadCreatedAt: new Date(lead.createdAt),
      });
    });

    stageHistories
      .filter(s => s.toStage === 'won')
      .forEach(sh => {
        const hasCustomer = customers.some(c => c.leadId === sh.leadId);
        if (hasCustomer) return;
        const lead = leads.find(l => l.id === sh.leadId);
        if (!lead) return;
        dealInfos.push({
          dealDate: new Date(sh.createdAt),
          leadCreatedAt: new Date(lead.createdAt),
        });
      });

    const startDate = options?.startDate ? new Date(options.startDate) : null;
    const endDate = options?.endDate ? new Date(options.endDate) : null;

    dealInfos.forEach(info => {
      if (startDate && info.dealDate < startDate) return;
      if (endDate && info.dealDate > endDate) return;
      const days = differenceInDays(info.dealDate, info.leadCreatedAt);
      if (days > 0) cycles.push(days);
    });

    if (cycles.length === 0) return { avgDays: 0, medianDays: 0, totalCount: 0 };

    const sorted = [...cycles].sort((a, b) => a - b);
    const avgDays = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length * 10) / 10;
    const medianDays = sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 * 10) / 10
      : sorted[Math.floor(sorted.length / 2)];

    return { avgDays, medianDays, totalCount: sorted.length };
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

  resetToMock: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      leads: mockLeads,
      communications: mockCommunications,
      stageHistories: mockStageHistories,
      customers: mockCustomers,
    });
  },
}));

useLeadStore.subscribe((state, prevState) => {
  try {
    const changed =
      state.leads !== prevState.leads ||
      state.communications !== prevState.communications ||
      state.stageHistories !== prevState.stageHistories ||
      state.customers !== prevState.customers;

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        leads: state.leads,
        communications: state.communications,
        stageHistories: state.stageHistories,
        customers: state.customers,
      }));
    }
  } catch {
    console.warn('Failed to save lead state to localStorage');
  }
});
