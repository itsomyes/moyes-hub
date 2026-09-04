import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { colors, font, space } from './src/theme';
import { getDatabase } from './src/db/database';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { AppShell } from './src/navigation/AppShell';
import { Loading } from './src/components/ui';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
    getDatabase()
      .then(() => setReady(true))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        {error ? (
          <View style={styles.center}>
            <Text style={font.h2}>No se pudo abrir la base de datos</Text>
            <Text style={[font.small, { marginTop: space.sm, textAlign: 'center' }]}>{error}</Text>
          </View>
        ) : ready ? (
          <NavigationProvider>
            <AppShell />
          </NavigationProvider>
        ) : (
          <Loading />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
});
