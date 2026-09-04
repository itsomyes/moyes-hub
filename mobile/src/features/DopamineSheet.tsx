import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Body, Button, Label, Muted, Row, ScalePicker } from '../components/ui';
import { colors, font, radius, space } from '../theme';
import { getOpenItems } from '../db/repos/items';
import { logEnergy, lastEnergy } from '../db/repos/energy';
import { BUCKETS, buildDopamineMenu, energyLabel, type DopamineSuggestion } from '../domain/dopamine';
import type { Item } from '../db/types';

/**
 * MENU DE DOPAMINA
 * Dos pasos: declaras energia -> te devuelve tres opciones y eliges una.
 * No hay "ver mas". Tres o nada: la eleccion infinita es lo que te bloquea.
 */
export function DopamineSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (item: Item) => void;
}) {
  const [energy, setEnergy] = useState(5);
  const [stage, setStage] = useState<'energy' | 'menu'>('energy');
  const [suggestions, setSuggestions] = useState<DopamineSuggestion[]>([]);

  useEffect(() => {
    if (!visible) return;
    setStage('energy');
    setSuggestions([]);
    lastEnergy().then((level) => {
      if (level !== null) setEnergy(level);
    });
  }, [visible]);

  const compute = useCallback(async () => {
    const open = await getOpenItems();
    setSuggestions(buildDopamineMenu(open, energy));
    await logEnergy(energy);
    setStage('menu');
  }, [energy]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Que hago ahora">
      {stage === 'energy' ? (
        <>
          <Muted>Nivel de energia real, no el que te gustaria tener.</Muted>
          <ScalePicker value={energy} onChange={setEnergy} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.tiny}>EN RESERVA</Text>
            <Text style={[font.h3, { color: colors.accent }]}>{energyLabel(energy)}</Text>
            <Text style={font.tiny}>A TOPE</Text>
          </Row>
          <Button title="Dame tres opciones" onPress={compute} />
        </>
      ) : (
        <>
          <Muted>
            Energia {energy}/10. Elige una y empieza. La que no elijas sigue donde estaba.
          </Muted>

          {suggestions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Body>No hay nada pendiente que ofrecerte.</Body>
              <Muted>Anade algo o descansa de verdad, sin pantalla.</Muted>
            </View>
          ) : (
            suggestions.map((suggestion, index) => (
              <View key={suggestion.item.id} style={styles.option}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Label>
                    {index + 1}. {BUCKETS[suggestion.bucket].label} · {BUCKETS[suggestion.bucket].range}
                  </Label>
                  <Text style={font.tiny}>{suggestion.item.estimate_min} MIN</Text>
                </Row>
                <Body style={{ marginTop: space.sm }}>{suggestion.item.title}</Body>
                <Muted style={{ marginTop: 2 }}>{suggestion.reason}</Muted>
                {suggestion.item.micro_step ? (
                  <Text style={styles.micro}>Paso 1: {suggestion.item.micro_step}</Text>
                ) : null}
                <Button
                  title="Esta. Arranca el reloj."
                  onPress={() => {
                    onPick(suggestion.item);
                    onClose();
                  }}
                  style={{ marginTop: space.md }}
                  variant={index === 0 ? 'primary' : 'secondary'}
                />
              </View>
            ))
          )}

          <Button title="Cambiar mi energia" variant="ghost" onPress={() => setStage('energy')} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  micro: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.accent,
  },
  emptyBox: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.xs,
  },
});
