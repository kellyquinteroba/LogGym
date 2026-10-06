import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Exercise, WorkoutSet, SetStyle, DropStage, WeeklySchedule, DaySchedule } from '../types';
import { getTodayDateString, sortExercisesAlphabetically } from '../utils/calculations';
import { SET_STYLES, getSetStyleConfig } from '../utils/setStyles';
import {
  Sparkles,
  Timer,
  Check,
  Plus,
  Layers,
  Flame,
  Zap,
  Link2,
  Info,
  Trash2,
  ArrowDown,
  ChevronDown,
  X,
  Tag,
  Dumbbell,
} from 'lucide-react';

interface QuickLogCardProps {
  exercises: Exercise[];
  recentSets: WorkoutSet[];
  schedule?: WeeklySchedule;
  onSaveSet: (newSet: Omit<WorkoutSet, 'id' | 'timestamp'>, autoStartRest?: boolean) => void;
  onViewHistory: () => void;
  initialExerciseId?: string;
  initialRoutine?: string;
  onOpenNewExerciseModal?: () => void;
}

interface DropStageInput {
  weightKg: number | '';
  reps: number | '';
}

const STORAGE_KEY_CUSTOM_ROUTINES = 'fuerzalog_custom_routines_v1';

export const QuickLogCard: React.FC<QuickLogCardProps> = ({
  exercises,
  recentSets,
  schedule,
  onSaveSet,
  onViewHistory,
  initialExerciseId = '',
  initialRoutine = '',
  onOpenNewExerciseModal,
}) => {
  const sortedExercises = useMemo(() => {
    return sortExercisesAlphabetically(exercises);
  }, [exercises]);

  const [date, setDate] = useState(getTodayDateString());
  const [routine, setRoutine] = useState(initialRoutine || 'Torso A');
  const [exerciseId, setExerciseId] = useState(initialExerciseId || (exercises[0]?.id ?? ''));
  const [setNumber, setSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState<number | ''>(0);
  const [reps, setReps] = useState<number | ''>(10);
  const [rpe, setRpe] = useState<number | ''>(7);
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState('');
  const [setStyle, setSetStyle] = useState<SetStyle>('normal');
  const [customStyleName, setCustomStyleName] = useState('');
  const [pairedExerciseName, setPairedExerciseName] = useState('');
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  // Custom user-created routines
  const [customRoutines, setCustomRoutines] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_ROUTINES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isRoutineDropdownOpen, setIsRoutineDropdownOpen] = useState(false);
  const [isCreatingCustomRoutine, setIsCreatingCustomRoutine] = useState(false);
  const [newRoutineInput, setNewRoutineInput] = useState('');
  const routineContainerRef = useRef<HTMLDivElement>(null);

  const saveCustomRoutine = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomRoutines((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const removeCustomRoutine = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomRoutines((prev) => {
      const updated = prev.filter((r) => r !== name);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (routineContainerRef.current && !routineContainerRef.current.contains(e.target as Node)) {
        setIsRoutineDropdownOpen(false);
        setIsCreatingCustomRoutine(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute all available routines from schedule, custom creations, recent sets, and standard presets
  const availableRoutines = useMemo(() => {
    const list: string[] = [];

    // 1. From schedule if available
    if (schedule) {
      (Object.values(schedule) as DaySchedule[]).forEach((dayPlan) => {
        if (dayPlan.name && !dayPlan.isRestDay && !list.includes(dayPlan.name)) {
          list.push(dayPlan.name);
        }
      });
    }

    // 2. Custom created routines by the user
    customRoutines.forEach((r) => {
      if (!list.includes(r)) list.push(r);
    });

    // 3. From recent sets history
    recentSets.forEach((s) => {
      if (s.routine && !list.includes(s.routine)) {
        list.push(s.routine);
      }
    });

    // 4. Default popular presets
    const presets = [
      'Torso A',
      'Torso B',
      'Pierna & Glúteo',
      'Empuje (Push)',
      'Tirón (Pull)',
      'Espalda y Bíceps',
      'Cuádriceps',
      'Pecho & Tríceps',
      'Hombros & Brazos',
      'Cuerpo Completo',
    ];
    presets.forEach((p) => {
      if (!list.includes(p)) list.push(p);
    });

    return list;
  }, [schedule, customRoutines, recentSets]);

  // Filtered routines based on what user typed (if any)
  const filteredRoutines = useMemo(() => {
    if (!routine.trim()) return availableRoutines;
    const term = routine.toLowerCase().trim();
    const matched = availableRoutines.filter((r) => r.toLowerCase().includes(term));
    return matched.length > 0 ? matched : availableRoutines;
  }, [availableRoutines, routine]);

  // Drop stages for dropset style (e.g. 100kg x 10, then drop 1: 80kg x 8, drop 2: 60kg x 5)
  const [dropStages, setDropStages] = useState<DropStageInput[]>([
    { weightKg: 80, reps: 8 },
    { weightKg: 60, reps: 5 },
  ]);

  // Sync initial exercise and routine if passed externally
  useEffect(() => {
    if (initialExerciseId) {
      setExerciseId(initialExerciseId);
    }
  }, [initialExerciseId]);

  useEffect(() => {
    if (initialRoutine) {
      setRoutine(initialRoutine);
    }
  }, [initialRoutine]);

  // When exercise changes, calculate next set number and suggest previous weight
  useEffect(() => {
    if (!exerciseId) return;
    const sameExerciseSetsToday = recentSets.filter(
      (s) => s.exerciseId === exerciseId && s.date === date
    );
    if (sameExerciseSetsToday.length > 0) {
      const maxSet = Math.max(...sameExerciseSetsToday.map((s) => s.setNumber));
      setSetNumber(maxSet + 1);
      // Pre-fill with previous set weight & reps
      const lastSet = sameExerciseSetsToday[sameExerciseSetsToday.length - 1];
      if (lastSet) {
        setWeightKg(lastSet.weightKg);
        setReps(lastSet.reps);
        setRpe(lastSet.rpe);
        if (lastSet.setStyle) {
          setSetStyle(lastSet.setStyle);
        }
        if (lastSet.dropStages && lastSet.dropStages.length > 0) {
          setDropStages(
            lastSet.dropStages.map((st) => ({
              weightKg: st.weightKg,
              reps: st.reps,
            }))
          );
        }
      }
    } else {
      // Find latest overall set for this exercise to help with weight
      const latestOverall = recentSets.find((s) => s.exerciseId === exerciseId);
      if (latestOverall) {
        setWeightKg(latestOverall.weightKg);
        setReps(latestOverall.reps);
      }
      setSetNumber(1);
    }
  }, [exerciseId, date, recentSets]);

  const selectedExercise = exercises.find((e) => e.id === exerciseId);

  const handleSelectStyle = (newStyle: SetStyle) => {
    setSetStyle(newStyle);
    if (newStyle === 'dropset' && dropStages.length === 0) {
      const curWeight = Number(weightKg) || 100;
      const drop1 = Math.max(1, Math.round(curWeight * 0.8 * 2) / 2);
      const drop2 = Math.max(1, Math.round(curWeight * 0.6 * 2) / 2);
      setDropStages([
        { weightKg: drop1, reps: 8 },
        { weightKg: drop2, reps: 5 },
      ]);
    }
  };

  const handleAddDropStage = () => {
    setDropStages((prev) => {
      let lastWeight = Number(weightKg) || 60;
      let lastReps = Number(reps) || 8;
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        lastWeight = Number(last.weightKg) || lastWeight;
        lastReps = Number(last.reps) || lastReps;
      }
      const nextWeight = Math.max(0, Math.round(lastWeight * 0.8 * 2) / 2);
      const nextReps = Math.max(1, lastReps - 2 || 5);
      return [...prev, { weightKg: nextWeight, reps: nextReps }];
    });
  };

  const handleUpdateDropStage = (index: number, field: 'weightKg' | 'reps', value: number | '') => {
    setDropStages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveDropStage = (index: number) => {
    setDropStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    const parsedWeight = typeof weightKg === 'number' ? weightKg : parseFloat(String(weightKg)) || 0;
    const parsedReps = typeof reps === 'number' ? reps : parseInt(String(reps), 10) || 1;
    const parsedRpe = typeof rpe === 'number' ? rpe : parseFloat(String(rpe)) || 7;

    const cleanedDropStages: DropStage[] | undefined =
      setStyle === 'dropset' && dropStages.length > 0
        ? dropStages
            .filter((st) => Number(st.weightKg) > 0 || Number(st.reps) > 0)
            .map((st) => ({
              weightKg: typeof st.weightKg === 'number' ? st.weightKg : parseFloat(String(st.weightKg)) || 0,
              reps: typeof st.reps === 'number' ? st.reps : parseInt(String(st.reps), 10) || 1,
            }))
        : undefined;

    onSaveSet(
      {
        date,
        routine: routine.trim() || 'General',
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        setNumber: Number(setNumber) || 1,
        weightKg: parsedWeight,
        reps: parsedReps,
        rpe: parsedRpe,
        restSeconds: Number(restSeconds) || 90,
        notes: notes.trim(),
        setStyle,
        customStyleName: setStyle === 'custom' ? customStyleName.trim() : undefined,
        pairedExerciseName:
          setStyle === 'superset' || setStyle === 'biserie' || setStyle === 'triserie'
            ? pairedExerciseName.trim()
            : undefined,
        dropStages: cleanedDropStages,
      },
      autoStartTimer
    );

    // Prepare for next set (Serie 2, Serie 3, etc.) - preserves dropset config so user can repeat drops smoothly!
    setSetNumber((prev) => prev + 1);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const initialVolume = (Number(weightKg) || 0) * (Number(reps) || 0);
  const dropsVolume =
    setStyle === 'dropset'
      ? dropStages.reduce((sum, d) => sum + (Number(d.weightKg) || 0) * (Number(d.reps) || 0), 0)
      : 0;
  const calculatedVolume = initialVolume + dropsVolume;
  const totalSetReps =
    (Number(reps) || 0) +
    (setStyle === 'dropset' ? dropStages.reduce((sum, d) => sum + (Number(d.reps) || 0), 0) : 0);

  return (
    <div id="quick-log-card" className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Registro rápido</h2>
        <button
          type="button"
          id="btn-ver-historial"
          onClick={onViewHistory}
          className="text-xs font-semibold text-[#0e7490] dark:text-cyan-400 hover:underline"
        >
          Ver historial
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm transition-colors">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          El volumen se calcula automáticamente como peso por repeticiones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
            <input
              type="date"
              id="input-fecha"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all"
            />
          </div>

          {/* Día / Rutina */}
          <div ref={routineContainerRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Día / Rutina
              </label>
              <button
                type="button"
                id="btn-abrir-crear-rutina"
                onClick={() => {
                  setIsCreatingCustomRoutine(true);
                  setIsRoutineDropdownOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0e7490] dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>+ Crear opción propia</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                id="input-rutina"
                value={routine}
                onChange={(e) => {
                  setRoutine(e.target.value);
                  if (!isRoutineDropdownOpen) setIsRoutineDropdownOpen(true);
                }}
                onClick={() => setIsRoutineDropdownOpen(true)}
                onFocus={() => setIsRoutineDropdownOpen(true)}
                placeholder="Selecciona o escribe el día/rutina..."
                className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-lg pl-3 pr-10 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                id="btn-toggle-rutinas-dropdown"
                onClick={() => setIsRoutineDropdownOpen((prev) => !prev)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Desplegar lista de opciones"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isRoutineDropdownOpen ? 'rotate-180 text-[#0e7490] dark:text-cyan-400' : ''
                  }`}
                />
              </button>
            </div>

            {/* Dropdown flotante con las opciones */}
            {isRoutineDropdownOpen && (
              <div
                id="rutinas-dropdown-list"
                className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Formulario rápido para crear opción propia */}
                {isCreatingCustomRoutine ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Crear nueva opción propia:
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newRoutineInput}
                        onChange={(e) => setNewRoutineInput(e.target.value)}
                        placeholder="Ej. Glúteos & Femoral, Pecho..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newRoutineInput.trim()) {
                              const val = newRoutineInput.trim();
                              saveCustomRoutine(val);
                              setRoutine(val);
                              setNewRoutineInput('');
                              setIsCreatingCustomRoutine(false);
                              setIsRoutineDropdownOpen(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newRoutineInput.trim()) {
                            const val = newRoutineInput.trim();
                            saveCustomRoutine(val);
                            setRoutine(val);
                            setNewRoutineInput('');
                            setIsCreatingCustomRoutine(false);
                            setIsRoutineDropdownOpen(false);
                          }
                        }}
                        className="bg-[#0e7490] hover:bg-[#0891b2] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-xs"
                      >
                        Crear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCustomRoutine(false);
                          setNewRoutineInput('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomRoutine(true)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0e7490] dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                      Crear nueva opción propia...
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Personalizada</span>
                  </button>
                )}

                {/* Si el usuario escribió un texto en el input que aún no existe en la lista */}
                {routine.trim() &&
                  !availableRoutines.some(
                    (r) => r.toLowerCase() === routine.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        const val = routine.trim();
                        saveCustomRoutine(val);
                        setIsRoutineDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-teal-800 dark:text-cyan-300 bg-teal-50/70 dark:bg-cyan-950/40 hover:bg-teal-100/70 dark:hover:bg-cyan-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 shrink-0" />
                      <span>
                        Usar "<strong>{routine.trim()}</strong>" como nueva opción propia
                      </span>
                    </button>
                  )}

                {/* Lista desplazable con todas las opciones disponibles */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRoutines.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                      No se encontraron opciones coincidentes.
                    </div>
                  ) : (
                    filteredRoutines.map((item) => {
                      const isSelected = item.toLowerCase() === routine.trim().toLowerCase();
                      const isCustom = customRoutines.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => {
                            setRoutine(item);
                            setIsRoutineDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50/90 dark:bg-cyan-950/60 font-bold text-[#0e7490] dark:text-cyan-300'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{item}</span>
                            {isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold shrink-0">
                                Propia
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => removeCustomRoutine(item, e)}
                                title="Eliminar opción propia"
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ejercicio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ejercicio</label>
              {onOpenNewExerciseModal && (
                <button
                  type="button"
                  onClick={onOpenNewExerciseModal}
                  className="text-[11px] text-[#0e7490] dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Añadir nuevo
                </button>
              )}
            </div>
            <select
              id="select-ejercicio"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2.5 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all font-medium"
            >
              <option value="" disabled>
                Selecciona un ejercicio
              </option>
              {sortedExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
            </select>
            {selectedExercise && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1">
                💡 {selectedExercise.cues}
              </p>
            )}
          </div>

          {/* 2x2 Grid for Serie, Peso, Reps, RPE */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Serie */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Serie</label>
              <input
                type="number"
                id="input-serie"
                min="1"
                max="30"
                value={setNumber}
                onChange={(e) => setSetNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all"
              />
            </div>

            {/* Peso (kg) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {setStyle === 'dropset' ? 'Peso inicial (Etapa 1)' : 'Peso (kg)'}
                </label>
                {calculatedVolume > 0 && (
                  <span className="text-[10px] text-teal-700 dark:text-cyan-400 font-medium">
                    Vol: {calculatedVolume} kg
                  </span>
                )}
              </div>
              <input
                type="number"
                id="input-peso"
                step="0.5"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Reps */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {setStyle === 'dropset' ? 'Reps iniciales (Etapa 1)' : 'Reps'}
              </label>
              <input
                type="number"
                id="input-reps"
                min="1"
                max="100"
                value={reps}
                onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* RPE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">RPE (1-10)</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Esfuerzo</span>
              </div>
              <input
                type="number"
                id="input-rpe"
                step="0.5"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="7"
                className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Estilo de Serie (Drop Set, Superset, Biserie, etc.) */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                Estilo de serie
              </label>
              <select
                id="select-estilo-serie-menu"
                value={setStyle}
                onChange={(e) => handleSelectStyle(e.target.value as SetStyle)}
                className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
              >
                {SET_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick style chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { id: 'normal' as const, label: 'Normal' },
                { id: 'dropset' as const, label: 'Drop Set', icon: Flame },
                { id: 'superset' as const, label: 'Superset', icon: Zap },
                { id: 'biserie' as const, label: 'Biserie', icon: Link2 },
                { id: 'rest_pause' as const, label: 'Rest-Pause' },
                { id: 'top_set' as const, label: 'Top Set' },
              ].map((item) => {
                const isSelected = setStyle === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectStyle(item.id)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dropset Multi-Drop Section (Registrar en 1 serie los diferentes pesos) */}
            {setStyle === 'dropset' && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    Bajadas consecutivas de peso (Drops en Serie {setNumber}):
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    {1 + dropStages.length} pesos en 1 serie
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Haz tu peso inicial y de inmediato (sin descanso) pasa a los siguientes pesos decrecientes:
                </p>

                {/* Stage 1 (Initial) Summary line */}
                <div className="flex items-center justify-between text-xs bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg mb-2 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#0e7490] text-white px-1.5 py-0.5 rounded">
                      Etapa 1
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {weightKg || 0} kg × {reps || 0} reps
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Peso inicial
                  </span>
                </div>

                {/* Drops list */}
                <div className="space-y-2">
                  {dropStages.map((stage, idx) => {
                    const stageVol = (Number(stage.weightKg) || 0) * (Number(stage.reps) || 0);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/60 dark:border-amber-800/50"
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/80 px-2 py-1 rounded-md">
                            Drop {idx + 1}
                          </span>
                        </div>

                        {/* Weight input */}
                        <div className="flex-1">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              placeholder="80"
                              value={stage.weightKg}
                              onChange={(e) =>
                                handleUpdateDropStage(
                                  idx,
                                  'weightKg',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg pl-2 pr-7 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                              kg
                            </span>
                          </div>
                        </div>

                        {/* Reps input */}
                        <div className="flex-1">
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="8"
                              value={stage.reps}
                              onChange={(e) =>
                                handleUpdateDropStage(
                                  idx,
                                  'reps',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg pl-2 pr-9 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                              reps
                            </span>
                          </div>
                        </div>

                        {/* Subtotal */}
                        {stageVol > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0 hidden sm:inline">
                            {stageVol} kg
                          </span>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDropStage(idx)}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                          title="Eliminar esta bajada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add drop button */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={handleAddDropStage}
                    className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200/80 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                    Añadir bajada (drop)
                  </button>

                  {dropStages.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const w = Number(weightKg) || 100;
                        setDropStages([
                          { weightKg: Math.round(w * 0.8), reps: 8 },
                          { weightKg: Math.round(w * 0.6), reps: 5 },
                        ]);
                      }}
                      className="text-xs text-amber-700 dark:text-cyan-400 hover:underline font-medium"
                    >
                      + Cargar 2 bajadas (ej. 100kg → 80kg → 60kg)
                    </button>
                  )}
                </div>

                {/* Live Preview Card matching user specification */}
                <div className="mt-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl p-2.5 border border-amber-300/40 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center justify-between font-extrabold text-amber-950 dark:text-amber-200 mb-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      Serie {setNumber} Dropset completo:
                    </span>
                    <span className="text-slate-900 dark:text-white">
                      {calculatedVolume.toLocaleString()} kg · {totalSetReps} reps
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 font-mono">
                    <div>• {weightKg || 0} kg - {reps || 0} reps</div>
                    {dropStages.map((ds, i) => (
                      <div key={i} className="text-amber-800 dark:text-amber-300 font-semibold">
                        ↳ {ds.weightKg || 0} kg - {ds.reps || 0} reps
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Paired exercise input if Superset, Biserie or Triserie is chosen */}
            {(setStyle === 'superset' || setStyle === 'biserie' || setStyle === 'triserie') && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" />
                  Ejercicio complementario / en pareja (opcional):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="paired-exercises-list"
                    value={pairedExerciseName}
                    onChange={(e) => setPairedExerciseName(e.target.value)}
                    placeholder="Ej. Elevaciones laterales, Curl de bíceps, Fondos..."
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e7490] dark:focus:ring-cyan-500 placeholder:text-slate-400"
                  />
                  <datalist id="paired-exercises-list">
                    {exercises
                      .filter((ex) => ex.id !== exerciseId)
                      .map((ex) => (
                        <option key={ex.id} value={ex.name}>
                          {ex.category}
                        </option>
                      ))}
                  </datalist>
                </div>
              </div>
            )}

            {/* Custom style name input */}
            {setStyle === 'custom' && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de tu variante / estilo:
                </label>
                <input
                  type="text"
                  value={customStyleName}
                  onChange={(e) => setCustomStyleName(e.target.value)}
                  placeholder="Ej. Cluster Set, Isometría al fallo..."
                  className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e7490] dark:focus:ring-cyan-500"
                />
              </div>
            )}

            {/* Style explanation cue */}
            {setStyle !== 'normal' && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                <Info className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>{getSetStyleConfig(setStyle, customStyleName).label}:</strong>{' '}
                  {getSetStyleConfig(setStyle, customStyleName).description}
                </p>
              </div>
            )}
          </div>

          {/* Descanso entre series */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                Descanso posterior
              </label>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {restSeconds >= 60 ? `${Math.floor(restSeconds / 60)}m ${restSeconds % 60 ? `${restSeconds % 60}s` : ''}` : `${restSeconds}s`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[45, 60, 90, 120].map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setRestSeconds(sec)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                    restSeconds === sec
                      ? 'bg-[#0e7490]/10 dark:bg-cyan-950/60 border-[#0e7490] dark:border-cyan-500 text-[#0e7490] dark:text-cyan-400 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={autoStartTimer}
                onChange={(e) => setAutoStartTimer(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-[#0e7490] dark:text-cyan-500 focus:ring-[#0e7490] dark:bg-slate-800"
              />
              <span>Iniciar temporizador de descanso automáticamente al guardar</span>
            </label>
          </div>

          {/* Notas / Sensaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas / Sensaciones
            </label>
            <textarea
              id="input-notas"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pausa, técnica, energía o molestias..."
              className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Guardar button */}
          <div className="pt-1">
            <button
              type="submit"
              id="btn-guardar-serie"
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                justSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0e7490] hover:bg-[#0c627a] active:scale-[0.99]'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-4 h-4" /> ¡Serie {setNumber - 1} registrada! Lista Serie {setNumber}
                </>
              ) : (
                <>
                  Guardar Serie {setNumber}
                  {setStyle === 'dropset'
                    ? ` (Dropset · ${calculatedVolume.toLocaleString()} kg)`
                    : calculatedVolume > 0
                    ? ` (${calculatedVolume.toLocaleString()} kg)`
                    : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
