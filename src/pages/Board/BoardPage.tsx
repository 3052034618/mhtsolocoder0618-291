import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { KanbanColumn } from '@/components/lead/KanbanColumn';
import { LeadCard } from '@/components/lead/LeadCard';
import { NewLeadModal } from '@/components/lead/NewLeadModal';
import { LeadStage, STAGE_ORDER, STAGE_CONFIG, SOURCE_CONFIG } from '@/types';
import { Lead } from '@/types';

export function BoardPage() {
  const navigate = useNavigate();
  const leads = useLeadStore(state => state.leads);
  const getLeadsByStage = useLeadStore(state => state.getLeadsByStage);
  const updateLeadStage = useLeadStore(state => state.updateLeadStage);
  const checkCoolingLeads = useLeadStore(state => state.checkCoolingLeads);
  const searchQuery = useLeadStore(state => state.searchQuery);
  const setSearchQuery = useLeadStore(state => state.setSearchQuery);
  const selectedSource = useLeadStore(state => state.selectedSource);
  const setSelectedSource = useLeadStore(state => state.setSelectedSource);
  const selectedOwner = useLeadStore(state => state.selectedOwner);
  const setSelectedOwner = useLeadStore(state => state.setSelectedOwner);
  const getFilteredLeads = useLeadStore(state => state.getFilteredLeads);

  const users = useUserStore(state => state.users);
  const notifyStageChange = useNotificationStore(state => state.notifyStageChange);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    checkCoolingLeads();
  }, [checkCoolingLeads]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find(l => l.id === active.id);
    if (lead) {
      setActiveLead(lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    let targetStage: LeadStage | null = null;

    if (STAGE_ORDER.includes(over.id as LeadStage)) {
      targetStage = over.id as LeadStage;
    } else {
      const overLead = leads.find(l => l.id === over.id);
      if (overLead) {
        targetStage = overLead.stage;
      }
    }

    if (targetStage && targetStage !== lead.stage) {
      updateLeadStage(leadId, targetStage);
      const updatedLead = { ...lead, stage: targetStage };
      notifyStageChange(leadId, lead.companyName, targetStage, lead.value);
    }
  };

  const handleLeadClick = (leadId: string) => {
    navigate(`/lead/${leadId}`);
  };

  const displayStages: LeadStage[] = ['initial', 'requirement', 'proposal', 'negotiation', 'won', 'lost'];

  const filteredLeads = getFilteredLeads();
  const totalValue = filteredLeads.reduce((sum, l) => sum + l.value, 0);
  const totalCount = filteredLeads.length;

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">线索看板</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              共 {totalCount} 条线索 · 总金额 ¥{totalValue.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索线索..."
                className="input pl-9 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`btn btn-secondary ${showFilter ? 'bg-accent-50 border-accent-200 text-accent-600' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建线索
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">来源：</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSource(null)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedSource === null
                      ? 'bg-accent-100 text-accent-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部
                </button>
                {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSource(selectedSource === key ? null : key)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedSource === key
                        ? config.bgColor + ' ' + config.color
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">负责人：</span>
              <select
                value={selectedOwner || ''}
                onChange={(e) => setSelectedOwner(e.target.value || null)}
                className="input w-40"
              >
                <option value="">全部</option>
                {users.filter(u => u.role === 'sales').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-x-auto p-6 scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 h-full min-w-max">
            {displayStages.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={getLeadsByStage(stage)}
                onLeadClick={handleLeadClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="opacity-90 scale-105 rotate-1">
                <LeadCard lead={activeLead} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <NewLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
