/**
 * Esquema unico de Moyes Hub.
 *
 * Decision de diseno: tareas y habitos comparten la tabla `items`. La lista
 * diaria es entonces UNA consulta, no un merge en memoria de dos fuentes,
 * y el Menu de Dopamina puede puntuar ambos con el mismo criterio.
 *
 * Las tablas de entrenos / finanzas / notas se crean ya en la migracion 1
 * aunque la Fase 1A no tenga pantallas para ellas: asi la Fase 1B no
 * necesita migrar datos existentes, solo anadir UI.
 */

export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
    ---------------------------------------------------------------- items
    CREATE TABLE items (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      kind           TEXT    NOT NULL CHECK (kind IN ('task','habit')),
      title          TEXT    NOT NULL,
      notes          TEXT,
      status         TEXT    NOT NULL DEFAULT 'backlog'
                             CHECK (status IN ('backlog','today','doing','done')),
      urgent         INTEGER NOT NULL DEFAULT 0,
      important      INTEGER NOT NULL DEFAULT 0,
      estimate_min   INTEGER NOT NULL DEFAULT 25,
      blocked        INTEGER NOT NULL DEFAULT 0,
      micro_step     TEXT,
      due_date       TEXT,
      habit_rule     TEXT,
      archived       INTEGER NOT NULL DEFAULT 0,
      sort_order     INTEGER NOT NULL DEFAULT 0,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL,
      completed_at   INTEGER
    );
    CREATE INDEX idx_items_status  ON items (archived, status);
    CREATE INDEX idx_items_kind    ON items (archived, kind);
    CREATE INDEX idx_items_due     ON items (due_date);

    ---------------------------------------------------- registro diario
    -- Una fila por item y dia marcado. Sirve para el check de hoy,
    -- para la racha de habitos y para el historico de tareas.
    CREATE TABLE item_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      log_date   TEXT    NOT NULL,
      done       INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      UNIQUE (item_id, log_date)
    );
    CREATE INDEX idx_logs_date ON item_logs (log_date);

    ------------------------------------------------------------ pomodoro
    CREATE TABLE pomodoro_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id     INTEGER REFERENCES items(id) ON DELETE SET NULL,
      kind        TEXT    NOT NULL CHECK (kind IN ('focus','break')),
      planned_min INTEGER NOT NULL,
      started_at  INTEGER NOT NULL,
      ended_at    INTEGER,
      completed   INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_pomo_item ON pomodoro_sessions (item_id);

    ------------------------------------------- captura: nota al yo futuro
    CREATE TABLE captures (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      what        TEXT NOT NULL,
      why         TEXT,
      place       TEXT,
      say         TEXT,
      processed   INTEGER NOT NULL DEFAULT 0,
      item_id     INTEGER REFERENCES items(id) ON DELETE SET NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX idx_captures_processed ON captures (processed, created_at);

    --------------------------------------------------- escala de energia
    CREATE TABLE energy_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      level      INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    ------------------------------------------------------------ ajustes
    CREATE TABLE settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    ------------------------------------------------ FASE 1B: entrenos
    CREATE TABLE exercises (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      muscle     TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE workout_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      notes      TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE workout_sets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      set_index   INTEGER NOT NULL,
      reps        INTEGER NOT NULL,
      weight_kg   REAL    NOT NULL DEFAULT 0,
      rpe         REAL
    );
    CREATE INDEX idx_sets_exercise ON workout_sets (exercise_id);

    ------------------------------------------------ FASE 1B: finanzas
    CREATE TABLE recurring (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      description  TEXT    NOT NULL,
      amount_cents INTEGER NOT NULL,
      kind         TEXT    NOT NULL CHECK (kind IN ('income','expense')),
      day_of_month INTEGER NOT NULL,
      active       INTEGER NOT NULL DEFAULT 1,
      created_at   INTEGER NOT NULL
    );
    CREATE TABLE transactions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      date         TEXT    NOT NULL,
      amount_cents INTEGER NOT NULL,
      kind         TEXT    NOT NULL CHECK (kind IN ('income','expense')),
      category     TEXT,
      description  TEXT,
      recurring_id INTEGER REFERENCES recurring(id) ON DELETE SET NULL,
      created_at   INTEGER NOT NULL
    );
    CREATE INDEX idx_tx_date ON transactions (date);
    CREATE TABLE budgets (
      month       TEXT PRIMARY KEY,
      limit_cents INTEGER NOT NULL,
      alert_pct   INTEGER NOT NULL DEFAULT 80
    );

    -------------------------------------------------- FASE 1B: notas
    CREATE TABLE notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    -- Sintaxis [[algo]] dentro de una nota: cada enlace apunta a una fila
    -- concreta de items / transactions / workout_sessions.
    CREATE TABLE note_links (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id     INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      target_type TEXT    NOT NULL CHECK (target_type IN ('item','transaction','workout')),
      target_id   INTEGER NOT NULL,
      raw_text    TEXT    NOT NULL,
      line_index  INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_note_links_note   ON note_links (note_id);
    CREATE INDEX idx_note_links_target ON note_links (target_type, target_id);
    `,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
