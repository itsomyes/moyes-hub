import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Button, Chip, Divider, H1, Label, Loading, Muted, Row, Toggle } from '../components/ui';
import { getBoolSetting, getNumberSetting, setSetting, SETTINGS_KEYS } from '../db/repos/settings';
import { hidePersistentCapture, showPersistentCapture } from '../notifications/persistent';
import { useNavigation } from '../navigation/NavigationContext';

const FOCUS_OPTIONS = [15, 25, 45, 50];
const BREAK_OPTIONS = [5, 10, 15];

export function AjustesScreen() {
  const { refresh } = useNavigation();
  const [ready, setReady] = useState(false);
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [persistent, setPersistent] = useState(false);

  const load = useCallback(async () => {
    setFocusMin(await getNumberSetting(SETTINGS_KEYS.focusMin, 25));
    setBreakMin(await getNumberSetting(SETTINGS_KEYS.breakMin, 5));
    setPersistent(await getBoolSetting(SETTINGS_KEYS.persistentCapture, false));
    setReady(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) return <Loading />;

  async function togglePersistent(next: boolean) {
    setPersistent(next);
    await setSetting(SETTINGS_KEYS.persistentCapture, next ? '1' : '0');
    if (next) {
      await showPersistentCapture();
    } else {
      await hidePersistentCapture();
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.lg }}>
      <View>
        <Label>SISTEMA</Label>
        <H1 style={{ marginTop: space.xs }}>Ajustes</H1>
      </View>

      <View style={styles.card}>
        <Label>Pomodoro</Label>
        <Muted style={{ marginTop: space.xs, marginBottom: space.md }}>Duracion del bloque de foco.</Muted>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {FOCUS_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={`${value} min`}
              active={focusMin === value}
              onPress={async () => {
                setFocusMin(value);
                await setSetting(SETTINGS_KEYS.focusMin, String(value));
                refresh();
              }}
            />
          ))}
        </Row>

        <Divider />

        <Label>Descanso</Label>
        <Row gap={space.sm} style={{ flexWrap: 'wrap', marginTop: space.md }}>
          {BREAK_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={`${value} min`}
              active={breakMin === value}
              onPress={async () => {
                setBreakMin(value);
                await setSetting(SETTINGS_KEYS.breakMin, String(value));
                refresh();
              }}
            />
          ))}
        </Row>
      </View>

      <View style={styles.card}>
        <Label>Captura</Label>
        <Toggle
          label="Notificacion persistente"
          hint="Deja una notificacion fija para apuntar sin abrir la app."
          value={persistent}
          onChange={togglePersistent}
        />
      </View>

      <View style={styles.card}>
        <Label>Datos</Label>
        <Muted style={{ marginTop: space.xs, marginBottom: space.md }}>
          Todo vive en este movil. No hay servidor ni copia en la nube.
        </Muted>
        <Button
          title="Exportar es cosa de la Fase 2"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              'Todavia no',
              'La sincronizacion con Google Calendar entra en la Fase 2, cuando confirmes que la Fase 1 funciona en el movil.',
            )
          }
        />
      </View>
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
});
