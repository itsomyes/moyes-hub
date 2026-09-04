import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { Body, Button, EmptyState, H1, Label, Loading, Muted, Row } from '../components/ui';
import { deleteCapture, listCaptures, markProcessed } from '../db/repos/captures';
import { createItem } from '../db/repos/items';
import type { Capture } from '../db/types';
import { useNavigation } from '../navigation/NavigationContext';

/**
 * Bandeja de la Nota al yo futuro. Una captura solo tiene dos salidas:
 * se convierte en tarea o se tira. No existe "dejarla ahi para siempre".
 */
export function BandejaScreen() {
  const { revision, refresh } = useNavigation();
  const [captures, setCaptures] = useState<Capture[] | null>(null);

  const load = useCallback(async () => setCaptures(await listCaptures()), []);
  useEffect(() => {
    load();
  }, [load, revision]);

  if (captures === null) return <Loading />;

  async function toTask(capture: Capture) {
    const notes = [
      capture.why ? `Por que: ${capture.why}` : null,
      capture.place ? `Donde: ${capture.place}` : null,
      capture.say ? `Que decir: ${capture.say}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const itemId = await createItem({
      kind: 'task',
      title: capture.what,
      notes: notes || null,
      status: 'today',
      estimate_min: 15,
    });
    await markProcessed(capture.id, itemId);
    refresh();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.md }}>
      <View>
        <Label>NOTA AL YO FUTURO</Label>
        <H1 style={{ marginTop: space.xs }}>Bandeja</H1>
        <Muted style={{ marginTop: space.sm }}>
          Todo lo que soltaste sin pensar. Ahora decides: se convierte o se tira.
        </Muted>
      </View>

      {captures.length === 0 ? (
        <EmptyState title="Bandeja limpia" hint="Cero ciclos abiertos. Asi tiene que estar." />
      ) : (
        captures.map((capture) => (
          <View key={capture.id} style={styles.card}>
            <Body>{capture.what}</Body>
            {capture.why ? <Detail label="POR QUE" value={capture.why} /> : null}
            {capture.place ? <Detail label="DONDE" value={capture.place} /> : null}
            {capture.say ? <Detail label="QUE DECIR" value={capture.say} /> : null}

            <Row gap={space.sm} style={{ marginTop: space.md }}>
              <Button title="A tarea" onPress={() => toTask(capture)} style={{ flex: 1 }} />
              <Button
                title="Tirar"
                variant="danger"
                style={{ flex: 1 }}
                onPress={async () => {
                  await deleteCapture(capture.id);
                  refresh();
                }}
              />
            </Row>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: space.sm }}>
      <Text style={font.tiny}>{label}</Text>
      <Text style={[font.small, { color: colors.textMuted }]}>{value}</Text>
    </View>
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
