import { CardioWorkout, CardioLocation, CardioType } from '../types';

export const CARDIO_LOCATIONS: {
  id: CardioLocation;
  name: string;
  emoji: string;
  desc: string;
}[] = [
  { id: 'treadmill', name: 'Cinta', emoji: '🏢', desc: 'Gimnasio o casa con inclinación / velocidad' },
  { id: 'street', name: 'Calle', emoji: '🌳', desc: 'Asfalto, parque o exterior libre' },
  { id: 'track', name: 'Pista', emoji: '🔴', desc: 'Pista de atletismo / tartán' },
];

export const CARDIO_TYPES: {
  id: CardioType;
  title: string;
  emoji: string;
  speechTest: string;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: 'recovery_walk',
    title: 'Caminata rápida / Recuperación',
    emoji: '🚶',
    speechTest: 'Paso ligero, sin impacto, recuperación activa (LISS).',
    badge: 'Recuperación Activa',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'steady_easy_jog',
    title: 'Trote continuo / Suave',
    emoji: '🐢',
    speechTest: 'Ritmo cómodo, pudiste hablar con oraciones completas (LISS).',
    badge: 'Base Aeróbica',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  },
  {
    id: 'intervals_sprints',
    title: 'Intervalos / Piques',
    emoji: '⚡',
    speechTest: 'Alternaste trote/sprint fuerte con descansos o caminata (HIIT).',
    badge: 'Alta Intensidad / HIIT',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'tempo_pace',
    title: 'Ritmo fuerte constante',
    emoji: '⏱️',
    speechTest: 'Paso exigente y concentrado de principio a fin (Tempo).',
    badge: 'Umbral / Tempo',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
];

/**
 * Calculates pace in seconds per kilometer from distance (km) and total time (seconds).
 */
export function calculatePaceSeconds(distanceKm: number, totalSeconds: number): number {
  if (distanceKm <= 0 || totalSeconds <= 0) return 0;
  return totalSeconds / distanceKm;
}

/**
 * Formats pace in seconds per km to standard "M:SS min/km"
 */
export function formatPace(paceSeconds: number): string {
  if (!paceSeconds || paceSeconds <= 0 || !isFinite(paceSeconds)) return '--:-- min/km';
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  if (sec === 60) {
    return `${min + 1}:00 min/km`;
  }
  return `${min}:${sec < 10 ? '0' : ''}${sec} min/km`;
}

/**
 * Calculates speed in km/h from distance (km) and total time (seconds)
 */
export function calculateSpeedKmh(distanceKm: number, totalSeconds: number): number {
  if (distanceKm <= 0 || totalSeconds <= 0) return 0;
  const hours = totalSeconds / 3600;
  return Number((distanceKm / hours).toFixed(2));
}

/**
 * Calculates distance in km from speed (km/h) and total time (seconds)
 */
export function calculateDistanceFromSpeed(speedKmh: number, totalSeconds: number): number {
  if (speedKmh <= 0 || totalSeconds <= 0) return 0;
  const hours = totalSeconds / 3600;
  return Number((speedKmh * hours).toFixed(2));
}

/**
 * Formats total seconds to "MM:SS" or "HH:MM:SS"
 */
export function formatCardioDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds > 0 ? `${seconds}s` : ''}`.trim();
  }
  return `${seconds} s`;
}

/**
 * Helper description for RPE (1-10)
 */
export function getRpeDescription(rpe: number): {
  label: string;
  desc: string;
  colorClass: string;
} {
  switch (rpe) {
    case 1:
    case 2:
      return {
        label: 'Muy Suave',
        desc: 'Paseo regenerativo, sin esfuerzo, respiración natural',
        colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-500/30',
      };
    case 3:
    case 4:
      return {
        label: 'Cómodo / Fácil',
        desc: 'Puedes hablar oraciones enteras sin jadear',
        colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30',
      };
    case 5:
    case 6:
      return {
        label: 'Moderado',
        desc: 'Empiezas a sudar, puedes hablar frases cortas',
        colorClass: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-500/30',
      };
    case 7:
    case 8:
      return {
        label: 'Exigente / Fuerte',
        desc: 'Respiración agitada, solo puedes responder con monosílabos',
        colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30',
      };
    case 9:
      return {
        label: 'Muy Duro / Agotador',
        desc: 'Paso casi al límite, no puedes hablar, máxima concentración',
        colorClass: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-500/30',
      };
    case 10:
    default:
      return {
        label: 'Esfuerzo Máximo',
        desc: 'Sprint total al fallo, no se puede sostener más tiempo',
        colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-500/30',
      };
  }
}

/**
 * Initial sample cardio workouts so user can immediately see chart & history
 */
export function getSampleCardioWorkouts(): CardioWorkout[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const formatDate = (daysAgo: number) => {
    const d = new Date(now - daysAgo * dayMs);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'sample-cardio-1',
      date: formatDate(6),
      timestamp: now - 6 * dayMs,
      location: 'street',
      cardioType: 'recovery_walk',
      distanceKm: 3.5,
      durationMinutes: 35,
      durationSeconds: 0,
      totalDurationSeconds: 2100,
      paceMinPerKm: '10:00 min/km',
      paceSecondsPerKm: 600,
      speedKmh: 6.0,
      rpe: 3,
      notes: 'Paseo activo por el parque tras día de piernas',
    },
    {
      id: 'sample-cardio-2',
      date: formatDate(4),
      timestamp: now - 4 * dayMs,
      location: 'treadmill',
      cardioType: 'steady_easy_jog',
      distanceKm: 5.0,
      durationMinutes: 28,
      durationSeconds: 30,
      totalDurationSeconds: 1710,
      paceMinPerKm: '5:42 min/km',
      paceSecondsPerKm: 342,
      speedKmh: 10.53,
      rpe: 6,
      notes: 'Cinta en gimnasio, ritmo muy cómodo y constante',
    },
    {
      id: 'sample-cardio-3',
      date: formatDate(2),
      timestamp: now - 2 * dayMs,
      location: 'track',
      cardioType: 'intervals_sprints',
      distanceKm: 4.2,
      durationMinutes: 22,
      durationSeconds: 40,
      totalDurationSeconds: 1360,
      paceMinPerKm: '5:24 min/km',
      paceSecondsPerKm: 324,
      speedKmh: 11.12,
      rpe: 8,
      notes: '6 series de 400m con 1 minuto de caminata',
    },
  ];
}
