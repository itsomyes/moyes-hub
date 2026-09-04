import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { Body, H1, Label, Loading, Muted } from '../components/ui';
import { getBoardItems } from '../db/repos/items';
import type { Item, Quadrant } from '../db/types';
import { QUADRANTS, quadrantOf } from '../domain/eisenhower';
import { useNavigation } from '../navigation/NavigationContext';

const ACCENTS: Record<Quadrant, string> = {
  do: colors.danger,
  schedule: colors.accent,
  delegate: colors.textMuted,
  drop: colors.borderStrong,
};

export function MatrizScreen({ onEditItem }: { onEditItem: (item: Item) => void }) {
  const { revision } = useNavigation();
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(async () => setItems(await getBoardItems()), []);
  useEffect(() => {
    load();
  }, [load, revision]);

  if (items === null) return <Loading />;
  const open = items.filter((item) => item.status !== 'done');

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.lg }}>
      <View>
        <Label>EISENHOWER</Label>
        <H1 style={{ marginTop: space.xs }}>Matriz</H1>
        <Muted style={{ marginTop: space.sm }}>
          Urgente no es importante. Lo que vive abajo a la derecha se muere solo.
        </Muted>
      </View>

      {QUADRANTS.map((quadrant) => {
        const bucket = open.filter((item) => quadrantOf(item) === quadrant.key);
        return (
          <View key={quadrant.key} style={[styles.quadrant, { borderLeftColor: ACCENTS[quadrant.key] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{quadrant.label}</Text>
                <Text style={font.tiny}>{quadrant.hint.toUpperCase()}</Text>
              </View>
              <Text style={[font.h2, { color: colors.textFaint }]}>{bucket.length}</Text>
            </View>

            {bucket.length === 0 ? (
              <Muted style={{ marginTop: space.sm }}>Nada aqui.</Muted>
            ) : (
              <View style={{ marginTop: space.md, gap: space.sm }}>
                {bucket.map((item) => (
                  <Pressable key={item.id} onPress={() => onEditItem(item)} style={styles.item}>
                    <Body style={{ flex: 1, fontSize: 14 }} >{item.title}</Body>
                    <Text style={font.tiny}>{item.estimate_min}M</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quadrant: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    padding: space.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: space.md,
  },
});
