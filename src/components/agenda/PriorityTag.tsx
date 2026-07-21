import { AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  priority?: 'urgent' | 'important' | 'normal';
}

export default function PriorityTag({ priority }: Props) {
  if (!priority || priority === 'normal') return null;

  if (priority === 'urgent') {
    return (
      <div className="flex items-center gap-1 bg-[#FF4D4D]/15 text-[#FF4D4D] rounded-full px-2 py-[3px]">
        <AlertCircle className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-wide">Urgente</span>
      </div>
    );
  }

  if (priority === 'important') {
    return (
      <div className="flex items-center gap-1 bg-[#FFD166]/15 text-[#FFD166] rounded-full px-2 py-[3px]">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-wide">Importante</span>
      </div>
    );
  }

  return null;
}
