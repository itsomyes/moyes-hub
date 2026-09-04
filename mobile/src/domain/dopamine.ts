import type { Item } from '../db/types';
import { quadrantWeight } from './eisenhower';
import { daysSince } from './dates';

/**
 * MENU DE DOPAMINA
 *
 * Entrada: una escala de energia 1-10 declarada por ti.
 * Salida: exactamente tres candidatos, uno por franja de duracion, ordenados
 * segun la energia. Criterio: energia -> duracion -> antiguedad.
 *
 * Reglas duras:
 *  - Con energia alta el "sapo" (lo mas largo y mas podrido) va PRIMERO.
 *  - Con energia baja no se ofrece nada de 45 min: se ofrece movimiento.
 *  - Nunca devuelve una lista vacia si hay algo pendiente. Degrada de franja.
 */

export type Bucket = 'quick' | 'medium' | 'deep';

export const BUCKETS: Record<Bucket, { label: string; range: string; max: number }> = {
  quick:  { label: 'Arranque',  range: '10-15 min', max: 15 },
  medium: { label: 'Bloque',    range: '25 min',    max: 30 },
  deep:   { label: 'Sapo',      range: '45 min +',  max: Infinity },
};

export interface DopamineSuggestion {
  item: Item;
  bucket: Bucket;
  reason: string;
}

export function bucketOf(estimateMin: number): Bucket {
  if (estimateMin <= BUCKETS.quick.max) return 'quick';
  if (estimateMin <= BUCKETS.medium.max) return 'medium';
  return 'deep';
}

/** Franjas pedidas, en el orden en que hay que atacarlas para esa energia. */
export function bucketPlan(energy: number): Bucket[] {
  if (energy <= 3) return ['quick', 'quick', 'medium'];
  if (energy <= 7) return ['quick', 'medium', 'deep'];
  return ['deep', 'medium', 'quick'];
}

/** Cuanto mas viejo y mas importante, antes sale. La antiguedad manda. */
function score(item: Item): number {
  const age = Math.min(daysSince(item.created_at), 60);
  return age * 2 + quadrantWeight(item) * 3 + (item.blocked ? 1 : 0);
}

function reasonFor(item: Item, bucket: Bucket, energy: number): string {
  const age = daysSince(item.created_at);
  if (bucket === 'deep' && energy >= 8) return 'Tienes gasolina. Este es el sapo: primero.';
  if (age >= 7) return `Lleva ${age} dias pudriendose. Hoy se toca.`;
  if (item.blocked) return 'Marcada como bloqueada: empieza por el micro-paso.';
  if (item.urgent && item.important) return 'Urgente e importante. Sin discusion.';
  if (bucket === 'quick') return 'Barata. Sirve para arrancar el motor.';
  return `Encaja en ${BUCKETS[bucket].range}.`;
}

/**
 * @param candidates items pendientes (sin archivar, sin completar hoy)
 * @param energy escala 1-10
 */
export function buildDopamineMenu(candidates: Item[], energy: number): DopamineSuggestion[] {
  const pool = [...candidates].sort((a, b) => score(b) - score(a));
  const used = new Set<number>();
  const out: DopamineSuggestion[] = [];

  // Orden de degradacion cuando una franja se queda sin candidatos.
  const fallback: Record<Bucket, Bucket[]> = {
    quick: ['quick', 'medium', 'deep'],
    medium: ['medium', 'quick', 'deep'],
    deep: ['deep', 'medium', 'quick'],
  };

  for (const wanted of bucketPlan(energy)) {
    let picked: Item | undefined;
    let pickedBucket: Bucket = wanted;

    for (const bucket of fallback[wanted]) {
      picked = pool.find((item) => !used.has(item.id) && bucketOf(item.estimate_min) === bucket);
      if (picked) {
        pickedBucket = bucket;
        break;
      }
    }

    if (!picked) break;
    used.add(picked.id);
    out.push({ item: picked, bucket: pickedBucket, reason: reasonFor(picked, pickedBucket, energy) });
  }

  return out;
}

export function energyLabel(energy: number): string {
  if (energy <= 2) return 'En reserva';
  if (energy <= 4) return 'Baja';
  if (energy <= 6) return 'Justa';
  if (energy <= 8) return 'Buena';
  return 'A tope';
}
