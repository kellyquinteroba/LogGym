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

export interface PlannedExercise {
  exerciseId: string;
  targetSets?: number;
  targetReps?: string;
  notes?: string;
}

export interface DaySchedule {
  day: DayOfWeek;
  name: string; // e.g. "Espalda y Bíceps", "Cuádriceps"
  muscleGroups?: string;
  exercises: PlannedExercise[];
  isRestDay?: boolean;
}

export type WeeklySchedule = Record<DayOfWeek, DaySchedule>;

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

export type TabType = 'home' | 'planner' | 'workouts' | 'progress' | 'exercises';
