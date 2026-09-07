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
}

export type TabType = 'home' | 'workouts' | 'progress' | 'exercises';
