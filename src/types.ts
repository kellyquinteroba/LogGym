export type MuscleGroup = 
  | 'Pierna / Cuádriceps'
  | 'Isquiotibiales / Glúteo'
  | 'Glúteos'
  | 'Pecho / Torso'
  | 'Espalda'
  | 'Hombros'
  | 'Brazos'
  | 'Core / Abdomen'
  | 'Cuerpo Completo';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  cues: string;
  isCustom?: boolean;
}

export type SetStyle =
  | 'normal'
  | 'dropset'
  | 'superset'
  | 'biserie'
  | 'triserie'
  | 'rest_pause'
  | 'myo_reps'
  | 'top_set'
  | 'back_off'
  | 'warmup'
  | 'failure'
  | 'custom';

export interface DropStage {
  weightKg: number;
  reps: number;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type MesocycleType =
  | 'hipertrofia'
  | 'fuerza'
  | 'fuerza_hipertrofia'
  | 'resistencia'
  | 'descarga'
  | 'personalizado';

export interface MesocycleConfig {
  id?: string;
  name: string; // e.g. "Hipertrofia & Volumen", "Fuerza Máxima"
  type: MesocycleType;
  currentWeek: number; // e.g. 1
  totalWeeks: number; // e.g. 4
  defaultSets: number; // e.g. 4
  defaultReps: string; // e.g. "8-12"
  targetRir?: string; // e.g. "RIR 1-2"
  focusNotes?: string; // e.g. "Sobrecarga progresiva y congestión"
}

export interface PlannedExercise {
  exerciseId: string;
  targetSets?: number;
  targetReps?: string;
  targetRir?: string;
  mesocycleNotes?: string;
  notes?: string;
}

export interface DaySchedule {
  day: DayOfWeek;
  name: string; // e.g. "Espalda y Bíceps", "Cuádriceps"
  muscleGroups?: string;
  exercises: PlannedExercise[];
  isRestDay?: boolean;
}

export type WeeklySchedule = Record<DayOfWeek, DaySchedule> & {
  mesocycle?: MesocycleConfig;
};

export interface WorkoutSet {
  id: string;
  date: string; // YYYY-MM-DD
  routine: string; // e.g., "Torso A", "Pierna", "Empuje"
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number; // 1 to 10
  restSeconds: number; // Rest taken or planned (e.g. 60, 90, 120s)
  notes?: string;
  timestamp: number;
  setStyle?: SetStyle;
  customStyleName?: string;
  pairedExerciseName?: string; // Optional: linked exercise name for superset/biserie
  dropStages?: DropStage[]; // Array of weight/reps stages within a single drop set
}

export type CardioLocation = 'treadmill' | 'street' | 'track';

export type CardioType =
  | 'recovery_walk'      // Caminata rápida / Recuperación
  | 'steady_easy_jog'    // Trote continuo / Suave
  | 'intervals_sprints'  // Intervalos / Piques
  | 'tempo_pace';        // Ritmo fuerte constante

export interface CardioWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  location: CardioLocation; // 'treadmill' | 'street' | 'track'
  cardioType: CardioType;
  distanceKm: number;
  durationMinutes: number;
  durationSeconds: number;
  totalDurationSeconds: number;
  paceMinPerKm: string; // e.g. "5:30 min/km"
  paceSecondsPerKm: number; // numeric pace in seconds for calculations & charts
  speedKmh: number; // km/h
  rpe: number; // 1 to 10
  notes?: string;
  inputMode?: 'distance_time' | 'speed_time';
}

export type TabType = 'home' | 'planner' | 'workouts' | 'cardio' | 'progress' | 'exercises';
