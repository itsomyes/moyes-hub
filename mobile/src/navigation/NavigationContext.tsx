import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { RouteKey } from './routes';

interface NavigationValue {
  route: RouteKey;
  navigate: (route: RouteKey) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Cambia cuando algo escribe en la base: las pantallas lo usan para recargar. */
  revision: number;
  refresh: () => void;
  /** Item preseleccionado al saltar a Foco desde otra pantalla. */
  focusItemId: number | null;
  setFocusItemId: (id: number | null) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<RouteKey>('hoy');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [focusItemId, setFocusItemId] = useState<number | null>(null);

  const navigate = useCallback((next: RouteKey) => {
    setRoute(next);
    setDrawerOpen(false);
  }, []);

  const value = useMemo<NavigationValue>(
    () => ({
      route,
      navigate,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      revision,
      refresh: () => setRevision((r) => r + 1),
      focusItemId,
      setFocusItemId,
    }),
    [route, navigate, drawerOpen, revision, focusItemId],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('useNavigation debe usarse dentro de NavigationProvider');
  return value;
}
