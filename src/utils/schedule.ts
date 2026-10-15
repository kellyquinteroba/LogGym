import { DayOfWeek, DaySchedule, WeeklySchedule, Exercise, MesocycleType, MesocycleConfig } from '../types';

export interface MesocycleProfile {
  type: MesocycleType;
  name: string;
  shortLabel: string;
  description: string;
  defaultSets: number;
  defaultReps: string;
  targetRir: string;
  defaultWeeks: number;
  badgeColor: string;
  emoji: string;
  tips: string;
}

export const MESOCYCLE_PROFILES: MesocycleProfile[] = [
  {
    type: 'hipertrofia',
    name: 'Hipertrofia (Volumen y Crecimiento)',
    shortLabel: 'Hipertrofia',
    description: 'Enfoque en ganancia de masa muscular mediante volumen moderado-alto y rango de 8 a 12 repeticiones.',
    defaultSets: 4,
    defaultReps: '8-12',
    targetRir: 'RIR 1-2',
    defaultWeeks: 4,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    emoji: '💪',
    tips: 'Asegura tensión mecánica continua y mantén 1-2 repeticiones en recámara (RIR 1-2) en series efectivas.',
  },
  {
    type: 'fuerza',
    name: 'Fuerza Máxima (Intensificación)',
    shortLabel: 'Fuerza',
    description: 'Enfoque en mover cargas altas (>80-85% 1RM), series pesadas de 3 a 6 repeticiones y descansos completos.',
    defaultSets: 4,
    defaultReps: '3-6',
    targetRir: 'RIR 1-2',
    defaultWeeks: 4,
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    emoji: '⚡',
    tips: 'Descansos completos de 2 a 3 minutos entre series para recuperar los depósitos de fosfocreatina.',
  },
  {
    type: 'fuerza_hipertrofia',
    name: 'Fuerza - Hipertrofia (Híbrido)',
    shortLabel: 'Fuerza-Hipertrofia',
    description: 'Equilibrio perfecto: progresión de fuerza en básicos multiarticulares y volumen en accesorios.',
    defaultSets: 4,
    defaultReps: '6-10',
    targetRir: 'RIR 2',
    defaultWeeks: 5,
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    emoji: '🎯',
    tips: 'Ideal para progresar en cargas principales sin sacrificar hipertrofia ni congestión muscular.',
  },
  {
    type: 'resistencia',
    name: 'Resistencia Muscular & Bombeo',
    shortLabel: 'Resistencia',
    description: 'Mayor densidad metabólica, altas repeticiones (12 a 15+) y descansos breves para tolerancia al lactato.',
    defaultSets: 3,
    defaultReps: '12-15',
    targetRir: 'RIR 1-3',
    defaultWeeks: 3,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    emoji: '🔥',
    tips: 'Descansos más cortos (45-60s) con técnica muy controlada y gran bombeo muscular.',
  },
  {
    type: 'descarga',
    name: 'Descarga / Deload Activo',
    shortLabel: 'Descarga',
    description: 'Semana de descompresión para reducir la fatiga central y articular reduciendo el volumen a la mitad.',
    defaultSets: 2,
    defaultReps: '6-10',
    targetRir: 'RIR 3-4',
    defaultWeeks: 1,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    emoji: '🌿',
    tips: 'Mantén los pesos habituales pero reduce a la mitad el número de series. Entrena lejos del fallo.',
  },
  {
    type: 'personalizado',
    name: 'Mesociclo Personalizado',
    shortLabel: 'Personalizado',
    description: 'Diseño propio adaptado a tus necesidades específicas de series, repeticiones y microciclos.',
    defaultSets: 4,
    defaultReps: '8-12',
    targetRir: 'Personalizado',
    defaultWeeks: 4,
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    emoji: '✨',
    tips: 'Ajusta las series y repeticiones objetivo ejercicio por ejercicio según tu planificación.',
  },
];

export const DEFAULT_MESOCYCLE: MesocycleConfig = {
  name: 'Hipertrofia (Volumen y Crecimiento)',
  type: 'hipertrofia',
  currentWeek: 1,
  totalWeeks: 4,
  defaultSets: 4,
  defaultReps: '8-12',
  targetRir: 'RIR 1-2',
  focusNotes: 'Sobrecarga progresiva y acumulación de volumen semanal.',
};

export function getMesocycleConfig(schedule?: WeeklySchedule): MesocycleConfig {
  if (schedule && schedule.mesocycle) {
    return schedule.mesocycle;
  }
  return DEFAULT_MESOCYCLE;
}

export const DAY_KEYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_CONFIG: Record<
  DayOfWeek,
  { label: string; short: string; order: number; emoji: string }
> = {
  monday: { label: 'Lunes', short: 'Lun', order: 1, emoji: '⚡' },
  tuesday: { label: 'Martes', short: 'Mar', order: 2, emoji: '🔥' },
  wednesday: { label: 'Miércoles', short: 'Mié', order: 3, emoji: '💪' },
  thursday: { label: 'Jueves', short: 'Jue', order: 4, emoji: '🎯' },
  friday: { label: 'Viernes', short: 'Vie', order: 5, emoji: '🚀' },
  saturday: { label: 'Sábado', short: 'Sáb', order: 6, emoji: '✨' },
  sunday: { label: 'Domingo', short: 'Dom', order: 7, emoji: '🌿' },
};

