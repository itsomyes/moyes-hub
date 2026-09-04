import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';

const DB_NAME = 'moyeshub.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Aplica las migraciones pendientes usando PRAGMA user_version como marcador.
 * Cada migracion corre dentro de su propia transaccion: si una falla, la base
 * se queda en la version anterior en vez de a medias.
 */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
    });
    // PRAGMA no admite parametros vinculados; version es un literal del codigo.
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }
}

/** Abre (una sola vez) la base y garantiza que esta migrada. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })().catch((error) => {
      // No cachear una promesa fallida: el siguiente intento debe reintentar.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/** Solo para pruebas manuales / reset desde Ajustes. */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.closeAsync();
  dbPromise = null;
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
