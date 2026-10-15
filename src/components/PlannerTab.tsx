import React, { useState } from 'react';
import {
  WeeklySchedule,
  DayOfWeek,
  Exercise,
  PlannedExercise,
  MesocycleConfig,
  MesocycleType,
} from '../types';
import {
  DAY_KEYS,
  DAY_CONFIG,
  getTodayDayOfWeek,
  SCHEDULE_PRESETS,
  MESOCYCLE_PROFILES,
  DEFAULT_MESOCYCLE,
  getMesocycleConfig,
  MesocycleProfile,
} from '../utils/schedule';
import { sortExercisesAlphabetically } from '../utils/calculations';
import {
  Calendar,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Dumbbell,
  Check,
  RotateCcw,
  Layers,
  ChevronRight,
  Info,
  Play,
  Sliders,
  Flame,
  Zap,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Edit3,
} from 'lucide-react';

interface PlannerTabProps {
  schedule: WeeklySchedule;
  exercises: Exercise[];
  onUpdateSchedule: (newSchedule: WeeklySchedule) => void;
  onGoToTodayWorkout: () => void;
  onOpenNewExerciseModal?: () => void;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({
  schedule,
  exercises,
  onUpdateSchedule,
  onGoToTodayWorkout,
  onOpenNewExerciseModal,
}) => {
  const currentDayKey = getTodayDayOfWeek();
  const [selectedDayKey, setSelectedDayKey] = useState<DayOfWeek>(currentDayKey);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isMesocycleModalOpen, setIsMesocycleModalOpen] = useState(false);
  const [searchExerciseTerm, setSearchExerciseTerm] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const activeMesocycle: MesocycleConfig = getMesocycleConfig(schedule);
  const currentDaySchedule = schedule[selectedDayKey] || schedule.monday;
  const dayCfg = DAY_CONFIG[selectedDayKey];

  // Temporary state for the Mesocycle Modal
  const [modalMesocycle, setModalMesocycle] = useState<MesocycleConfig>(activeMesocycle);
  const [applyToExistingExercises, setApplyToExistingExercises] = useState(true);

