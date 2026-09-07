import React, { useState, useMemo } from 'react';
import { Exercise } from '../types';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';

interface ExercisesTabProps {
  exercises: Exercise[];
  onOpenNewExerciseModal: () => void;
  onSelectForLog: (exerciseId: string) => void;
  onDeleteCustomExercise?: (id: string) => void;
}

export const ExercisesTab: React.FC<ExercisesTabProps> = ({
  exercises,
  onOpenNewExerciseModal,
  onSelectForLog,
  onDeleteCustomExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  const groups = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => set.add(ex.category));
    return Array.from(set);
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.cues.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'all' || ex.category === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [exercises, searchTerm, selectedGroup]);

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Header (Matches Screenshot 5) */}
      <div className="pt-1 pb-3">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Biblioteca Técnica
        </h1>
        <button
          type="button"
          id="btn-nuevo-ejercicio"
          onClick={onOpenNewExerciseModal}
          className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo ejercicio
        </button>
      </div>

      {/* Search and Group filter (Matches Screenshot 5) */}
      <div className="space-y-2 mt-2 mb-5">
        <div className="relative">
          <input
            type="text"
            id="input-buscar-biblioteca"
            placeholder="Buscar por nombre o músculo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl pl-9 pr-3 py-2.5 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
        </div>

        <div>
          <select
            id="select-filtro-grupos"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-3 py-2.5 border-0 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none transition-all font-medium"
          >
            <option value="all">Todos los grupos</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guía de movimientos (Matches Screenshot 5) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Guía de movimientos</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {filteredExercises.length} movimientos
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden transition-colors">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 mr-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-[#0e7490] dark:group-hover:text-cyan-400 group-hover:bg-teal-50/50 dark:group-hover:bg-cyan-950/40 transition-colors flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{ex.name}</h3>
                    {ex.isCustom && (
                      <span className="text-[9px] bg-teal-100 dark:bg-cyan-950/80 text-teal-800 dark:text-cyan-300 px-1.5 py-0.2 rounded font-semibold border border-transparent dark:border-cyan-800/40">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <strong className="font-medium text-slate-600 dark:text-slate-300">{ex.category}</strong> · {ex.cues}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  id={`btn-registrar-${ex.id}`}
                  onClick={() => onSelectForLog(ex.id)}
                  className="text-xs font-bold text-[#0e7490] dark:text-cyan-400 hover:text-[#0a5c73] dark:hover:text-cyan-300 hover:underline px-2 py-1 transition-colors"
                >
                  Registrar
                </button>
                {ex.isCustom && onDeleteCustomExercise && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomExercise(ex.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded transition-colors"
                    title="Eliminar ejercicio personalizado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No se encontraron movimientos con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