/**
 * Returns the current day of the week key ('monday' ... 'sunday')
 * based on a date string YYYY-MM-DD or the current local time.
 */
export function getTodayDayOfWeek(dateStr?: string): DayOfWeek {
  let date: Date;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date();
    }
  } else {
    date = new Date();
  }

  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const map: Record<number, DayOfWeek> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return map[dayIndex] || 'monday';
}

/**
 * Default initial weekly schedule matching user's requested layout:
 * Lunes espalda y bíceps, martes cuádriceps, etc.
 */
export const INITIAL_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: {
    day: 'monday',
    name: 'Espalda y Bíceps',
    muscleGroups: 'Espalda & Brazos',
    exercises: [
      { exerciseId: 'ex-8', targetSets: 4, targetReps: '8-10' }, // Dominadas
      { exerciseId: 'ex-6', targetSets: 4, targetReps: '10-12' }, // Remo en máquina
      { exerciseId: 'ex-17', targetSets: 3, targetReps: '10-12' }, // Jalón al pecho
      { exerciseId: 'ex-11', targetSets: 4, targetReps: '10-12' }, // Curl con barra Z
    ],
  },
  tuesday: {
    day: 'tuesday',
    name: 'Cuádriceps y Pierna',
    muscleGroups: 'Pierna / Cuádriceps',
    exercises: [
      { exerciseId: 'ex-1', targetSets: 4, targetReps: '6-8' }, // Sentadilla Libre
      { exerciseId: 'ex-10', targetSets: 4, targetReps: '10-12' }, // Prensa de Piernas
      { exerciseId: 'ex-19', targetSets: 4, targetReps: '12-15' }, // Gemelos
    ],
  },
  wednesday: {
    day: 'wednesday',
    name: 'Pecho y Tríceps',
    muscleGroups: 'Pecho & Brazos',
    exercises: [
      { exerciseId: 'ex-2', targetSets: 4, targetReps: '6-8' }, // Press de Banca Plano
      { exerciseId: 'ex-16', targetSets: 4, targetReps: '8-10' }, // Press Inclinado Mancuernas
      { exerciseId: 'ex-9', targetSets: 3, targetReps: '8-10' }, // Fondos en paralelas
      { exerciseId: 'ex-12', targetSets: 4, targetReps: '10-12' }, // Extensión de Tríceps Polea
    ],
  },
  thursday: {
    day: 'thursday',
    name: 'Hombros y Abdomen',
    muscleGroups: 'Hombros & Core',
    exercises: [
      { exerciseId: 'ex-4', targetSets: 4, targetReps: '8-10' }, // Press Militar
      { exerciseId: 'ex-13', targetSets: 4, targetReps: '12-15' }, // Elevaciones Laterales
      { exerciseId: 'ex-18', targetSets: 3, targetReps: '10-12' }, // Rueda Abdominal
    ],
  },
  friday: {
    day: 'friday',
    name: 'Isquiotibiales y Glúteos',
    muscleGroups: 'Isquiotibiales / Glúteo',
    exercises: [
      { exerciseId: 'ex-3', targetSets: 4, targetReps: '8-10' }, // Peso Muerto Rumano
      { exerciseId: 'ex-5', targetSets: 4, targetReps: '8-10' }, // Hip Thrust
      { exerciseId: 'ex-15', targetSets: 3, targetReps: '10-12' }, // Curl Femoral Tumbado
      { exerciseId: 'ex-7', targetSets: 3, targetReps: '12-15' }, // Abducción
    ],
  },
  saturday: {
    day: 'saturday',
    name: 'Brazos & Accesorios',
    muscleGroups: 'Brazos & Hombros',
    exercises: [
      { exerciseId: 'ex-11', targetSets: 4, targetReps: '10-12' }, // Curl con barra Z
      { exerciseId: 'ex-12', targetSets: 4, targetReps: '10-12' }, // Extensión Tríceps
      { exerciseId: 'ex-13', targetSets: 3, targetReps: '12-15' }, // Elevaciones Laterales
    ],
  },
  sunday: {
    day: 'sunday',
    name: 'Descanso y Recuperación',
    muscleGroups: 'Descanso Activo',
    isRestDay: true,
    exercises: [],
  },
  mesocycle: DEFAULT_MESOCYCLE,
};

