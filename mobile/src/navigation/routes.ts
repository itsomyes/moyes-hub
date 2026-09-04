import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type RouteKey = 'hoy' | 'tablero' | 'matriz' | 'habitos' | 'foco' | 'captura' | 'ajustes';

export interface RouteDef {
  key: RouteKey;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const ROUTES: RouteDef[] = [
  { key: 'hoy',     title: 'Hoy',      subtitle: 'La unica lista que importa', icon: 'today-outline' },
  { key: 'foco',    title: 'Foco',     subtitle: 'Pomodoro',                   icon: 'timer-outline' },
  { key: 'tablero', title: 'Tablero',  subtitle: 'Kanban',                     icon: 'grid-outline' },
  { key: 'matriz',  title: 'Matriz',   subtitle: 'Eisenhower',                 icon: 'apps-outline' },
  { key: 'habitos', title: 'Habitos',  subtitle: 'Rachas',                     icon: 'flame-outline' },
  { key: 'captura', title: 'Bandeja',  subtitle: 'Notas al yo futuro',         icon: 'file-tray-outline' },
  { key: 'ajustes', title: 'Ajustes',  subtitle: 'Sistema',                    icon: 'settings-outline' },
];

export const ROUTE_MAP: Record<RouteKey, RouteDef> = ROUTES.reduce(
  (acc, route) => ({ ...acc, [route.key]: route }),
  {} as Record<RouteKey, RouteDef>,
);
