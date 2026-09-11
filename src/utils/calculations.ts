import { WorkoutSet } from '../types';

export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  // Brzycki formula with safe ceiling
  if (reps > 30) reps = 30;
  const brzycki = weightKg / (1.0278 - 0.0278 * reps);
  return Math.round(brzycki * 10) / 10;
}

export function calculateTotalVolume(sets: WorkoutSet[]): number {
  return sets.reduce((acc, s) => acc + (s.weightKg * s.reps), 0);
}

export function calculateAverageRPE(sets: WorkoutSet[]): number {
  if (sets.length === 0) return 0;
  const sum = sets.reduce((acc, s) => acc + (s.rpe || 0), 0);
  return Math.round((sum / sets.length) * 10) / 10;
}

export function calculatePeakLoad(sets: WorkoutSet[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map(s => s.weightKg || 0));
}

export function countUniqueSessions(sets: WorkoutSet[]): number {
  const dates = new Set(sets.map(s => s.date));
  return dates.size;
}

export function formatTimeSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getTodayDateString(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayDateString();

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);

    // Check if yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yyyyY = yesterdayDate.getFullYear();
    const mmY = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
    const ddY = String(yesterdayDate.getDate()).padStart(2, '0');
    const yesterdayStr = `${yyyyY}-${mmY}-${ddY}`;

    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const formatted = dateObj.toLocaleDateString('es-ES', options);
    const capFormatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    if (dateStr === today) {
      return `Hoy (${capFormatted})`;
    }
    if (dateStr === yesterdayStr) {
      return `Ayer (${capFormatted})`;
    }
    return `${capFormatted} · ${y}`;
  }
  return dateStr;
}

export function sortSetsChronological(
  setsList: WorkoutSet[],
  direction: 'asc' | 'desc' = 'desc'
): WorkoutSet[] {
  return [...setsList].sort((a, b) => {
    // 1. Primary order: Date
    if (a.date !== b.date) {
      return direction === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    }
    // 2. Within the same date: preserve chronological order of exercise execution/entry
    if ((a.timestamp || 0) !== (b.timestamp || 0)) {
      return (a.timestamp || 0) - (b.timestamp || 0);
    }
    // 3. Fallback: by setNumber
    return a.setNumber - b.setNumber;
  });
}

