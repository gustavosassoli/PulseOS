import { AgendaItem } from '../types';

const PRIORITY_WEIGHT = {
  urgent: 0,
  important: 1,
  normal: 2,
};

export function sortAgendaItems(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort((a, b) => {
    // 1º critério: horário
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }
    // 2º critério: prioridade (mesmo horário)
    return PRIORITY_WEIGHT[a.priority ?? 'normal'] - PRIORITY_WEIGHT[b.priority ?? 'normal'];
  });
}
