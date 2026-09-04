import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { Body, Chip, EmptyState, H1, Label, Loading, Muted, Row } from '../components/ui';
import { ItemRow } from '../components/ItemRow';
import { getDailyItems, toggleDone } from '../db/repos/items';
import type { DailyItem, Item } from '../db/types';
import { humanDate, todayKey } from '../domain/dates';
import { useNavigation } from '../navigation/NavigationContext';

export function HoyScreen({ onEditItem }: { onEditItem: (item: Item) => void }) {
  const { revision, refresh, navigate, setFocusItemId } = useNavigation();
  const [items, setItems] = useState<DailyItem[] | null>(null);
  const [filter, setFilter] = useState<'todo' | 'tareas' | 'habitos'>('todo');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await getDailyItems());
  }, []);

  useEffect(() => {
    load();
  }, [load, revision]);

  const visible = (items ?? []).filter((item) => {
    if (filter === 'tareas') return item.kind === 'task';
    if (filter === 'habitos') return item.kind === 'habit';
    return true;
  });

  const done = (items ?? []).filter((i) => i.done_today === 1).length;
  const total = items?.length ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  if (items === null) return <Loading />;

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.sm }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          <View>
            <Label>{humanDate(todayKey()).toUpperCase()}</Label>
            <H1 style={{ marginTop: space.xs }}>Hoy</H1>
          </View>

          <View style={styles.progressCard}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>
                {done} de {total} cerrados
              </Body>
              <Text style={[font.h3, { color: pct === 100 && total > 0 ? colors.success : colors.accent }]}>
                {pct}%
              </Text>
            </Row>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
          </View>

          <Row gap={space.sm}>
            <Chip label="Todo" active={filter === 'todo'} onPress={() => setFilter('todo')} />
            <Chip label="Tareas" active={filter === 'tareas'} onPress={() => setFilter('tareas')} />
            <Chip label="Habitos" active={filter === 'habitos'} onPress={() => setFilter('habitos')} />
          </Row>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="La lista esta vacia"
          hint="Pulsa el boton naranja y suelta lo primero que tengas en la cabeza."
        />
      }
      renderItem={({ item }) => (
        <ItemRow
          item={item}
          onToggle={async () => {
            await toggleDone(item);
            refresh();
          }}
          onPress={() => onEditItem(item)}
          onFocus={() => {
            setFocusItemId(item.id);
            navigate('foco');
          }}
        />
      )}
      ListFooterComponent={
        visible.length > 0 ? (
          <Muted style={{ textAlign: 'center', marginTop: space.xl }}>
            Nada mas. Lo demas vive en el tablero, no en tu cabeza.
          </Muted>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  bar: { height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
});
