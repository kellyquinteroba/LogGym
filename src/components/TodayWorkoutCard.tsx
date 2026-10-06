import React, { useState } from 'react';
import { WorkoutSet, Exercise, WeeklySchedule, DayOfWeek } from '../types';
import { DAY_CONFIG, getTodayDayOfWeek } from '../utils/schedule';
import { calculateSetVolume, sortExercisesAlphabetically } from '../utils/calculations';
import { getSetStyleConfig } from '../utils/setStyles';
import {
  Calendar,
  Plus,
  Trash2,
  Dumbbell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Flame,
  Settings,
  RotateCcw,
  Check,
  ChevronUp,
} from 'lucide-react';

interface TodayWorkoutCardProps {
  schedule: WeeklySchedule;
  exercises: Exercise[];
  sets: WorkoutSet[];
  todayDate: string; // YYYY-MM-DD
  todayExerciseIds: string[];
  onUpdateTodayExerciseIds: (ids: string[]) => void;
  onSelectExerciseForLog: (exerciseId: string, routineName?: string) => void;
  onOpenPlanner: () => void;
  onOpenNewExerciseModal?: () => void;
  onQuickLogSet?: (exerciseId: string, weightKg: number, reps: number, rpe?: number) => void;
}

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({
  schedule,
  exercises,
  sets,
  todayDate,
  todayExerciseIds,
  onUpdateTodayExerciseIds,
  onSelectExerciseForLog,
  onOpenPlanner,
  onOpenNewExerciseModal,
}) => {
  const currentDayKey = getTodayDayOfWeek(todayDate);
  const [selectedDayKey, setSelectedDayKey] = useState<DayOfWeek>(currentDayKey);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [exerciseToAdd, setExerciseToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const scheduledDay = schedule[selectedDayKey] || schedule.monday;
  const dayCfg = DAY_CONFIG[selectedDayKey];
  const isActualToday = selectedDayKey === currentDayKey;

  // Filter sets done TODAY for today's date
  const todaySets = sets.filter((s) => s.date === todayDate);

  // Exercise map for fast lookup
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((ex) => exerciseMap.set(ex.id, ex));

  // Count total sets completed today in this workout
  const totalSetsToday = todaySets.length;
  const totalVolumeToday = todaySets.reduce((sum, s) => sum + calculateSetVolume(s), 0);

  // Active exercises for today's workout
  const activeExerciseIds = todayExerciseIds;

  const handleRemoveExerciseFromToday = (exerciseId: string) => {
    onUpdateTodayExerciseIds(activeExerciseIds.filter((id) => id !== exerciseId));
  };

  const handleAddExerciseToToday = (exerciseId: string) => {
    if (!exerciseId || activeExerciseIds.includes(exerciseId)) return;
    onUpdateTodayExerciseIds([...activeExerciseIds, exerciseId]);
    setExerciseToAdd('');
    setIsAddExerciseOpen(false);
  };

  const handleResetToScheduled = () => {
    const defaultIds = scheduledDay.exercises.map((e) => e.exerciseId);
    onUpdateTodayExerciseIds(defaultIds);
  };

  const handleSwitchDayRoutine = (dayKey: DayOfWeek) => {
    setSelectedDayKey(dayKey);
    const dayRoutine = schedule[dayKey];
    if (dayRoutine) {
      onUpdateTodayExerciseIds(dayRoutine.exercises.map((e) => e.exerciseId));
    }
  };

  // Available exercises to add that aren't already in today's session, sorted alphabetically
  const remainingExercises = sortExercisesAlphabetically(
    exercises.filter(
      (ex) =>
        !activeExerciseIds.includes(ex.id) &&
        (searchTerm === '' ||
          ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div
      id="today-workout-block"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-all"
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-[#0e7490] dark:from-cyan-950 dark:to-slate-900 text-white p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{dayCfg.emoji}</span>
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase bg-white/20 dark:bg-cyan-500/20 px-2 py-0.5 rounded-full text-white">
                {isActualToday ? `Hoy ${dayCfg.label}` : `Rutina de ${dayCfg.label}`}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {scheduledDay.name || 'Entrenamiento del día'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Planner shortcut */}
            <button
              type="button"
              onClick={onOpenPlanner}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Programar qué toca cada día de la semana"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Day Switcher Pills */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayOfWeek[]).map(
              (dk) => {
                const cfg = DAY_CONFIG[dk];
                const isSelected = selectedDayKey === dk;
                const isRealToday = currentDayKey === dk;
                return (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => handleSwitchDayRoutine(dk)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white text-[#0e7490] shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white/90'
                    }`}
                  >
                    <span>{cfg.short}</span>
                    {isRealToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Día actual" />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Today's live stats counter */}
        {totalSetsToday > 0 && (
          <div className="mt-2.5 flex items-center justify-between text-xs bg-black/20 rounded-xl px-3 py-1.5">
            <span className="text-white/90 font-medium">
              Progreso hoy: <strong>{totalSetsToday} series</strong>
            </span>
            <span className="text-amber-300 font-extrabold">
              {totalVolumeToday.toLocaleString()} kg levantados
            </span>
          </div>
        )}
      </div>

      {/* Main Body: Scheduled Exercises Block */}
      <div className="p-4">
        {scheduledDay.isRestDay && activeExerciseIds.length === 0 ? (
          <div className="py-6 text-center">
            <span className="text-3xl mb-2 block">🌿</span>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
              Día de descanso programado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 mb-3">
              Hoy está agendado como día de descanso para recuperación y crecimiento muscular.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(true)}
                className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Entrenar de todos modos
              </button>
              <button
                type="button"
                onClick={onOpenPlanner}
                className="text-xs text-slate-600 dark:text-slate-400 font-semibold px-3 py-1.5 hover:underline"
              >
                Editar plan
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-[#0e7490] dark:text-cyan-400" />
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ejercicios programados ({activeExerciseIds.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToScheduled}
                  className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
                  title="Restablecer a la lista original programada para este día"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen((prev) => !prev)}
                  className="text-xs font-bold text-[#0e7490] dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir extra
                </button>
              </div>
            </div>

            {/* List of exercises ready for today */}
            {activeExerciseIds.length === 0 ? (
              <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  No hay ejercicios en la lista de hoy.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="bg-[#0e7490] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  + Añadir un ejercicio
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeExerciseIds.map((exId, index) => {
                  const ex = exerciseMap.get(exId);
                  if (!ex) return null;

                  // Sets recorded for this exercise TODAY
                  const exSetsToday = todaySets.filter((s) => s.exerciseId === exId);
                  const isCompleted = exSetsToday.length > 0;

                  return (
                    <div
                      key={exId}
                      className={`p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-teal-50/40 dark:bg-cyan-950/20 border-teal-200/80 dark:border-cyan-900/40'
                          : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {ex.name}
                              </h4>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-teal-800 dark:text-cyan-300 bg-teal-100/90 dark:bg-cyan-950 px-1.5 py-0.2 rounded-md">
                                  <Check className="w-3 h-3" /> {exSetsToday.length} series
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {ex.category}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Log set for this exercise */}
                          <button
                            type="button"
                            onClick={() => onSelectExerciseForLog(ex.id, scheduledDay.name)}
                            className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
                            title={`Registrar serie para ${ex.name}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Serie</span>
                          </button>

                          {/* Remove from today's list */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseFromToday(ex.id)}
                            className="text-slate-300 dark:text-slate-600 hover:text-rose-500 p-1.5 rounded-md transition-colors"
                            title="Quitar de la sesión de hoy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display series registered today for this exercise */}
                      {exSetsToday.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            {exSetsToday.map((s) => {
                              const styleCfg = s.setStyle ? getSetStyleConfig(s.setStyle, s.customStyleName) : null;
                              return (
                                <span
                                  key={s.id}
                                  className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1"
                                >
                                  <span className="text-slate-400 text-[10px]">S{s.setNumber}:</span>
                                  <span>{s.weightKg}kg × {s.reps}</span>
                                  {styleCfg && s.setStyle !== 'normal' && (
                                    <span
                                      className={`text-[9px] font-extrabold px-1 py-0.2 rounded ${styleCfg.badgeClasses}`}
                                    >
                                      {styleCfg.shortBadge}
                                    </span>
                                  )}
                                  {s.dropStages && s.dropStages.length > 0 && (
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold">
                                      (+{s.dropStages.length} drops)
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Extra Exercise to Today (Expandable) */}
            {isAddExerciseOpen && (
              <div className="mt-3 p-3 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Añadir ejercicio extra para hoy:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddExerciseOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar ejercicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />

                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700/60 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    {remainingExercises.length === 0 ? (
                      <p className="p-2.5 text-xs text-slate-400 text-center">
                        No se encontraron más ejercicios.
                      </p>
                    ) : (
                      remainingExercises.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleAddExerciseToToday(ex.id)}
                          className="w-full p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {ex.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{ex.category}</p>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
