import { getDatabase } from '../database';
import type { Capture } from '../types';

export interface NewCapture {
  what: string;
  why?: string;
  place?: string;
  say?: string;
}

export async function createCapture(input: NewCapture): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO captures (what, why, place, say, created_at) VALUES (?, ?, ?, ?, ?)`,
    [input.what.trim(), input.why?.trim() || null, input.place?.trim() || null, input.say?.trim() || null, Date.now()],
  );
  return result.lastInsertRowId;
}

export async function listCaptures(includeProcessed = false): Promise<Capture[]> {
  const db = await getDatabase();
  return db.getAllAsync<Capture>(
    includeProcessed
      ? 'SELECT * FROM captures ORDER BY created_at DESC'
      : 'SELECT * FROM captures WHERE processed = 0 ORDER BY created_at DESC',
  );
}

export async function countPending(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM captures WHERE processed = 0',
  );
  return row?.n ?? 0;
}

export async function markProcessed(id: number, itemId: number | null = null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE captures SET processed = 1, item_id = ? WHERE id = ?', [itemId, id]);
}

export async function deleteCapture(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM captures WHERE id = ?', [id]);
}
