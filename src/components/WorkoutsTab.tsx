import React, { useState, useMemo } from 'react';
import { WorkoutSet, Exercise } from '../types';
import { Dumbbell, Plus, Search, Trash2, Calendar, Timer, Copy, Download, FileSpreadsheet, ChevronRight, Zap } from 'lucide-react';
import { formatDisplayDate, formatFriendlyDate, sortSetsChronological, calculateEstimated1RM } from '../utils/calculations';
import { exportWorkoutSetsToExcel } from '../utils/excel';

interface WorkoutsTabProps {
  sets: WorkoutSet[];
  exercises?: Exercise[];
  onOpenQuickLog: () => void;
  onDeleteSet: (id: string) => void;
  onDuplicateSet: (set: WorkoutSet) => void;
  onLoadSampleData: () => void;
  onOpenExcelModal: () => void;
  onOpenInstallModal: () => void;
  onSelectExerciseForLog?: (exerciseId: string) => void;
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  sets,
  exercises = [],
  onOpenQuickLog,
  onDeleteSet,
  onDuplicateSet,
  onLoadSampleData,
  onOpenExcelModal,
  onOpenInstallModal,
  onSelectExerciseForLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState('all');

  // Unique routines
  const availableRoutines = useMemo(() => {
    const set = new Set<string>();
    sets.forEach((s) => {
      if (s.routine) set.add(s.routine);
    });
    return Array.from(set);
  }, [sets]);

  // Filter sets
  const filteredSets = useMemo(() => {
    return sets.filter((s) => {
      const matchesSearch =
        s.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRoutine = selectedRoutine === 'all' || s.routine === selectedRoutine;
      return matchesSearch && matchesRoutine;
    });
  }, [sets, searchTerm, selectedRoutine]);

  // Group by Date and Routine (Chronological: newest session first),
  // and within each session, group by exercise in the exact chronological order entered,
  // listing series set-by-set (Serie 1, Serie 2, Serie 3...)
  const groupedSessions = useMemo(() => {
    const sessionMap = new Map<string, WorkoutSet[]>();

    // Collect sets into session groups: key = date + routine
    filteredSets.forEach((s) => {
      const sessionKey = `${s.date}___${s.routine || 'General'}`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, []);
      }
      sessionMap.get(sessionKey)!.push(s);
    });

    // Sort session keys: newest date first (descending)
    const sortedKeys = Array.from(sessionMap.keys()).sort((keyA, keyB) => {
      const dateA = keyA.split('___')[0];
      const dateB = keyB.split('___')[0];
      return dateB.localeCompare(dateA);
    });

