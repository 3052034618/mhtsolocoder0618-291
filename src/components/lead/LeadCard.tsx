import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Lead, SOURCE_CONFIG, STAGE_CONFIG } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { Clock, User } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const sourceConfig = SOURCE_CONFIG[lead.source];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`card card-hover p-4 cursor-grab active:cursor-grabbing ${
        lead.isCooling ? 'opacity-75 grayscale-[30%]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-slate-900 text-sm truncate flex-1 mr-2">
          {lead.companyName}
        </h4>
        {lead.isCooling && (
          <span className="badge bg-cooling-100 text-cooling-600 flex-shrink-0">
            <Clock className="w-3 h-3 mr-1" />
            冷却{lead.coolingDays}天
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`badge ${sourceConfig.bgColor} ${sourceConfig.color}`}>
          {sourceConfig.name}
        </span>
        <span className="text-sm font-medium text-accent-600">
          {formatCurrency(lead.value)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          <span>{lead.ownerName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(lead.lastFollowUpAt)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <span className={`text-xs font-medium ${STAGE_CONFIG[lead.stage].color}`}>
          {STAGE_CONFIG[lead.stage].name}
        </span>
      </div>
    </div>
  );
}
