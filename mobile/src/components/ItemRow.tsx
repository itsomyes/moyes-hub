import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, font, radius, space } from '../theme';
import type { DailyItem } from '../db/types';
import { quadrantOf } from '../domain/eisenhower';

const QUADRANT_COLOR: Record<string, string> = {
  do: colors.danger,
  schedule: colors.accent,
  delegate: colors.textMuted,
  drop: colors.borderStrong,
};

export function ItemRow({
  item,
  onToggle,
  onPress,
  onFocus,
}: {
  item: DailyItem;
  onToggle: () => void;
  onPress: () => void;
  onFocus?: () => void;
}) {
  const done = item.done_today === 1;

  const handleToggle = () => {
    Haptics.impactAsync(
      done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => {});
    onToggle();
  };

  return (
    <View style={[styles.row, done && { opacity: 0.45 }]}>
      <Pressable onPress={handleToggle} hitSlop={10} style={styles.checkHit}>
        <View style={[styles.check, done && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
          {done ? <Ionicons name="checkmark" size={15} color="#17130A" /> : null}
        </View>
      </Pressable>

      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <View style={styles.titleLine}>
          <View
            style={[styles.quadrantDot, { backgroundColor: QUADRANT_COLOR[quadrantOf(item)] }]}
          />
          <Text
            style={[font.body, done && { textDecorationLine: 'line-through', color: colors.textMuted }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>

        <View style={styles.metaLine}>
          {item.kind === 'habit' ? (
            <Text style={styles.meta}>
              <Ionicons name="flame" size={11} color={colors.textFaint} />{' '}
              {item.streak > 0 ? `${item.streak} dias` : 'sin racha'}
            </Text>
          ) : (
            <Text style={styles.meta}>{item.estimate_min} min</Text>
          )}
          {item.blocked && !done ? (
            <Text style={[styles.meta, { color: colors.warning }]}>bloqueada</Text>
          ) : null}
          {item.micro_step && !done ? (
            <Text style={[styles.meta, { color: colors.accent }]} numberOfLines={1}>
              paso 1: {item.micro_step}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {onFocus && !done ? (
        <Pressable onPress={onFocus} hitSlop={8} style={styles.focusButton}>
          <Ionicons name="timer-outline" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkHit: { paddingTop: 1 },
  check: {
    width: 23,
    height: 23,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  quadrantDot: { width: 6, height: 6, borderRadius: 3 },
  metaLine: { flexDirection: 'row', gap: space.md, marginTop: 3, marginLeft: 14, flexWrap: 'wrap' },
  meta: { fontSize: 11.5, color: colors.textFaint },
  focusButton: { padding: 4 },
});
