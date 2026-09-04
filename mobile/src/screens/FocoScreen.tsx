import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { colors, font, radius, space } from '../theme';
import { Body, Button, Chip, H1, Label, Muted, Row } from '../components/ui';
import { getOpenItems, toggleDone, getItem } from '../db/repos/items';
import { endSession, focusStats, startSession } from '../db/repos/pomodoro';
import { getNumberSetting, SETTINGS_KEYS } from '../db/repos/settings';
import type { Item } from '../db/types';
import { formatClock } from '../domain/dates';
import { useNavigation } from '../navigation/NavigationContext';

type Phase = 'idle' | 'focus' | 'break';

/**
 * Pomodoro. El reloj se calcula contra Date.now() y no contando ticks:
 * si Android congela el JS con la pantalla apagada, al volver el tiempo
 * restante sigue siendo el correcto en vez de haberse quedado parado.
 */
export function FocoScreen() {
  const { revision, refresh, focusItemId, setFocusItemId } = useNavigation();

  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState<Phase>('idle');
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [candidates, setCandidates] = useState<Item[]>([]);
  const [stats, setStats] = useState({ todayCount: 0, todayMinutes: 0, total: 0 });
  const finishing = useRef(false);

  const loadStats = useCallback(async () => setStats(await focusStats()), []);

  useEffect(() => {
    (async () => {
      setFocusMin(await getNumberSetting(SETTINGS_KEYS.focusMin, 25));
      setBreakMin(await getNumberSetting(SETTINGS_KEYS.breakMin, 5));
      setCandidates(await getOpenItems());
      await loadStats();
    })();
  }, [loadStats, revision]);

  // Item preseleccionado al llegar desde Hoy o desde el Menu de Dopamina.
  useEffect(() => {
    if (focusItemId === null) return;
    getItem(focusItemId).then((found) => {
      if (found) setItem(found);
      setFocusItemId(null);
    });
  }, [focusItemId, setFocusItemId]);

  const finish = useCallback(
    async (completed: boolean) => {
      if (finishing.current) return;
      finishing.current = true;
      try {
        if (sessionId !== null) await endSession(sessionId, completed);
        if (completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        setSessionId(null);
        setEndsAt(null);
        setRemaining(0);
        setPhase('idle');
        deactivateKeepAwake().catch(() => {});
        await loadStats();
      } finally {
        finishing.current = false;
      }
    },
    [sessionId, loadStats],
  );

  // Tick de UI. La verdad esta en endsAt, esto solo repinta.
  useEffect(() => {
    if (endsAt === null) return undefined;
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) finish(true);
    };
    tick();
    const id = setInterval(tick, 500);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [endsAt, finish]);

  async function start(nextPhase: 'focus' | 'break') {
    const minutes = nextPhase === 'focus' ? focusMin : breakMin;
    const id = await startSession(nextPhase, minutes, nextPhase === 'focus' ? item?.id ?? null : null);
    setSessionId(id);
    setPhase(nextPhase);
    setEndsAt(Date.now() + minutes * 60_000);
    activateKeepAwakeAsync().catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  const running = phase !== 'idle';
  const totalSeconds = (phase === 'break' ? breakMin : focusMin) * 60;
  const progress = running && totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.lg }}>
      <View>
        <Label>POMODORO</Label>
        <H1 style={{ marginTop: space.xs }}>Foco</H1>
      </View>

      <View style={styles.clockCard}>
        <Text style={[font.tiny, { marginBottom: space.sm }]}>
          {phase === 'break' ? 'DESCANSO' : phase === 'focus' ? 'EN FOCO' : 'PARADO'}
        </Text>
        <Text style={styles.clock}>{formatClock(running ? remaining : focusMin * 60)}</Text>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>

        {item ? (
          <View style={styles.itemBox}>
            <Text style={font.tiny}>TRABAJANDO EN</Text>
            <Body style={{ marginTop: 2 }}>{item.title}</Body>
            {item.micro_step ? (
              <Text style={{ color: colors.accent, fontSize: 13, marginTop: space.sm }}>
                Paso 1: {item.micro_step}
              </Text>
            ) : null}
          </View>
        ) : (
          <Muted style={{ marginTop: space.md, textAlign: 'center' }}>
            Sin tarea asignada. El reloj corre igual.
          </Muted>
        )}

        {!running ? (
          <View style={{ gap: space.sm, marginTop: space.lg, width: '100%' }}>
            <Button title={`Foco ${focusMin} min`} onPress={() => start('focus')} />
            <Button title={`Descanso ${breakMin} min`} variant="secondary" onPress={() => start('break')} />
          </View>
        ) : (
          <View style={{ gap: space.sm, marginTop: space.lg, width: '100%' }}>
            {phase === 'focus' && item ? (
              <Button
                title="Hecho, cierra la tarea"
                onPress={async () => {
                  await toggleDone(item);
                  await finish(true);
                  setItem(null);
                  refresh();
                }}
              />
            ) : null}
            <Button title="Abortar" variant="danger" onPress={() => finish(false)} />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Label>Sesiones cerradas</Label>
        <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
          <Stat value={String(stats.todayCount)} label="HOY" />
          <Stat value={`${stats.todayMinutes}m`} label="MINUTOS HOY" />
          <Stat value={String(stats.total)} label="TOTAL" />
        </Row>
      </View>

      {!running ? (
        <View style={styles.card}>
          <Label>A que le apuntas</Label>
          <Muted style={{ marginTop: space.xs, marginBottom: space.md }}>
            Una sola tarea. Elegir dos es no elegir.
          </Muted>
          <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
            <Chip label="Ninguna" active={item === null} onPress={() => setItem(null)} />
            {candidates.slice(0, 12).map((candidate) => (
              <Chip
                key={candidate.id}
                label={candidate.title.length > 26 ? `${candidate.title.slice(0, 24)}…` : candidate.title}
                active={item?.id === candidate.id}
                onPress={() => setItem(candidate)}
              />
            ))}
          </Row>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Pressable disabled style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[font.h1, { color: colors.accent }]}>{value}</Text>
      <Text style={font.tiny}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clockCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
  },
  clock: {
    fontSize: 68,
    fontWeight: '200',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  bar: {
    height: 4,
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    marginTop: space.lg,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.accent },
  itemBox: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
});
