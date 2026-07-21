import { AgendaItem } from '../types';

export function isOverdueUrgent(item: AgendaItem): boolean {
  if (item.priority !== 'urgent') return false;
  if (item.completed) return false;

  const now = new Date();
  if (!item.time) return false;
  const [hours, minutes] = item.time.split(':').map(Number);
  const taskTime = new Date();
  taskTime.setHours(hours, minutes, 0, 0);

  return now > taskTime;
}
