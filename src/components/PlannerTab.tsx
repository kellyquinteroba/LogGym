import React, { useState } from 'react';
import {
  WeeklySchedule,
  DayOfWeek,
  Exercise,
  PlannedExercise,
} from '../types';
import {
  DAY_KEYS,
  DAY_CONFIG,
  getTodayDayOfWeek,
  SCHEDULE_PRESETS,
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
  const [searchExerciseTerm, setSearchExerciseTerm] = useState('');
  const [justSavedPreset, setJustSavedPreset] = useState(false);

  const currentDaySchedule = schedule[selectedDayKey] || schedule.monday;
  const dayCfg = DAY_CONFIG[selectedDayKey];

  // Map exercises for quick lookup
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((ex) => exerciseMap.set(ex.id, ex));

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

  // Add exercise to this day
  const handleAddExercise = (exerciseId: string) => {
    const alreadyExists = currentDaySchedule.exercises.some((e) => e.exerciseId === exerciseId);
    if (alreadyExists) return;

    const newPlanned: PlannedExercise = {
      exerciseId,
      targetSets: 4,
      targetReps: '10-12',
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
      onUpdateSchedule(found.schedule);
      setJustSavedPreset(true);
      setTimeout(() => setJustSavedPreset(false), 2500);
    }
  };

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

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#0e7490] dark:text-cyan-400" />
            Plan Semanal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Programa los ejercicios de cada día para que carguen solitos al entrenar
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

      {/* Preset templates loader */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Plantillas rápidas de rutina:
          </span>
          {justSavedPreset && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> ¡Plantilla aplicada!
            </span>
          )}
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

          {/* Toggle rest day */}
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
              No cargará ejercicios automáticos este día, permitiéndote descansar o realizar recuperación activa.
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
                  Añade los ejercicios que quieres que la app te cargue automáticamente este día.
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
              <div className="space-y-2">
                {currentDaySchedule.exercises.map((item, idx) => {
                  const ex = exerciseMap.get(item.exerciseId);
                  if (!ex) return null;

                  return (
                    <div
                      key={item.exerciseId}
                      className="p-3 bg-slate-50/90 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {ex.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold text-teal-800 dark:text-cyan-400">
                              {ex.category}
                            </span>
                            <span>•</span>
                            <span>{item.targetSets || 4} series recomendadas</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Move Up/Down, Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
                          title="Subir de orden"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, 'down')}
                          disabled={idx === currentDaySchedule.exercises.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
                          title="Bajar de orden"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                          title="Quitar este ejercicio del día"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                  Selecciona de tu biblioteca de ejercicios
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
                      <Plus className="w-4 h-4 text-[#0e7490] dark:text-cyan-400 shrink-0" />
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
