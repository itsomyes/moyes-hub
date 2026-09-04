import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, space } from '../theme';

/* ------------------------------------------------------------------ texto */

type TextProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function H1({ children, style, numberOfLines }: TextProps) {
  return <Text style={[font.h1, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function H2({ children, style, numberOfLines }: TextProps) {
  return <Text style={[font.h2, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Body({ children, style, numberOfLines }: TextProps) {
  return <Text style={[font.body, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Muted({ children, style, numberOfLines }: TextProps) {
  return <Text style={[font.small, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Label({ children, style, numberOfLines }: TextProps) {
  return (
    <Text
      style={[font.tiny, { letterSpacing: 1, textTransform: 'uppercase' }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

/* ----------------------------------------------------------------- layout */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}>
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Row({
  children,
  style,
  gap = space.sm,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[font.h3, { color: colors.textMuted, textAlign: 'center' }]}>{title}</Text>
      {hint ? <Muted style={{ textAlign: 'center', marginTop: space.sm }}>{hint}</Muted> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/* ---------------------------------------------------------------- botones */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.accent, fg: '#17130A', border: colors.accent },
    secondary: { bg: colors.surfaceHigh, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  };
  const p = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: p.bg, borderColor: p.border },
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: p.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'accent' | 'danger';
}) {
  const activeBg = tone === 'danger' ? 'rgba(199,86,63,0.16)' : colors.accentSoft;
  const activeFg = tone === 'danger' ? colors.danger : colors.accent;
  const activeBorder = tone === 'danger' ? colors.danger : colors.accentDim;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active
          ? { backgroundColor: activeBg, borderColor: activeBorder }
          : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? activeFg : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- inputs */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoFocus,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        autoFocus={autoFocus}
        keyboardType={keyboardType ?? 'default'}
        style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: colors.surfaceHigh }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.accent }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {hint ? <Muted>{hint}</Muted> : null}
      </View>
      <View style={[styles.track, value && { backgroundColor: colors.accentDim }]}>
        <View style={[styles.knob, value && { backgroundColor: colors.accent, alignSelf: 'flex-end' }]} />
      </View>
    </Pressable>
  );
}

/** Escala discreta 1-10. Sin gestos: 10 objetivos grandes, imposible fallar. */
export function ScalePicker({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.scale}>
      {steps.map((step) => {
        const active = step === value;
        return (
          <Pressable
            key={step}
            onPress={() => onChange(step)}
            style={[
              styles.scaleStep,
              active && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.scaleText, active && { color: '#17130A', fontWeight: '700' }]}>
              {step}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ScreenScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 140, gap: space.md }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
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
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  empty: { paddingVertical: space.xxl * 1.5, alignItems: 'center', justifyContent: 'center' },
  button: {
    paddingVertical: 13,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segmentText: { fontSize: 13.5, fontWeight: '600', color: colors.textMuted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  track: {
    width: 46,
    height: 27,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    padding: 3,
    justifyContent: 'center',
  },
  knob: { width: 21, height: 21, borderRadius: radius.pill, backgroundColor: colors.textFaint },
  scale: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  scaleStep: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
