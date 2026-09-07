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

export function generateSampleSets(): WorkoutSet[] {
  const baseTimestamp = Date.now() - 14 * 86400000;
  const day = 86400000;

  return [
    // 2 weeks ago - Torso
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
