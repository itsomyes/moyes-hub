import { getDatabase } from '../database';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getNumberSetting(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getBoolSetting(key: string, fallback: boolean): Promise<boolean> {
  const raw = await getSetting(key);
  if (raw === null) return fallback;
  return raw === '1';
}

export const SETTINGS_KEYS = {
  focusMin: 'pomodoro.focus_min',
  breakMin: 'pomodoro.break_min',
  longBreakMin: 'pomodoro.long_break_min',
  persistentCapture: 'capture.persistent_notification',
} as const;
