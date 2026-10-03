import { SetStyle } from '../types';

export interface SetStyleOption {
  id: SetStyle;
  label: string;
  shortBadge: string;
  description: string;
  badgeClasses: string;
  dotColor: string;
}

export const SET_STYLES: SetStyleOption[] = [
  {
    id: 'normal',
    label: 'Serie Normal',
    shortBadge: 'Normal',
    description: 'Serie estándar con descanso completo entre series.',
    badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'dropset',
    label: 'Drop Set (Descendente)',
    shortBadge: 'Drop Set',
    description: 'Registra en 1 serie los pesos decrecientes consecutivos (ej. 100kg-10, 80kg-8, 60kg-5) ejecutados sin descanso.',
    badgeClasses: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'superset',
    label: 'Superset (Superserie)',
    shortBadge: 'Superset',
    description: 'Dos ejercicios combinados de grupos musculares distintos o antagonistas sin descanso intermedio.',
    badgeClasses: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-700/60',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'biserie',
    label: 'Biserie',
    shortBadge: 'Biserie',
    description: 'Dos ejercicios seguidos enfocados en el mismo grupo muscular sin pausa.',
    badgeClasses: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-700/60',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'triserie',
    label: 'Triserie',
    shortBadge: 'Triserie',
    description: 'Tres ejercicios seguidos sin descanso.',
    badgeClasses: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-700/60',
    dotColor: 'bg-cyan-500',
  },
  {
    id: 'rest_pause',
    label: 'Rest-Pause',
    shortBadge: 'Rest-Pause',
    description: 'Alcanzar el fallo, descansar 10-15 segundos y sacar 2-4 repeticiones extra.',
    badgeClasses: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/60',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'myo_reps',
    label: 'Myo-Reps',
    shortBadge: 'Myo-Reps',
    description: 'Serie de activación seguida de micro-series de 3-5 repeticiones con descansos de 5 respiraciones.',
    badgeClasses: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/70 dark:text-fuchsia-300 dark:border-fuchsia-700/60',
    dotColor: 'bg-fuchsia-500',
  },
  {
    id: 'top_set',
    label: 'Top Set (Pesada)',
    shortBadge: 'Top Set',
    description: 'La serie principal más pesada de la sesión para máxima intensidad.',
    badgeClasses: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/60',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'back_off',
    label: 'Back-off Set',
    shortBadge: 'Back-off',
    description: 'Serie de descarga con menor peso pero alto volumen tras la Top Set.',
    badgeClasses: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-700/60',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'warmup',
    label: 'Calentamiento / Aproximación',
    shortBadge: 'Warm-up',
    description: 'Serie previa para activar articulaciones y sistema nervioso sin generar fatiga.',
    badgeClasses: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    dotColor: 'bg-zinc-400',
  },
  {
    id: 'failure',
    label: 'Al fallo / AMRAP',
    shortBadge: 'Al Fallo',
    description: 'Hasta el fallo muscular concéntrico total o tantas repeticiones como sea posible.',
    badgeClasses: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-700/60',
    dotColor: 'bg-red-500',
  },
  {
    id: 'custom',
    label: 'Personalizado',
    shortBadge: 'Especial',
    description: 'Estilo de serie personalizado por el usuario.',
    badgeClasses: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700/60',
    dotColor: 'bg-teal-500',
  },
];

export function getSetStyleConfig(style?: SetStyle, customName?: string): SetStyleOption {
  if (!style || style === 'normal') {
    return SET_STYLES[0];
  }
  const found = SET_STYLES.find((s) => s.id === style);
  if (found) {
    if (style === 'custom' && customName) {
      return {
        ...found,
        label: customName,
        shortBadge: customName,
      };
    }
    return found;
  }
  return SET_STYLES[0];
}