export function generateSampleSets(): WorkoutSet[] {
  const baseTimestamp = Date.now() - 14 * 86400000;
  const day = 86400000;

  const todayStr = getTodayDateString();
  const todayBase = Date.now() - 3 * 3600000;

  return [
    // Today session - Exactly matches user's request example:
    // 1st: Press Militar (series 1, 2, 3)
    // 2nd: Extensión de tríceps (series 1, 2, 3)
    // 3rd: Press de Banca Plano (series 1, 2, 3)
    {
      id: 'today-1',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-4',
      exerciseName: 'Press Militar',
      setNumber: 1,
      weightKg: 45,
      reps: 10,
      rpe: 7.5,
      restSeconds: 90,
      notes: 'Serie de activación con técnica estricta',
      timestamp: todayBase,
    },
    {
      id: 'today-2',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-4',
      exerciseName: 'Press Militar',
      setNumber: 2,
      weightKg: 50,
      reps: 8,
      rpe: 8,
      restSeconds: 90,
      notes: 'Buena potencia y bloqueo arriba',
      timestamp: todayBase + 120000,
    },
    {
      id: 'today-3',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-4',
      exerciseName: 'Press Militar',
      setNumber: 3,
      weightKg: 52.5,
      reps: 6,
      rpe: 9,
      restSeconds: 120,
      notes: 'Última repetición exigente pero limpia',
      timestamp: todayBase + 240000,
    },
    {
      id: 'today-4',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-12',
      exerciseName: 'Extensión de Tríceps',
      setNumber: 1,
      weightKg: 25,
      reps: 12,
      rpe: 7.5,
      restSeconds: 60,
      notes: 'Codos pegados al cuerpo, recorrido completo',
      timestamp: todayBase + 400000,
    },
    {
      id: 'today-5',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-12',
      exerciseName: 'Extensión de Tríceps',
      setNumber: 2,
      weightKg: 30,
      reps: 10,
      rpe: 8,
      restSeconds: 60,
      notes: 'Buen bombeo en la fase excéntrica',
      timestamp: todayBase + 520000,
    },
    {
      id: 'today-6',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-12',
      exerciseName: 'Extensión de Tríceps',
      setNumber: 3,
      weightKg: 32.5,
      reps: 8,
      rpe: 8.5,
      restSeconds: 75,
      notes: 'Drop set suave al fallo técnico',
      timestamp: todayBase + 640000,
    },
    {
      id: 'today-7',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 1,
      weightKg: 75,
      reps: 8,
      rpe: 8,
      restSeconds: 120,
      notes: 'Retracción escapular firme y control',
      timestamp: todayBase + 800000,
    },
    {
      id: 'today-8',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 2,
      weightKg: 80,
      reps: 6,
      rpe: 8.5,
      restSeconds: 120,
      notes: 'Rumbo al récord',
      timestamp: todayBase + 940000,
    },
    {
      id: 'today-9',
      date: todayStr,
      routine: 'Torso & Brazos',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 3,
      weightKg: 82.5,
      reps: 5,
      rpe: 9,
      restSeconds: 150,
      notes: 'Gran congestión y fatiga acumulada',
      timestamp: todayBase + 1080000,
    },
    // Previous sessions (Older)
    // 6 days ago - Torso B
    {
      id: 'sample-1',
      date: new Date(baseTimestamp).toISOString().split('T')[0],
      routine: 'Torso A',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 1,
      weightKg: 70,
      reps: 8,
      rpe: 7,
      restSeconds: 90,
      notes: 'Buen calentamiento y estabilidad escapular',
      timestamp: baseTimestamp + 3600000,
    },
    {
      id: 'sample-2',
      date: new Date(baseTimestamp).toISOString().split('T')[0],
      routine: 'Torso A',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 2,
      weightKg: 75,
      reps: 8,
      rpe: 8,
      restSeconds: 120,
      notes: 'Velocidad controlada',
      timestamp: baseTimestamp + 3720000,
    },
    {
      id: 'sample-3',
      date: new Date(baseTimestamp).toISOString().split('T')[0],
      routine: 'Torso A',
      exerciseId: 'ex-6',
      exerciseName: 'Remo en máquina',
      setNumber: 1,
      weightKg: 60,
      reps: 10,
      rpe: 7.5,
      restSeconds: 90,
      notes: 'Pausa en contracción',
      timestamp: baseTimestamp + 4000000,
    },
    // 10 days ago - Pierna
    {
      id: 'sample-4',
      date: new Date(baseTimestamp + 3 * day).toISOString().split('T')[0],
      routine: 'Pierna Enfoque Cuádriceps',
      exerciseId: 'ex-1',
      exerciseName: 'Sentadilla Libre',
      setNumber: 1,
      weightKg: 90,
      reps: 6,
      rpe: 7.5,
      restSeconds: 150,
      notes: 'Buena profundidad y cadera estable',
      timestamp: baseTimestamp + 3 * day + 3600000,
    },
    {
      id: 'sample-5',
      date: new Date(baseTimestamp + 3 * day).toISOString().split('T')[0],
      routine: 'Pierna Enfoque Cuádriceps',
      exerciseId: 'ex-1',
      exerciseName: 'Sentadilla Libre',
      setNumber: 2,
      weightKg: 100,
      reps: 6,
      rpe: 8.5,
      restSeconds: 180,
      notes: 'Récord personal de la temporada',
      timestamp: baseTimestamp + 3 * day + 3800000,
    },
    {
      id: 'sample-6',
      date: new Date(baseTimestamp + 3 * day).toISOString().split('T')[0],
      routine: 'Pierna Enfoque Cuádriceps',
      exerciseId: 'ex-3',
      exerciseName: 'Peso Muerto Rumano',
      setNumber: 1,
      weightKg: 80,
      reps: 10,
      rpe: 8,
      restSeconds: 120,
      notes: 'Sentí gran elongación en isquios',
      timestamp: baseTimestamp + 3 * day + 4200000,
    },
    // 6 days ago - Torso B
    {
      id: 'sample-7',
      date: new Date(baseTimestamp + 7 * day).toISOString().split('T')[0],
      routine: 'Torso B',
      exerciseId: 'ex-2',
      exerciseName: 'Press de Banca Plano',
      setNumber: 1,
      weightKg: 77.5,
      reps: 7,
      rpe: 8,
      restSeconds: 120,
      notes: 'Subiendo peso progresivamente',
      timestamp: baseTimestamp + 7 * day + 3600000,
    },
    {
      id: 'sample-8',
      date: new Date(baseTimestamp + 7 * day).toISOString().split('T')[0],
      routine: 'Torso B',
      exerciseId: 'ex-4',
      exerciseName: 'Press Militar',
      setNumber: 1,
      weightKg: 45,
      reps: 8,
      rpe: 8,
      restSeconds: 90,
      notes: 'Buena verticalidad',
      timestamp: baseTimestamp + 7 * day + 4000000,
    },
    // 2 days ago - Glúteo y Pierna
    {
      id: 'sample-9',
      date: new Date(baseTimestamp + 11 * day).toISOString().split('T')[0],
      routine: 'Pierna & Glúteo',
      exerciseId: 'ex-5',
      exerciseName: 'Hip Thrust Libre',
      setNumber: 1,
      weightKg: 110,
      reps: 10,
      rpe: 8,
      restSeconds: 120,
      notes: 'Pausa arriba de 1.5 segundos',
      timestamp: baseTimestamp + 11 * day + 3600000,
    },
    {
      id: 'sample-10',
      date: new Date(baseTimestamp + 11 * day).toISOString().split('T')[0],
      routine: 'Pierna & Glúteo',
      exerciseId: 'ex-1',
      exerciseName: 'Sentadilla Libre',
      setNumber: 1,
      weightKg: 105,
      reps: 5,
      rpe: 8.5,
      restSeconds: 180,
      notes: 'Sensación de fuerza sólida',
      timestamp: baseTimestamp + 11 * day + 4100000,
    }
  ];
}