    return sortedKeys.map((key) => {
      const [date, routine] = key.split('___');
      const sessionSets = sessionMap.get(key) || [];
      const totalSessionVolume = sessionSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

      // Group sets by exercise while strictly preserving the entry order
      const exerciseMap = new Map<
        string,
        {
          exerciseId: string;
          exerciseName: string;
          firstTimestamp: number;
          firstIndex: number;
          sets: WorkoutSet[];
        }
      >();

      sessionSets.forEach((s, idx) => {
        const exKey = s.exerciseName.trim().toLowerCase();
        if (!exerciseMap.has(exKey)) {
          exerciseMap.set(exKey, {
            exerciseId: s.exerciseId,
            exerciseName: s.exerciseName,
            firstTimestamp: s.timestamp || idx * 1000,
            firstIndex: idx,
            sets: [],
          });
        }
        exerciseMap.get(exKey)!.sets.push(s);
      });

      // Sort exercises by their first occurrence / entry in the session
      const exerciseGroups = Array.from(exerciseMap.values())
        .sort((a, b) => {
          if (a.firstTimestamp !== b.firstTimestamp) {
            return a.firstTimestamp - b.firstTimestamp;
          }
          return a.firstIndex - b.firstIndex;
        })
        .map((exGroup, groupIndex) => {
          // Inside each exercise, order sets strictly by setNumber (Serie 1, Serie 2, Serie 3...)
          const orderedExerciseSets = [...exGroup.sets].sort((a, b) => {
            if (a.setNumber !== b.setNumber) {
              return a.setNumber - b.setNumber;
            }
            return (a.timestamp || 0) - (b.timestamp || 0);
          });

          const groupVolume = orderedExerciseSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
          const maxWeight = Math.max(...orderedExerciseSets.map((s) => s.weightKg), 0);

          const exerciseInfo = exercises.find(
            (e) =>
              e.id === exGroup.exerciseId ||
              e.name.trim().toLowerCase() === exGroup.exerciseName.trim().toLowerCase()
          );

          return {
            orderIndex: groupIndex + 1,
            exerciseId: exGroup.exerciseId,
            exerciseName: exGroup.exerciseName,
            category: exerciseInfo?.category,
            sets: orderedExerciseSets,
            totalVolume: groupVolume,
            maxWeight,
            totalSets: orderedExerciseSets.length,
          };
        });

      return {
        date,
        routine,
        totalVolume: totalSessionVolume,
        totalSets: sessionSets.length,
        totalExercises: exerciseGroups.length,
        exerciseGroups,
      };
    });
  }, [filteredSets, exercises]);

  const handleExportCSV = () => {
    if (sets.length === 0) return;
    const sortedSets = sortSetsChronological(sets, 'desc');
    const headers = ['Fecha', 'Rutina', 'Ejercicio', 'Serie', 'Peso (kg)', 'Reps', 'RPE', 'Descanso (s)', 'Volumen (kg)', 'Notas'];
    const rows = sortedSets.map((s) => [
      s.date,
      `"${s.routine}"`,
      `"${s.exerciseName}"`,
      s.setNumber,
      s.weightKg,
      s.reps,
      s.rpe,
      s.restSeconds,
      s.weightKg * s.reps,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `entrenamientos_fuerza_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectExportExcel = () => {
    try {
      exportWorkoutSetsToExcel(sets, exercises);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al exportar a Excel');
    }
  };

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Header (Matches Screenshot 3) */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Entrenamientos</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenExcelModal}
            className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2.5 py-2 rounded-lg flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
            title="Exportar o importar Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            type="button"
            id="btn-workouts-registrar-serie"
            onClick={onOpenQuickLog}
            className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar serie
          </button>
        </div>
      </div>

      {/* Quick Excel and Mobile Card */}
      <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 rounded-2xl p-3.5 text-white mb-5 shadow-xs flex items-center justify-between gap-2 border border-emerald-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Guardar en Excel (.xlsx)</p>
            <p className="text-[11px] text-emerald-200/80 leading-tight mt-0.5">
              Descarga tus {sets.length} series en hojas de cálculo formateadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDirectExportExcel}
            disabled={sets.length === 0}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-emerald-950 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
            title="Descargar archivo Excel con tablas y resúmenes"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.XLSX</span>
          </button>
          <button
            type="button"
            onClick={onOpenExcelModal}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
            title="Opciones de importación y exportación"
          >
            Más
          </button>
        </div>
      </div>

      {/* Search and Routine Filters (Matches Screenshot 3) */}
      <div className="space-y-2 mb-5">
        <div className="relative">
          <input
            type="text"
            id="input-buscar-ejercicio"
            placeholder="Buscar ejercicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl pl-9 pr-3 py-2.5 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
        </div>

        <div>
          <select
            id="select-filtro-rutinas"
            value={selectedRoutine}
            onChange={(e) => setSelectedRoutine(e.target.value)}
            className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-3 py-2.5 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all font-medium"
          >
            <option value="all">Todas las rutinas</option>
            {availableRoutines.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Historial de series Section (Matches Screenshot 3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Historial de series</h2>
          {sets.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirectExportExcel}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1"
                title="Descargar archivo Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Descargar Excel
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={handleExportCSV}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                title="Descargar como archivo CSV clásico"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          )}
        </div>

        {groupedSessions.length === 0 ? (
          /* Empty state matching Image 3 */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-8 text-center shadow-xs flex flex-col items-center justify-center transition-colors">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <Dumbbell className="w-7 h-7 -rotate-45" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Sin registros de series</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              Registra tu primera serie para empezar el historial.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onOpenQuickLog}
                className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Registrar serie
              </button>
              <button
                type="button"
                onClick={onLoadSampleData}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all"
              >
                Cargar datos de prueba
              </button>
            </div>
          </div>
        ) : (
          /* Grouped workout sessions */
          <div className="space-y-4">
            {groupedSessions.map((session, idx) => (
              <div
                key={`${session.date}-${session.routine}-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
              >
                {/* Session Header (Chronological Session: Newest First) */}
                <div className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-cyan-950/60 border border-teal-200/60 dark:border-cyan-800/50 flex items-center justify-center text-[#0e7490] dark:text-cyan-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                          {formatFriendlyDate(session.date)}
                        </span>
                        <span className="text-[11px] font-semibold text-teal-800 dark:text-cyan-300 bg-teal-100/70 dark:bg-cyan-950/70 px-2 py-0.5 rounded-full border border-teal-200/40 dark:border-cyan-800/40">
                          {session.routine}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {session.totalExercises} {session.totalExercises === 1 ? 'ejercicio' : 'ejercicios'} · {session.totalSets} {session.totalSets === 1 ? 'serie' : 'series'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      Vol: {session.totalVolume.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* Exercises inside session (grouped in order of execution/entry) */}
                <div className="p-3 sm:p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/20">
                  {session.exerciseGroups.map((group) => (
                    <div
                      key={`${session.date}-${group.exerciseId}-${group.orderIndex}`}
                      className="bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden transition-colors"
                    >
                      {/* Exercise Header */}
                      <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Exercise order number badge: 1, 2, 3... */}
                          <span
                            className="w-5 h-5 rounded-md bg-[#0e7490] dark:bg-cyan-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs"
                            title={`Ejercicio #${group.orderIndex} en esta sesión`}
                          >
                            {group.orderIndex}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {group.exerciseName}
                            </h3>
                            {group.category && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {group.category}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {group.totalSets} {group.totalSets === 1 ? 'serie' : 'series'}
                            </span>
                            <span className="mx-1">·</span>
                            <span>Máx: <strong className="text-slate-900 dark:text-white">{group.maxWeight} kg</strong></span>
                            <span className="mx-1">·</span>
                            <span className="text-teal-700 dark:text-cyan-400 font-semibold">
                              {group.totalVolume.toLocaleString()} kg
                            </span>
                          </div>

                          {onSelectExerciseForLog && (
                            <button
                              type="button"
                              onClick={() => onSelectExerciseForLog(group.exerciseId)}
                              className="text-[11px] font-semibold text-[#0e7490] dark:text-cyan-400 hover:text-[#0c627a] dark:hover:text-cyan-300 bg-teal-50 dark:bg-cyan-950/60 hover:bg-teal-100/70 dark:hover:bg-cyan-900/60 px-2 py-1 rounded-md border border-teal-200/50 dark:border-cyan-800/50 transition-colors flex items-center gap-1"
                              title={`Registrar otra serie de ${group.exerciseName}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Serie</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Series for this exercise (serie tras serie) */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {group.sets.map((s) => {
                          const est1RM = calculateEstimated1RM(s.weightKg, s.reps);
                          return (
                            <div
                              key={s.id}
                              className="p-3 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Serie Number Badge */}
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-600 shrink-0">
                                    Serie {s.setNumber}
                                  </span>

                                  {/* Weight and Reps */}
                                  <div className="flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-700/70 px-2 py-0.5 rounded-md">
                                    <span>{s.weightKg} kg</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-normal">×</span>
                                    <span>{s.reps} reps</span>
                                  </div>

                                  {/* RPE */}
                                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                    RPE <strong className="text-slate-900 dark:text-white">{s.rpe}</strong>
                                  </span>

                                  {/* Rest time */}
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                    <Timer className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" />
                                    {s.restSeconds}s
                                  </span>

                                  {/* 1RM calculation badge */}
                                  {est1RM > 0 && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50 hidden md:inline">
                                      1RM est: <strong className="text-slate-700 dark:text-slate-200">{est1RM} kg</strong>
                                    </span>
                                  )}

                                  {/* Volume */}
                                  <span className="text-[11px] text-teal-700 dark:text-cyan-400 font-medium ml-auto">
                                    {(s.weightKg * s.reps).toLocaleString()} kg
                                  </span>
                                </div>

                                {/* Notes if present */}
                                {s.notes && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5 bg-slate-50/80 dark:bg-slate-800/60 p-1.5 rounded-md border border-slate-100 dark:border-slate-700/50">
                                    💭 {s.notes}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button
                                  type="button"
                                  onClick={() => onDuplicateSet(s)}
                                  className="text-slate-400 hover:text-[#0e7490] dark:hover:text-cyan-400 p-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors"
                                  title={`Duplicar serie ${s.setNumber} para este ejercicio`}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSet(s.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                                  title="Eliminar serie"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
