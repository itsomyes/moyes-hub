export type ItemKind = 'task' | 'habit';
export type ItemStatus = 'backlog' | 'today' | 'doing' | 'done';

export interface Item {
  id: number;
  kind: ItemKind;
  title: string;
  notes: string | null;
  status: ItemStatus;
  urgent: number;
  important: number;
  estimate_min: number;
  blocked: number;
  micro_step: string | null;
  due_date: string | null;
  habit_rule: string | null;
  archived: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

/** Item + estado del dia consultado (viene del LEFT JOIN con item_logs). */
export interface DailyItem extends Item {
  done_today: number;
  streak: number;
}

export interface NewItem {
  kind: ItemKind;
  title: string;
  notes?: string | null;
  status?: ItemStatus;
  urgent?: boolean;
  important?: boolean;
  estimate_min?: number;
  blocked?: boolean;
  micro_step?: string | null;
  due_date?: string | null;
  habit_rule?: string | null;
}

export interface Capture {
  id: number;
  what: string;
  why: string | null;
  place: string | null;
  say: string | null;
  processed: number;
  item_id: number | null;
  created_at: number;
}

export interface PomodoroSession {
  id: number;
  item_id: number | null;
  kind: 'focus' | 'break';
  planned_min: number;
  started_at: number;
  ended_at: number | null;
  completed: number;
}

/** Cuadrante Eisenhower derivado de urgent/important. */
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'drop';