export interface SchedulePreset {
  id: string;
  name: string;
  description: string;
  schedule: WeeklySchedule;
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'split_clasico',
    name: 'Rutina Frecuencia 1 (Espalda/Bíceps, Cuádriceps, Pecho/Tríceps...)',
    description: 'La división clásica solicitada con foco por grupos musculares específicos cada día.',
    schedule: INITIAL_WEEKLY_SCHEDULE,
  },
  {
    id: 'push_pull_legs',
    name: 'Empuje / Tirón / Pierna (PPL 6 días)',
    description: 'Lunes y Jueves Empuje, Martes y Viernes Tirón, Miércoles y Sábado Pierna.',
    schedule: {
      monday: {
        day: 'monday',
        name: 'Empuje A (Pecho, Hombro, Tríceps)',
        muscleGroups: 'Pecho, Hombro, Tríceps',
        exercises: [
          { exerciseId: 'ex-2', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-4', targetSets: 3, targetReps: '8-10' },
          { exerciseId: 'ex-16', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-13', targetSets: 4, targetReps: '12-15' },
          { exerciseId: 'ex-12', targetSets: 4, targetReps: '10-12' },
        ],
      },
      tuesday: {
        day: 'tuesday',
        name: 'Tirón A (Espalda, Bíceps, Posterior)',
        muscleGroups: 'Espalda & Bíceps',
        exercises: [
          { exerciseId: 'ex-8', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-6', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-17', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-11', targetSets: 4, targetReps: '10-12' },
        ],
      },
      wednesday: {
        day: 'wednesday',
        name: 'Pierna A (Cuádriceps, Isquios, Gemelos)',
        muscleGroups: 'Pierna Completa',
        exercises: [
          { exerciseId: 'ex-1', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-3', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-10', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-15', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-19', targetSets: 4, targetReps: '12-15' },
        ],
      },
      thursday: {
        day: 'thursday',
        name: 'Empuje B (Hombro, Pecho, Tríceps)',
        muscleGroups: 'Hombro, Pecho, Tríceps',
        exercises: [
          { exerciseId: 'ex-4', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-16', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-9', targetSets: 3, targetReps: '8-10' },
          { exerciseId: 'ex-13', targetSets: 4, targetReps: '12-15' },
          { exerciseId: 'ex-12', targetSets: 4, targetReps: '10-12' },
        ],
      },
      friday: {
        day: 'friday',
        name: 'Tirón B (Espalda, Bíceps)',
        muscleGroups: 'Espalda & Brazos',
        exercises: [
          { exerciseId: 'ex-14', targetSets: 3, targetReps: '5' },
          { exerciseId: 'ex-6', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-8', targetSets: 3, targetReps: '8-10' },
          { exerciseId: 'ex-11', targetSets: 4, targetReps: '10-12' },
        ],
      },
      saturday: {
        day: 'saturday',
        name: 'Pierna B (Glúteo, Isquios, Cuádriceps)',
        muscleGroups: 'Pierna & Glúteo',
        exercises: [
          { exerciseId: 'ex-5', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-1', targetSets: 3, targetReps: '8-10' },
          { exerciseId: 'ex-15', targetSets: 4, targetReps: '10-12' },
          { exerciseId: 'ex-7', targetSets: 3, targetReps: '12-15' },
        ],
      },
      sunday: {
        day: 'sunday',
        name: 'Descanso',
        isRestDay: true,
        exercises: [],
      },
    },
  },
  {
    id: 'torso_pierna',
    name: 'Torso / Pierna (4 días)',
    description: 'Lunes Torso, Martes Pierna, Miércoles Descanso, Jueves Torso, Viernes Pierna.',
    schedule: {
      monday: {
        day: 'monday',
        name: 'Torso A (Fuerza)',
        muscleGroups: 'Pecho, Espalda, Hombro',
        exercises: [
          { exerciseId: 'ex-2', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-6', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-4', targetSets: 3, targetReps: '8-10' },
          { exerciseId: 'ex-8', targetSets: 3, targetReps: '8-10' },
        ],
      },
      tuesday: {
        day: 'tuesday',
        name: 'Pierna A (Cuádriceps & Glúteo)',
        muscleGroups: 'Pierna',
        exercises: [
          { exerciseId: 'ex-1', targetSets: 4, targetReps: '6-8' },
          { exerciseId: 'ex-3', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-10', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-19', targetSets: 4, targetReps: '12-15' },
        ],
      },
      wednesday: {
        day: 'wednesday',
        name: 'Descanso Activo',
        isRestDay: true,
        exercises: [],
      },
      thursday: {
        day: 'thursday',
        name: 'Torso B (Hipertrofia)',
        muscleGroups: 'Pecho, Espalda, Brazos',
        exercises: [
          { exerciseId: 'ex-16', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-17', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-13', targetSets: 4, targetReps: '12-15' },
          { exerciseId: 'ex-11', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-12', targetSets: 3, targetReps: '10-12' },
        ],
      },
      friday: {
        day: 'friday',
        name: 'Pierna B (Cadena Posterior)',
        muscleGroups: 'Glúteo & Isquiotibiales',
        exercises: [
          { exerciseId: 'ex-5', targetSets: 4, targetReps: '8-10' },
          { exerciseId: 'ex-14', targetSets: 3, targetReps: '6-8' },
          { exerciseId: 'ex-15', targetSets: 3, targetReps: '10-12' },
          { exerciseId: 'ex-18', targetSets: 3, targetReps: '12-15' },
        ],
      },
      saturday: {
        day: 'saturday',
        name: 'Descanso',
        isRestDay: true,
        exercises: [],
      },
      sunday: {
        day: 'sunday',
        name: 'Descanso',
        isRestDay: true,
        exercises: [],
      },
    },
  },
];
