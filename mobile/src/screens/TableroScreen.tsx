import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, space } from '../theme';
import { Body, H1, Label, Loading, Muted } from '../components/ui';
import { getBoardItems, setStatus } from '../db/repos/items';
import type { Item, ItemStatus } from '../db/types';
import { quadrantOf } from '../domain/eisenhower';
import { useNavigation } from '../navigation/NavigationContext';

const COLUMNS: { key: ItemStatus; label: string; hint: string }[] = [
  { key: 'backlog', label: 'Pendiente', hint: 'Existe, pero no hoy' },
  { key: 'today',   label: 'Hoy',       hint: 'Comprometido' },
  { key: 'doing',   label: 'En curso',  hint: 'Solo una a la vez' },
  { key: 'done',    label: 'Hecho',     hint: 'Ciclo cerrado' },
];

const QUADRANT_COLOR: Record<string, string> = {
  do: colors.danger,
  schedule: colors.accent,
  delegate: colors.textMuted,
  drop: colors.borderStrong,
};

/**
 * Kanban simple: columnas apiladas y movimiento con flechas.
 * Sin drag & drop a proposito — arrastrar en movil falla mas de lo que aporta,
 * y dos toques precisos son mas rapidos que un arrastre que se escapa.
 */
export function TableroScreen({ onEditItem }: { onEditItem: (item: Item) => void }) {
  const { revision, refresh } = useNavigation();
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(async () => setItems(await getBoardItems()), []);
  useEffect(() => {
    load();
  }, [load, revision]);

  if (items === null) return <Loading />;

  async function move(item: Item, direction: -1 | 1) {
    const index = COLUMNS.findIndex((column) => column.key === item.status);
    const next = COLUMNS[Math.min(COLUMNS.length - 1, Math.max(0, index + direction))];
    if (next.key === item.status) return;
    await setStatus(item.id, next.key);
    refresh();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.lg }}>
      <View>
        <Label>KANBAN</Label>
        <H1 style={{ marginTop: space.xs }}>Tablero</H1>
      </View>

      {COLUMNS.map((column) => {
        const columnItems = items.filter((item) => item.status === column.key);
        return (
          <View key={column.key} style={styles.column}>
            <View style={styles.columnHead}>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{column.label}</Text>
                <Text style={font.tiny}>{column.hint.toUpperCase()}</Text>
              </View>
              <Text style={[font.h3, { color: colors.textFaint }]}>{columnItems.length}</Text>
            </View>

            {columnItems.length === 0 ? (
              <Muted style={{ paddingVertical: space.md }}>Vacia.</Muted>
            ) : (
              columnItems.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Pressable
                    onPress={() => move(item, -1)}
                    hitSlop={8}
                    disabled={column.key === 'backlog'}
                    style={column.key === 'backlog' && { opacity: 0.2 }}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
                  </Pressable>

                  <Pressable style={{ flex: 1 }} onPress={() => onEditItem(item)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                      <View style={[styles.dot, { backgroundColor: QUADRANT_COLOR[quadrantOf(item)] }]} />
                      <Body
                        style={[
                          { flex: 1, fontSize: 14 },
                          column.key === 'done' && { color: colors.textMuted, textDecorationLine: 'line-through' },
                        ]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Body>
                    </View>
                    <Text style={[font.tiny, { marginLeft: 14, marginTop: 2 }]}>
                      {item.estimate_min} MIN{item.blocked ? ' · BLOQUEADA' : ''}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => move(item, 1)}
                    hitSlop={8}
                    disabled={column.key === 'done'}
                    style={column.key === 'done' && { opacity: 0.2 }}
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  columnHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
