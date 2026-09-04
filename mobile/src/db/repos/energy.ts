import { getDatabase } from '../database';

export async function logEnergy(level: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO energy_logs (level, created_at) VALUES (?, ?)', [level, Date.now()]);
}

export async function lastEnergy(): Promise<number | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ level: number }>(
    'SELECT level FROM energy_logs ORDER BY created_at DESC LIMIT 1',
  );
  return row?.level ?? null;
}