  // Map exercises for quick lookup
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((ex) => exerciseMap.set(ex.id, ex));

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 2800);
  };

  // Update routine name
  const handleUpdateDayName = (newName: string) => {
    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        name: newName,
      },
    });
  };

  // Toggle rest day
  const handleToggleRestDay = (isRest: boolean) => {
    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        isRestDay: isRest,
      },
    });
  };

  // Remove exercise from this day
  const handleRemoveExercise = (indexToRemove: number) => {
    const updated = currentDaySchedule.exercises.filter((_, idx) => idx !== indexToRemove);
    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        exercises: updated,
      },
    });
  };

  // Move exercise up/down
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const list = [...currentDaySchedule.exercises];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        exercises: list,
      },
    });
  };

  // Update target sets / reps / rir for a planned exercise
  const handleUpdateExerciseTarget = (index: number, updates: Partial<PlannedExercise>) => {
    const list = [...currentDaySchedule.exercises];
    if (!list[index]) return;
    list[index] = {
      ...list[index],
      ...updates,
    };

    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        exercises: list,
      },
    });
  };

  // Add exercise to this day with mesocycle defaults
  const handleAddExercise = (exerciseId: string) => {
    const alreadyExists = currentDaySchedule.exercises.some((e) => e.exerciseId === exerciseId);
    if (alreadyExists) return;

    const newPlanned: PlannedExercise = {
      exerciseId,
      targetSets: activeMesocycle.defaultSets || 4,
      targetReps: activeMesocycle.defaultReps || '8-12',
      targetRir: activeMesocycle.targetRir || 'RIR 1-2',
    };

    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        isRestDay: false,
        exercises: [...currentDaySchedule.exercises, newPlanned],
      },
    });
    setIsAddExerciseModalOpen(false);
  };

  // Apply a preset template
  const handleApplyPreset = (presetId: string) => {
    const found = SCHEDULE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    if (
      window.confirm(
        `¿Deseas aplicar la plantilla "${found.name}"? Reemplazará tu programación semanal actual.`
      )
    ) {
      onUpdateSchedule({
        ...found.schedule,
        mesocycle: activeMesocycle,
      });
      showNotification(`¡Plantilla "${found.name}" aplicada con éxito!`);
    }
  };

  // Advance or decrease mesocycle week
  const handleStepWeek = (delta: number) => {
    const nextWeek = Math.max(1, Math.min(activeMesocycle.totalWeeks + 1, activeMesocycle.currentWeek + delta));
    onUpdateSchedule({
      ...schedule,
      mesocycle: {
        ...activeMesocycle,
        currentWeek: nextWeek,
      },
    });
    showNotification(`Avanzaste a la Semana ${nextWeek} de ${activeMesocycle.totalWeeks}`);
  };

  // Apply mesocycle default targets to current day
  const handleApplyMesocycleToCurrentDay = () => {
    if (currentDaySchedule.exercises.length === 0) return;
    const updated = currentDaySchedule.exercises.map((pe) => ({
      ...pe,
      targetSets: activeMesocycle.defaultSets,
      targetReps: activeMesocycle.defaultReps,
      targetRir: activeMesocycle.targetRir,
    }));

    onUpdateSchedule({
      ...schedule,
      [selectedDayKey]: {
        ...currentDaySchedule,
        exercises: updated,
      },
    });
    showNotification(`Se aplicaron ${activeMesocycle.defaultSets} series × ${activeMesocycle.defaultReps} reps a los ejercicios de ${dayCfg.label}`);
  };

  // Apply mesocycle default targets to all days in weekly schedule
  const handleApplyMesocycleToEntireWeek = () => {
    const newSchedule = { ...schedule };
    DAY_KEYS.forEach((dayKey) => {
      const day = newSchedule[dayKey];
      if (day && day.exercises && day.exercises.length > 0) {
        newSchedule[dayKey] = {
          ...day,
          exercises: day.exercises.map((pe) => ({
            ...pe,
            targetSets: activeMesocycle.defaultSets,
            targetReps: activeMesocycle.defaultReps,
            targetRir: activeMesocycle.targetRir,
          })),
        };
      }
    });

    onUpdateSchedule(newSchedule);
    showNotification(`Objetivo (${activeMesocycle.defaultSets} series × ${activeMesocycle.defaultReps} reps) aplicado a todos los días del plan`);
  };

  // Save changes from Mesocycle modal
  const handleSaveMesocycleModal = () => {
    const newSchedule: WeeklySchedule = {
      ...schedule,
      mesocycle: modalMesocycle,
    };

    if (applyToExistingExercises) {
      DAY_KEYS.forEach((dayKey) => {
        const day = newSchedule[dayKey];
        if (day && day.exercises && day.exercises.length > 0) {
          newSchedule[dayKey] = {
            ...day,
            exercises: day.exercises.map((pe) => ({
              ...pe,
              targetSets: modalMesocycle.defaultSets,
              targetReps: modalMesocycle.defaultReps,
              targetRir: modalMesocycle.targetRir,
            })),
          };
        }
      });
    }

    onUpdateSchedule(newSchedule);
    setIsMesocycleModalOpen(false);
    showNotification(`Mesociclo "${modalMesocycle.name}" guardado correctamente`);
  };

  // Quick preset pills for reps
  const quickRepsPresets = ['3-5', '6-8', '8-10', '8-12', '10-12', '12-15', '15-20', 'Al fallo'];

  // Exercises available to add (not yet in this day), sorted alphabetically
  const availableToAdd = sortExercisesAlphabetically(
    exercises.filter(
      (ex) =>
        !currentDaySchedule.exercises.some((pe) => pe.exerciseId === ex.id) &&
        (searchExerciseTerm === '' ||
          ex.name.toLowerCase().includes(searchExerciseTerm.toLowerCase()) ||
          ex.category.toLowerCase().includes(searchExerciseTerm.toLowerCase()))
    )
  );

  const matchedProfile = MESOCYCLE_PROFILES.find((p) => p.type === activeMesocycle.type) || MESOCYCLE_PROFILES[0];

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg border border-slate-700 dark:border-slate-200 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 pb-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#0e7490] dark:text-cyan-400" />
            Plan Semanal & Mesociclo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Planifica tus rutinas, series y repeticiones según el mesociclo de entrenamiento
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToTodayWorkout}
          className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Entrenar hoy</span>
        </button>
      </div>

      {/* Mesocycle Management Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-4 shadow-md mb-4 border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-3xl p-2 bg-white/10 rounded-xl shrink-0 backdrop-blur-xs">
                {matchedProfile.emoji}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    Mesociclo Activo
                  </span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    Semana {activeMesocycle.currentWeek} de {activeMesocycle.totalWeeks}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-0.5 tracking-tight">
                  {activeMesocycle.name}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                  {activeMesocycle.focusNotes || matchedProfile.description}
                </p>
              </div>
            </div>

            {/* Mesocycle Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Week stepper */}
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleStepWeek(-1)}
                  disabled={activeMesocycle.currentWeek <= 1}
                  className="px-2 py-1 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                  title="Semana anterior"
                >
                  -
                </button>
                <span className="text-[11px] font-bold px-2 py-0.5 text-white/90">
                  Sem. {activeMesocycle.currentWeek}
                </span>
                <button
                  type="button"
                  onClick={() => handleStepWeek(1)}
                  disabled={activeMesocycle.currentWeek >= activeMesocycle.totalWeeks}
                  className="px-2 py-1 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                  title="Siguiente semana"
                >
                  +
                </button>
              </div>

              {/* Configure button */}
              <button
                type="button"
                onClick={() => {
                  setModalMesocycle(activeMesocycle);
                  setIsMesocycleModalOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurar</span>
              </button>
            </div>
          </div>

          {/* Mesocycle Target Summary & Quick Actions */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-300 font-medium">
                Pauta base del mesociclo:
              </span>
              <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-white font-bold text-[11px] flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-300" />
                {activeMesocycle.defaultSets} series recomendadas
              </span>
              <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-white font-bold text-[11px] flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-300" />
                {activeMesocycle.defaultReps} repeticiones
              </span>
              {activeMesocycle.targetRir && (
                <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-emerald-300 font-bold text-[11px]">
                  {activeMesocycle.targetRir}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyMesocycleToCurrentDay}
                disabled={currentDaySchedule.exercises.length === 0}
                className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 hover:underline disabled:opacity-40"
                title={`Ajustar todos los ejercicios de ${dayCfg.label} a ${activeMesocycle.defaultSets} series y ${activeMesocycle.defaultReps} reps`}
              >
                Aplicar a este día ({dayCfg.short})
              </button>
              <span className="text-white/30">•</span>
              <button
                type="button"
                onClick={handleApplyMesocycleToEntireWeek}
                className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                title="Ajustar todas las rutinas de la semana con las series y reps de este mesociclo"
              >
                Aplicar a toda la semana
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset templates loader */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Plantillas rápidas de división semanal:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.id)}
              className="text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 hover:border-[#0e7490] dark:hover:border-cyan-500 transition-colors"
            >
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {preset.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 7 Days Navigation Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {DAY_KEYS.map((key) => {
          const cfg = DAY_CONFIG[key];
          const isSelected = selectedDayKey === key;
          const isRealToday = currentDayKey === key;
          const dayPlan = schedule[key];
          const count = dayPlan?.exercises?.length || 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDayKey(key)}
              className={`flex-1 min-w-[70px] py-2.5 px-2 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs">{cfg.emoji}</span>
                <span className="text-xs font-bold">{cfg.short}</span>
              </div>
              <p
                className={`text-[10px] mt-0.5 font-medium ${
                  isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {dayPlan?.isRestDay ? 'Descanso' : `${count} ejerc.`}
              </p>
              {isRealToday && (
                <span
                  className={`inline-block text-[8px] font-extrabold uppercase px-1 rounded mt-1 ${
                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  Hoy
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Program Editor Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        {/* Day Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{dayCfg.emoji}</span>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#0e7490] dark:text-cyan-400 tracking-wider">
                  Programando {dayCfg.label}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    value={currentDaySchedule.name}
                    onChange={(e) => handleUpdateDayName(e.target.value)}
                    placeholder="Nombre de la rutina (ej. Espalda y Bíceps)"
                    className="text-base sm:text-lg font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle rest day & Add exercise button */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={currentDaySchedule.isRestDay || false}
                onChange={(e) => handleToggleRestDay(e.target.checked)}
                className="rounded border-slate-300 text-[#0e7490] focus:ring-[#0e7490]"
              />
              <span>Día de descanso</span>
            </label>

            <button
              type="button"
              onClick={() => setIsAddExerciseModalOpen(true)}
              className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-transform active:scale-95 ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir ejercicio</span>
            </button>
          </div>
        </div>

        {/* Exercises list for this day */}
        {currentDaySchedule.isRestDay ? (
          <div className="py-8 text-center">
            <span className="text-4xl block mb-2">🌿</span>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
              {dayCfg.label} está marcado como día de descanso
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No cargará ejercicios automáticos este día, permitiéndote recuperar el sistema neuromuscular.
            </p>
            <button
              type="button"
              onClick={() => handleToggleRestDay(false)}
              className="mt-3 text-xs font-bold text-[#0e7490] dark:text-cyan-400 hover:underline"
            >
              Cambiar a día de entrenamiento
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {currentDaySchedule.exercises.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No hay ejercicios programados para el {dayCfg.label}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
                  Añade los ejercicios y define cuántas series y repeticiones realizarás de acuerdo a tu mesociclo.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddExerciseModalOpen(true)}
                  className="bg-[#0e7490] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
                >
                  + Añadir primer ejercicio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                  <span>Ejercicios programados ({currentDaySchedule.exercises.length})</span>
                  <span className="text-[10px] text-slate-400">
                    Anota las series y repes objetivo según tu mesociclo
                  </span>
                </div>

                {currentDaySchedule.exercises.map((item, idx) => {
                  const ex = exerciseMap.get(item.exerciseId);
                  if (!ex) return null;

                  const targetSets = item.targetSets || activeMesocycle.defaultSets || 4;
                  const targetReps = item.targetReps || activeMesocycle.defaultReps || '8-12';
                  const targetRir = item.targetRir || activeMesocycle.targetRir || 'RIR 1-2';

                  return (
                    <div
                      key={item.exerciseId}
                      className="p-3.5 bg-slate-50/90 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                    >
                      {/* Exercise Header Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 shadow-2xs">
                            {idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {ex.name}
                            </h4>
                            <span className="text-[10px] font-semibold text-teal-800 dark:text-cyan-400">
                              {ex.category}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Move Up/Down, Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                            title="Subir orden"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'down')}
                            disabled={idx === currentDaySchedule.exercises.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                            title="Bajar orden"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 ml-1"
                            title="Quitar este ejercicio del día"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Series & Repetitions Mesocycle Goal Inputs */}
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Target Sets Stepper */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            Series:
                          </label>
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateExerciseTarget(idx, {
                                  targetSets: Math.max(1, targetSets - 1),
                                })
                              }
                              className="px-2.5 py-1 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Disminuir series"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-black text-slate-900 dark:text-white min-w-[28px] text-center">
                              {targetSets}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateExerciseTarget(idx, {
                                  targetSets: Math.min(10, targetSets + 1),
                                })
                              }
                              className="px-2.5 py-1 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Aumentar series"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            series
                          </span>
                        </div>

                        {/* Target Reps Input & Presets */}
                        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            Repes:
                          </label>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={item.targetReps || ''}
                              onChange={(e) =>
                                handleUpdateExerciseTarget(idx, {
                                  targetReps: e.target.value,
                                })
                              }
                              placeholder={activeMesocycle.defaultReps || '8-12'}
                              className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
                            />
                          </div>
                        </div>

                        {/* Intensity / RIR or Notes */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            RIR:
                          </label>
                          <input
                            type="text"
                            value={item.targetRir || ''}
                            onChange={(e) =>
                              handleUpdateExerciseTarget(idx, {
                                targetRir: e.target.value,
                              })
                            }
                            placeholder={activeMesocycle.targetRir || 'RIR 1-2'}
                            className="w-20 text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
                          />
                        </div>
                      </div>

                      {/* Quick Reps Presets Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap px-1 text-[10px]">
                        <span className="text-slate-400 font-semibold shrink-0">Repes sugeridas:</span>
                        {quickRepsPresets.map((rPreset) => {
                          const isCurrent = targetReps === rPreset;
                          return (
                            <button
                              key={rPreset}
                              type="button"
                              onClick={() =>
                                handleUpdateExerciseTarget(idx, {
                                  targetReps: rPreset,
                                })
                              }
                              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                                isCurrent
                                  ? 'bg-[#0e7490] text-white shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {rPreset}
                            </button>
                          );
                        })}

                        {/* Reset to Mesocycle defaults */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateExerciseTarget(idx, {
                              targetSets: activeMesocycle.defaultSets,
                              targetReps: activeMesocycle.defaultReps,
                              targetRir: activeMesocycle.targetRir,
                            })
                          }
                          className="ml-auto text-[10px] text-teal-700 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          title="Volver a los valores por defecto del mesociclo actual"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Pauta de mesociclo ({activeMesocycle.defaultSets}×{activeMesocycle.defaultReps})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal to configure Active Mesocycle */}
      {isMesocycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0e7490] dark:text-cyan-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Configurar Mesociclo de Entrenamiento
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ajusta la etapa, semanas y las series y repeticiones objetivo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMesocycleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Mesocycle Preset Profiles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecciona el tipo de Mesociclo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MESOCYCLE_PROFILES.map((prof) => {
                    const isSelected = modalMesocycle.type === prof.type;
                    return (
                      <button
                        key={prof.type}
                        type="button"
                        onClick={() => {
                          setModalMesocycle({
                            ...modalMesocycle,
                            type: prof.type,
                            name: prof.name,
                            defaultSets: prof.defaultSets,
                            defaultReps: prof.defaultReps,
                            targetRir: prof.targetRir,
                            totalWeeks: prof.defaultWeeks,
                            focusNotes: prof.tips,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#0e7490] dark:border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 ring-2 ring-[#0e7490]/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{prof.emoji}</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                            {prof.shortLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 font-semibold">
                          {prof.defaultSets} series • {prof.defaultReps} reps
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Mesociclo
                  </label>
                  <input
                    type="text"
                    value={modalMesocycle.name}
                    onChange={(e) =>
                      setModalMesocycle({ ...modalMesocycle, name: e.target.value })
                    }
                    placeholder="Ej. Hipertrofia Fase 1"
                    className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                  />
                </div>

                {/* Weeks Configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Semana Actual
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={modalMesocycle.currentWeek}
                      onChange={(e) =>
                        setModalMesocycle({
                          ...modalMesocycle,
                          currentWeek: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duración Total (semanas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={modalMesocycle.totalWeeks}
                      onChange={(e) =>
                        setModalMesocycle({
                          ...modalMesocycle,
                          totalWeeks: Math.max(1, parseInt(e.target.value, 10) || 4),
                        })
                      }
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Series & Repetitions Base Targets */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Series objetivo
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={modalMesocycle.defaultSets}
                      onChange={(e) =>
                        setModalMesocycle({
                          ...modalMesocycle,
                          defaultSets: Math.max(1, parseInt(e.target.value, 10) || 4),
                        })
                      }
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Repeticiones
                    </label>
                    <input
                      type="text"
                      value={modalMesocycle.defaultReps}
                      onChange={(e) =>
                        setModalMesocycle({ ...modalMesocycle, defaultReps: e.target.value })
                      }
                      placeholder="ej. 8-12"
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      RIR objetivo
                    </label>
                    <input
                      type="text"
                      value={modalMesocycle.targetRir || ''}
                      onChange={(e) =>
                        setModalMesocycle({ ...modalMesocycle, targetRir: e.target.value })
                      }
                      placeholder="ej. RIR 1-2"
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Focus / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enfoque y notas del mesociclo
                  </label>
                  <textarea
                    rows={2}
                    value={modalMesocycle.focusNotes || ''}
                    onChange={(e) =>
                      setModalMesocycle({ ...modalMesocycle, focusNotes: e.target.value })
                    }
                    placeholder="Instrucciones para este bloque (ej. Progresión lineal de cargas, pauses en contracción)..."
                    className="w-full text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-[#0e7490] focus:outline-none resize-none"
                  />
                </div>

                {/* Checkbox to apply to all exercises */}
                <div className="bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-900/50 p-3 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToExistingExercises}
                      onChange={(e) => setApplyToExistingExercises(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#0e7490] focus:ring-[#0e7490]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Aplicar automáticamente estas series ({modalMesocycle.defaultSets}) y repes ({modalMesocycle.defaultReps})
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Actualizará todos los ejercicios existentes en tu plan semanal con estos nuevos objetivos de mesociclo.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setIsMesocycleModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveMesocycleModal}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0e7490] hover:bg-[#0c627a] rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Mesociclo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to add exercise to day */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Añadir ejercicio a {dayCfg.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Se añadirá con {activeMesocycle.defaultSets} series y {activeMesocycle.defaultReps} repeticiones ({activeMesocycle.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Buscar por nombre o grupo muscular..."
                value={searchExerciseTerm}
                onChange={(e) => setSearchExerciseTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
              />

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                {availableToAdd.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">
                    No hay más ejercicios disponibles con ese término.
                  </p>
                ) : (
                  availableToAdd.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleAddExercise(ex.id)}
                      className="w-full p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {ex.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {ex.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0e7490] dark:text-cyan-400 text-xs font-bold">
                        <span className="text-[10px] text-slate-400">
                          +{activeMesocycle.defaultSets} series
                        </span>
                        <Plus className="w-4 h-4 shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {onOpenNewExerciseModal && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddExerciseModalOpen(false);
                      onOpenNewExerciseModal();
                    }}
                    className="text-xs font-bold text-[#0e7490] dark:text-cyan-400 hover:underline"
                  >
                    + Crear nuevo ejercicio personalizado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
