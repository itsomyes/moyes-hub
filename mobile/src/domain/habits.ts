import { weekdayOf } from './dates';

/**
 * habit_rule se guarda como texto para poder crecer sin migrar:
 *   'daily'          -> todos los dias
 *   'weekdays'       -> lunes a viernes
 *   'days:1,3,5'     -> dias concretos (0 = domingo)
 */
export type HabitRule = string;

export const HABIT_RULE_OPTIONS: { value: HabitRule; label: string }[] = [
  { value: 'daily', label: 'Todos los dias' },
  { value: 'weekdays', label: 'Lunes a viernes' },
  { value: 'days:1,3,5', label: 'Lun / Mie / Vie' },
  { value: 'days:2,4,6', label: 'Mar / Jue / Sab' },
];

export function habitAppliesOn(rule: HabitRule | null, dateKey: string): boolean {
  if (!rule || rule === 'daily') return true;
  const day = weekdayOf(dateKey);
  if (rule === 'weekdays') return day >= 1 && day <= 5;
  if (rule.startsWith('days:')) {
    return rule
      .slice(5)
      .split(',')
      .map((d) => Number(d.trim()))
      .includes(day);
  }
  return true;
}

export function habitRuleLabel(rule: HabitRule | null): string {
  if (!rule) return 'Todos los dias';
  return HABIT_RULE_OPTIONS.find((o) => o.value === rule)?.label ?? rule;
}
