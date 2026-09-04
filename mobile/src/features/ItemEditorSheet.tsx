import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Body, Button, Chip, Field, Label, Muted, Row, Segmented, Toggle } from '../components/ui';
import { colors, radius, space } from '../theme';
import { createItem, deleteItem, updateItem } from '../db/repos/items';
import type { Item, ItemKind } from '../db/types';
import { suggestMicroSteps } from '../domain/microsteps';
import { HABIT_RULE_OPTIONS } from '../domain/habits';

const ESTIMATES = [10, 15, 25, 45, 90];

export function ItemEditorSheet({
  visible,
  item,
  defaultKind = 'task',
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: Item | null;
  defaultKind?: ItemKind;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<ItemKind>(defaultKind);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [estimate, setEstimate] = useState(25);
  const [blocked, setBlocked] = useState(false);
  const [microStep, setMicroStep] = useState<string | null>(null);
  const [habitRule, setHabitRule] = useState('daily');

  useEffect(() => {
    if (!visible) return;
    if (item) {
      setKind(item.kind);
      setTitle(item.title);
      setNotes(item.notes ?? '');
      setUrgent(item.urgent === 1);
      setImportant(item.important === 1);
      setEstimate(item.estimate_min);
      setBlocked(item.blocked === 1);
      setMicroStep(item.micro_step);
      setHabitRule(item.habit_rule ?? 'daily');
    } else {
      setKind(defaultKind);
      setTitle('');
      setNotes('');
      setUrgent(false);
      setImportant(false);
      setEstimate(25);
      setBlocked(false);
      setMicroStep(null);
      setHabitRule('daily');
    }
  }, [visible, item, defaultKind]);

  // PROTOCOLO INICIO: en cuanto marcas "bloqueada" aparecen los micro-pasos.
  const microSteps = useMemo(() => suggestMicroSteps(title || 'esta tarea'), [title]);

  const canSave = title.trim().length > 0;

  async function save() {
    if (!canSave) return;
    const payload = {
      title: title.trim(),
      notes: notes.trim() || null,
      urgent: urgent ? 1 : 0,
      important: important ? 1 : 0,
      estimate_min: estimate,
      blocked: blocked ? 1 : 0,
      micro_step: blocked ? microStep : null,
      habit_rule: kind === 'habit' ? habitRule : null,
    };

    if (item) {
      await updateItem(item.id, payload);
    } else {
      await createItem({
        kind,
        title: payload.title,
        notes: payload.notes,
        urgent,
        important,
        estimate_min: estimate,
        blocked,
        micro_step: payload.micro_step,
        habit_rule: payload.habit_rule,
        status: kind === 'habit' ? 'today' : 'today',
      });
    }
    onSaved();
    onClose();
  }

  async function remove() {
    if (!item) return;
    await deleteItem(item.id);
    onSaved();
    onClose();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={item ? 'Editar' : 'Nuevo'}>
      {!item ? (
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'task', label: 'Tarea' },
            { value: 'habit', label: 'Habito' },
          ]}
        />
      ) : null}

      <Field label="Que es" value={title} onChangeText={setTitle} placeholder="Escribelo en una linea" autoFocus={!item} />

      {kind === 'habit' ? (
        <View style={{ gap: space.sm }}>
          <Label>Cada cuanto</Label>
          <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
            {HABIT_RULE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={habitRule === option.value}
                onPress={() => setHabitRule(option.value)}
              />
            ))}
          </Row>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Label>Cuanto dura</Label>
          <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
            {ESTIMATES.map((value) => (
              <Chip
                key={value}
                label={`${value} min`}
                active={estimate === value}
                onPress={() => setEstimate(value)}
              />
            ))}
          </Row>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        <Label>Prioridad</Label>
        <Row gap={space.sm}>
          <Chip label="Urgente" active={urgent} onPress={() => setUrgent(!urgent)} tone="danger" />
          <Chip label="Importante" active={important} onPress={() => setImportant(!important)} />
        </Row>
      </View>

      <Toggle
        label="Esta bloqueada"
        hint="Si no eres capaz de empezarla, marcalo y te la parto."
        value={blocked}
        onChange={(value) => {
          setBlocked(value);
          if (!value) setMicroStep(null);
        }}
      />

      {blocked ? (
        <View style={styles.protocol}>
          <Label>Protocolo INICIO</Label>
          <Muted style={{ marginBottom: space.sm }}>
            Elige el primer movimiento. Tiene que caber en menos de un minuto.
          </Muted>
          {microSteps.map((step) => {
            const active = microStep === step.text;
            return (
              <Pressable
                key={step.text}
                onPress={() => setMicroStep(active ? null : step.text)}
                style={[styles.step, active && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <Text style={[styles.stepSeconds, active && { color: colors.accent }]}>{step.seconds}s</Text>
                <Body style={{ flex: 1, fontSize: 14 }}>{step.text}</Body>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Field label="Notas" value={notes} onChangeText={setNotes} placeholder="Opcional" multiline />

      <Button title={item ? 'Guardar' : 'Anadir'} onPress={save} disabled={!canSave} />
      {item ? <Button title="Borrar" variant="danger" onPress={remove} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  protocol: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepSeconds: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textFaint,
    minWidth: 30,
  },
});
