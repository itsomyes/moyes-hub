import { getDatabase } from '../database';
import type { DailyItem, Item, ItemStatus, NewItem } from '../types';
import { todayKey } from '../../domain/dates';
import { habitAppliesOn } from '../../domain/habits';

const bit = (value: boolean | undefined) => (value ? 1 : 0);

export async function createItem(input: NewItem): Promise<number> {
  const db = await getDatabase();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO items
       (kind, title, notes, status, urgent, important, estimate_min, blocked,
        micro_step, due_date, habit_rule, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.kind,
      input.title.trim(),
      input.notes ?? null,
      input.status ?? (input.kind === 'habit' ? 'today' : 'backlog'),
      bit(input.urgent),
      bit(input.important),
      input.estimate_min ?? 25,
      bit(input.blocked),
      input.micro_step ?? null,
      input.due_date ?? null,
      input.kind === 'habit' ? input.habit_rule ?? 'daily' : null,
      now,
      now,
      now,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateItem(id: number, patch: Partial<Item>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const allowed: (keyof Item)[] = [
    'title', 'notes', 'status', 'urgent', 'important', 'estimate_min',
    'blocked', 'micro_step', 'due_date', 'habit_rule', 'archived', 'sort_order',
    'completed_at',
  ];

  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    fields.push(`${key} = ?`);
    values.push(patch[key] as string | number | null);
  }
  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(Date.now(), id);
  await db.runAsync(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
}

export async function getItem(id: number): Promise<Item | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Item>('SELECT * FROM items WHERE id = ?', [id]);
}

/**
 * Lista diaria unica: tareas y habitos mezclados con su check del dia.
 * La racha se calcula en SQL con una ventana de 60 dias para no traer
 * todo el historico al hilo de JS.
 */
export async function getDailyItems(dateKey = todayKey()): Promise<DailyItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyItem>(
    `SELECT i.*,
            COALESCE(l.done, 0) AS done_today,
            0                   AS streak
       FROM items i
       LEFT JOIN item_logs l ON l.item_id = i.id AND l.log_date = ?
      WHERE i.archived = 0
        AND (
              i.kind = 'habit'
           OR i.status IN ('today', 'doing')
           OR (i.due_date IS NOT NULL AND i.due_date <= ?)
           OR l.done = 1
        )
      ORDER BY done_today ASC,
               (i.urgent + i.important) DESC,
               i.sort_order ASC,
               i.created_at ASC`,
    [dateKey, dateKey],
  );

  const applicable = rows.filter(
    (row) => row.kind !== 'habit' || row.done_today === 1 || habitAppliesOn(row.habit_rule, dateKey),
  );

  return Promise.all(
    applicable.map(async (row) => ({
      ...row,
      streak: row.kind === 'habit' ? await getStreak(row.id, dateKey) : 0,
    })),
  );
}

/** Dias consecutivos marcados hasta dateKey incluido. */
export async function getStreak(itemId: number, dateKey: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ log_date: string }>(
    `SELECT log_date FROM item_logs
      WHERE item_id = ? AND done = 1 AND log_date <= ?
      ORDER BY log_date DESC LIMIT 400`,
    [itemId, dateKey],
  );

  let streak = 0;
  const cursor = new Date(`${dateKey}T00:00:00`);
  const dates = new Set(rows.map((r) => r.log_date));

  // Si hoy aun no esta marcado, la racha se mide desde ayer.
  if (!dates.has(dateKey)) cursor.setDate(cursor.getDate() - 1);

  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Marca / desmarca el check del dia. Devuelve el nuevo estado. */
export async function toggleDone(item: Item, dateKey = todayKey()): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ done: number }>(
    'SELECT done FROM item_logs WHERE item_id = ? AND log_date = ?',
    [item.id, dateKey],
  );
  const nextDone = existing?.done === 1 ? 0 : 1;

  await db.runAsync(
    `INSERT INTO item_logs (item_id, log_date, done, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, log_date) DO UPDATE SET done = excluded.done`,
    [item.id, dateKey, nextDone, Date.now()],
  );

  // Una tarea completada sale del tablero; un habito sigue vivo manana.
  if (item.kind === 'task') {
    await updateItem(item.id, {
      status: nextDone ? 'done' : 'today',
      completed_at: nextDone ? Date.now() : null,
    });
  }
  return nextDone === 1;
}

export async function getBoardItems(): Promise<Item[]> {
  const db = await getDatabase();
  return db.getAllAsync<Item>(
    `SELECT * FROM items
      WHERE archived = 0 AND kind = 'task'
      ORDER BY sort_order ASC, created_at DESC`,
  );
}

export async function setStatus(id: number, status: ItemStatus): Promise<void> {
  await updateItem(id, {
    status,
    completed_at: status === 'done' ? Date.now() : null,
  });
}

export async function getHabits(): Promise<Item[]> {
  const db = await getDatabase();
  return db.getAllAsync<Item>(
    `SELECT * FROM items WHERE archived = 0 AND kind = 'habit' ORDER BY created_at ASC`,
  );
}

/** Candidatos del Menu de Dopamina: pendientes de verdad, no lo de hoy ya hecho. */
export async function getOpenItems(dateKey = todayKey()): Promise<Item[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Item>(
    `SELECT i.* FROM items i
       LEFT JOIN item_logs l ON l.item_id = i.id AND l.log_date = ?
      WHERE i.archived = 0
        AND i.status != 'done'
        AND COALESCE(l.done, 0) = 0`,
    [dateKey],
  );
  return rows.filter((row) => row.kind !== 'habit' || habitAppliesOn(row.habit_rule, dateKey));
}

export async function countsForDate(dateKey = todayKey()): Promise<{ total: number; done: number }> {
  const items = await getDailyItems(dateKey);
  return {
    total: items.length,
    done: items.filter((i) => i.done_today === 1).length,
  };
}
