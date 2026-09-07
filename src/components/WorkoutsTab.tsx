import React, { useState, useMemo } from 'react';
import { WorkoutSet, Exercise } from '../types';
import { Dumbbell, Plus, Search, Trash2, Calendar, Timer, Copy, Download, FileSpreadsheet, Smartphone, Upload } from 'lucide-react';
import { formatDisplayDate, sortSetsChronological } from '../utils/calculations';
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

  // Group by Date and Routine
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: WorkoutSet[] } = {};
    const sorted = sortSetsChronological(filteredSets, 'desc');

    sorted.forEach((s) => {
      const key = `${s.date}___${s.routine || 'General'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.entries(groups)
      .sort(([keyA], [keyB]) => {
        const dateA = keyA.split('___')[0];
        const dateB = keyB.split('___')[0];
        return dateB.localeCompare(dateA); // newest session first
      })
      .map(([key, sessionSets]) => {
        const [date, routine] = key.split('___');
        // Sort sets within session by setNumber ascending
        const orderedSets = [...sessionSets].sort((a, b) => a.setNumber - b.setNumber);
        const totalSessionVolume = orderedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
        return {
          date,
          routine,
          sets: orderedSets,
          totalVolume: totalSessionVolume,
        };
      });
  }, [filteredSets]);

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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Entrenamientos</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenExcelModal}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-2 rounded-lg flex items-center gap-1 border border-emerald-200 transition-colors"
            title="Exportar o importar Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
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
      <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 rounded-2xl p-3.5 text-white mb-5 shadow-xs flex items-center justify-between gap-2">
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
            className="w-full bg-slate-100/90 text-slate-900 text-sm rounded-xl pl-9 pr-3 py-2.5 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div>
          <select
            id="select-filtro-rutinas"
            value={selectedRoutine}
            onChange={(e) => setSelectedRoutine(e.target.value)}
            className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-xl px-3 py-2.5 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all font-medium"
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
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Historial de series</h2>
          {sets.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirectExportExcel}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                title="Descargar archivo Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Descargar Excel
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleExportCSV}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                title="Descargar como archivo CSV clásico"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          )}
        </div>

        {groupedSessions.length === 0 ? (
          /* Empty state matching Image 3 */
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Dumbbell className="w-7 h-7 -rotate-45" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Sin registros de series</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
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
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all"
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
                className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden"
              >
                {/* Session Header */}
                <div className="bg-slate-50/90 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#0e7490]" />
                    <span className="text-xs font-bold text-slate-800">
                      {formatDisplayDate(session.date)}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                      {session.routine}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    Vol: {session.totalVolume.toLocaleString()} kg
                  </span>
                </div>

                {/* Series inside session */}
                <div className="divide-y divide-slate-100">
                  {session.sets.map((s) => (
                    <div key={s.id} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {s.exerciseName}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded">
                              Serie {s.setNumber}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-700">
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              {s.weightKg} kg
                            </span>
                            <span className="text-slate-400">×</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              {s.reps} reps
                            </span>
                            <span className="text-[11px] text-slate-500">
                              RPE <strong className="text-slate-800">{s.rpe}</strong>
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                              <Timer className="w-3 h-3 text-[#0e7490]" /> {s.restSeconds}s
                            </span>
                            <span className="text-[11px] text-teal-700 font-medium ml-auto">
                              Vol: {(s.weightKg * s.reps).toLocaleString()} kg
                            </span>
                          </div>

                          {s.notes && (
                            <p className="text-xs text-slate-500 italic mt-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                              💭 {s.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => onDuplicateSet(s)}
                            className="text-slate-400 hover:text-[#0e7490] p-1.5 rounded-md hover:bg-teal-50 transition-colors"
                            title="Repetir serie idéntica"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSet(s.id)}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                            title="Eliminar serie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
