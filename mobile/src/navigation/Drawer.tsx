import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { ROUTES } from './routes';
import { useNavigation } from './NavigationContext';

const WIDTH = Math.min(300, Dimensions.get('window').width * 0.82);

/**
 * Drawer propio sobre Animated de React Native.
 * Evita react-native-reanimated y gesture-handler: dos dependencias nativas
 * menos que puedan romper el build de EAS para una animacion de 220 ms.
 */
export function Drawer({ pendingCaptures }: { pendingCaptures: number }) {
  const { drawerOpen, closeDrawer, navigate, route } = useNavigation();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (drawerOpen) setMounted(true);
    Animated.timing(progress, {
      toValue: drawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !drawerOpen) setMounted(false);
    });
  }, [drawerOpen, progress]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDrawer();
      return true;
    });
    return () => sub.remove();
  }, [drawerOpen, closeDrawer]);

  if (!mounted) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={drawerOpen ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Cerrar menu" />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          { width: WIDTH, paddingTop: insets.top + space.lg, transform: [{ translateX }] },
        ]}
      >
        <Text style={[font.h2, { paddingHorizontal: space.lg }]}>Moyes Hub</Text>
        <Text style={[font.tiny, { paddingHorizontal: space.lg, marginTop: 2 }]}>
          UN SISTEMA. CERO MEMORIA.
        </Text>

        <ScrollView style={{ marginTop: space.xl }} contentContainerStyle={{ paddingBottom: space.xl }}>
          {ROUTES.map((item) => {
            const active = item.key === route;
            const badge = item.key === 'captura' ? pendingCaptures : 0;
            return (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.key)}
                style={({ pressed }) => [
                  styles.row,
                  active && { backgroundColor: colors.accentSoft },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={active ? colors.accent : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[font.body, active && { color: colors.accent, fontWeight: '600' }]}>
                    {item.title}
                  </Text>
                  <Text style={font.tiny}>{item.subtitle.toUpperCase()}</Text>
                </View>
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 13,
    paddingHorizontal: space.lg,
    marginHorizontal: space.sm,
    borderRadius: radius.md,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#17130A' },
});
