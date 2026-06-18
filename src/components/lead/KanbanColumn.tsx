import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage, STAGE_CONFIG } from '@/types';
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
}

export function KanbanColumn({ stage, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const config = STAGE_CONFIG[stage];
  const leadIds = leads.map(l => l.id);

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            stage === 'won' ? 'bg-success-500' :
            stage === 'lost' ? 'bg-cooling-500' :
            'bg-accent-500'
          }`} />
          <h3 className="font-semibold text-slate-800 text-sm">{config.name}</h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-3 space-y-3 transition-colors duration-200 ${
          isOver ? 'bg-accent-50 border-2 border-dashed border-accent-300' : 'bg-slate-100/50'
        }`}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            暂无线索
          </div>
        )}
      </div>
    </div>
  );
}
