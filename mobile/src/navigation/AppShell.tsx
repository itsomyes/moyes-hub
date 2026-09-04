import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { colors, font, radius, space } from '../theme';
import { Drawer } from './Drawer';
import { ROUTE_MAP } from './routes';
import { useNavigation } from './NavigationContext';
import { HoyScreen } from '../screens/HoyScreen';
import { TableroScreen } from '../screens/TableroScreen';
import { MatrizScreen } from '../screens/MatrizScreen';
import { HabitosScreen } from '../screens/HabitosScreen';
import { FocoScreen } from '../screens/FocoScreen';
import { BandejaScreen } from '../screens/BandejaScreen';
import { AjustesScreen } from '../screens/AjustesScreen';
import { ItemEditorSheet } from '../features/ItemEditorSheet';
import { DopamineSheet } from '../features/DopamineSheet';
import { CaptureSheet } from '../features/CaptureSheet';
import { countPending, createCapture } from '../db/repos/captures';
import { getBoolSetting, SETTINGS_KEYS } from '../db/repos/settings';
import { CAPTURE_ACTION_TEXT, showPersistentCapture } from '../notifications/persistent';
import type { Item } from '../db/types';

export function AppShell() {
  const { route, openDrawer, revision, refresh, navigate, setFocusItemId } = useNavigation();
  const insets = useSafeAreaInsets();

  const [editorItem, setEditorItem] = useState<Item | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [dopamineOpen, setDopamineOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    countPending().then(setPending);
  }, [revision]);

  // Restaura la notificacion persistente si estaba activada.
  useEffect(() => {
    getBoolSetting(SETTINGS_KEYS.persistentCapture, false).then((enabled) => {
      if (enabled) showPersistentCapture();
    });
  }, []);

  // Respuesta a la notificacion: texto directo desde la barra, o abrir la hoja.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (response.actionIdentifier === CAPTURE_ACTION_TEXT && response.userText?.trim()) {
        await createCapture({ what: response.userText });
        refresh();
        await showPersistentCapture();
        return;
      }
      setCaptureOpen(true);
    });
    return () => sub.remove();
  }, [refresh]);

  const openEditor = useCallback((item: Item | null) => {
    setEditorItem(item);
    setEditorOpen(true);
  }, []);

  const meta = ROUTE_MAP[route];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={openDrawer} hitSlop={12} style={styles.headerButton}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
        <Text style={[font.h3, { flex: 1 }]}>{meta.title}</Text>
        <Pressable onPress={() => setCaptureOpen(true)} hitSlop={12} style={styles.headerButton}>
          <Ionicons name="flash-outline" size={21} color={colors.textMuted} />
          {pending > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {route === 'hoy' && <HoyScreen onEditItem={openEditor} />}
        {route === 'tablero' && <TableroScreen onEditItem={openEditor} />}
        {route === 'matriz' && <MatrizScreen onEditItem={openEditor} />}
        {route === 'habitos' && <HabitosScreen onEditItem={openEditor} />}
        {route === 'foco' && <FocoScreen />}
        {route === 'captura' && <BandejaScreen />}
        {route === 'ajustes' && <AjustesScreen />}
      </View>

      <View style={[styles.fabStack, { bottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={() => setDopamineOpen(true)}
          style={({ pressed }) => [styles.fabSecondary, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="help" size={20} color={colors.accent} />
          <Text style={styles.fabSecondaryText}>Que hago ahora</Text>
        </Pressable>

        <Pressable
          onPress={() => openEditor(null)}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={28} color="#17130A" />
        </Pressable>
      </View>

      <Drawer pendingCaptures={pending} />

      <ItemEditorSheet
        visible={editorOpen}
        item={editorItem}
        onClose={() => setEditorOpen(false)}
        onSaved={refresh}
      />
      <DopamineSheet
        visible={dopamineOpen}
        onClose={() => setDopamineOpen(false)}
        onPick={(item) => {
          setFocusItemId(item.id);
          navigate('foco');
        }}
      />
      <CaptureSheet
        visible={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSaved={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerButton: { padding: 2 },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  fabStack: {
    position: 'absolute',
    right: space.lg,
    left: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    elevation: 4,
  },
  fabSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
