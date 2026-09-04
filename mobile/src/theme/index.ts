/**
 * Paleta oscura sobria con un unico acento ambar.
 * Regla: el ambar solo aparece en lo accionable o en el estado activo.
 * Todo lo demas vive en escala de grises para bajar el ruido visual.
 */
export const colors = {
  bg: '#0B0B0C',
  surface: '#141416',
  surfaceAlt: '#1B1B1E',
  surfaceHigh: '#232327',
  border: '#2A2A2F',
  borderStrong: '#3A3A41',

  text: '#F4F4F5',
  textMuted: '#A1A1A8',
  textFaint: '#6E6E76',

  accent: '#F2A93B',
  accentDim: '#8A5F1E',
  accentSoft: 'rgba(242, 169, 59, 0.14)',

  success: '#4E9A6A',
  danger: '#C7563F',
  warning: '#D2A03A',

  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  tiny: { fontSize: 11, fontWeight: '600' as const, color: colors.textFaint },
  mono: { fontSize: 15, fontVariant: ['tabular-nums'] as const },
} as const;
