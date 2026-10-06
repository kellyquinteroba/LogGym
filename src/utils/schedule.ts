import { DayOfWeek, DaySchedule, WeeklySchedule, Exercise } from '../types';

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
