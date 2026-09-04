import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { Body, EmptyState, H1, Label, Loading, Muted } from '../components/ui';
import { getHabits, getStreak, toggleDone } from '../db/repos/items';
import { getDatabase } from '../db/database';
import type { Item } from '../db/types';
import { addDays, todayKey } from '../domain/dates';
import { habitRuleLabel } from '../domain/habits';
import { useNavigation } from '../navigation/NavigationContext';

const WINDOW = 14; // dos semanas caben en pantalla sin scroll horizontal

interface HabitRow {
  item: Item;
  streak: number;
  marks: { date: string; done: boolean }[];
}

export function HabitosScreen({ onEditItem }: { onEditItem: (item: Item) => void }) {
  const { revision, refresh } = useNavigation();
  const [rows, setRows] = useState<HabitRow[] | null>(null);

  const load = useCallback(async () => {
    const habits = await getHabits();
    const db = await getDatabase();
    const today = todayKey();
    const from = addDays(today, -(WINDOW - 1));

    const built = await Promise.all(
      habits.map(async (item) => {
        const logs = await db.getAllAsync<{ log_date: string; done: number }>(
          'SELECT log_date, done FROM item_logs WHERE item_id = ? AND log_date >= ?',
          [item.id, from],
        );
        const doneDates = new Set(logs.filter((l) => l.done === 1).map((l) => l.log_date));
        const marks = Array.from({ length: WINDOW }, (_, offset) => {
          const date = addDays(from, offset);
          return { date, done: doneDates.has(date) };
        });
        return { item, streak: await getStreak(item.id, today), marks };
      }),
    );
    setRows(built);
  }, []);

  useEffect(() => {
    load();
  }, [load, revision]);

  if (rows === null) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.md }}>
      <View>
        <Label>RACHAS</Label>
        <H1 style={{ marginTop: space.xs }}>Habitos</H1>
        <Muted style={{ marginTop: space.sm }}>
          El sistema gana al objetivo. Un dia perdido no rompe nada; dos seguidos si.
        </Muted>
      </View>

      {rows.length === 0 ? (
        <EmptyState title="Sin habitos" hint="Anade uno desde el boton naranja, tipo Habito." />
      ) : (
        rows.map(({ item, streak, marks }) => (
          <Pressable key={item.id} onPress={() => onEditItem(item)} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Body>{item.title}</Body>
                <Text style={font.tiny}>{habitRuleLabel(item.habit_rule).toUpperCase()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[font.h2, { color: streak > 0 ? colors.accent : colors.textFaint }]}>
                  {streak}
                </Text>
                <Text style={font.tiny}>DIAS</Text>
              </View>
            </View>

            <View style={styles.track}>
              {marks.map((mark) => (
                <Pressable
                  key={mark.date}
                  onPress={async () => {
                    await toggleDone(item, mark.date);
                    refresh();
                  }}
                  style={[
                    styles.cell,
                    mark.done && { backgroundColor: colors.accent, borderColor: colors.accent },
                    mark.date === todayKey() && !mark.done && { borderColor: colors.accentDim },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  track: { flexDirection: 'row', gap: 4 },
  cell: {
    flex: 1,
    height: 26,
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
});
