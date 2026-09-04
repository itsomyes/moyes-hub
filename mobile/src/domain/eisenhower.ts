import type { Item, Quadrant } from '../db/types';

export const QUADRANTS: { key: Quadrant; label: string; hint: string }[] = [
  { key: 'do',       label: 'Hazlo ya',    hint: 'Urgente + importante' },
  { key: 'schedule', label: 'Agendalo',    hint: 'Importante, no urgente' },
  { key: 'delegate', label: 'Despachalo',  hint: 'Urgente, no importante' },
  { key: 'drop',     label: 'Bordealo',    hint: 'Ni urgente ni importante' },
];

export function quadrantOf(item: Pick<Item, 'urgent' | 'important'>): Quadrant {
  if (item.urgent && item.important) return 'do';
  if (!item.urgent && item.important) return 'schedule';
  if (item.urgent && !item.important) return 'delegate';
  return 'drop';
}

/** Peso para ordenar: cuanto mas alto, antes va en cualquier lista. */
export function quadrantWeight(item: Pick<Item, 'urgent' | 'important'>): number {
  switch (quadrantOf(item)) {
    case 'do': return 3;
    case 'schedule': return 2;
    case 'delegate': return 1;
    default: return 0;
  }
}

export function quadrantLabel(quadrant: Quadrant): string {
  return QUADRANTS.find((q) => q.key === quadrant)?.label ?? '';
}
