import { getDatabase } from '../database';
import type { PomodoroSession } from '../types';

export async function startSession(
  kind: 'focus' | 'break',
  plannedMin: number,
  itemId: number | null,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO pomodoro_sessions (item_id, kind, planned_min, started_at) VALUES (?, ?, ?, ?)`,
    [itemId, kind, plannedMin, Date.now()],
  );
  return result.lastInsertRowId;
}

export async function endSession(id: number, completed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE pomodoro_sessions SET ended_at = ?, completed = ? WHERE id = ?', [
    Date.now(),
    completed ? 1 : 0,
    id,
  ]);
}

export async function focusStats(): Promise<{ todayCount: number; todayMinutes: number; total: number }> {
  const db = await getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const today = await db.getFirstAsync<{ n: number; mins: number | null }>(
    `SELECT COUNT(*) AS n, SUM(planned_min) AS mins
       FROM pomodoro_sessions
      WHERE kind = 'focus' AND completed = 1 AND started_at >= ?`,
    [startOfDay.getTime()],
  );
  const total = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM pomodoro_sessions WHERE kind = 'focus' AND completed = 1`,
  );

  return {
    todayCount: today?.n ?? 0,
    todayMinutes: today?.mins ?? 0,
    total: total?.n ?? 0,
  };
}

export async function recentSessions(limit = 20): Promise<PomodoroSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<PomodoroSession>(
    'SELECT * FROM pomodoro_sessions ORDER BY started_at DESC LIMIT ?',
    [limit],
  );
}
