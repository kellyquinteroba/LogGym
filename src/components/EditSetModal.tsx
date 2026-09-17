import React, { useState, useEffect } from 'react';
import { WorkoutSet, Exercise } from '../types';
import { X, Check, Dumbbell, Calendar, Timer, Tag } from 'lucide-react';

interface EditSetModalProps {
  isOpen: boolean;
  setToEdit: WorkoutSet | null;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (updatedSet: WorkoutSet) => void;
}

export const EditSetModal: React.FC<EditSetModalProps> = ({
  isOpen,
  setToEdit,
  exercises,
  onClose,
  onSave,
}) => {
  const [exerciseId, setExerciseId] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [routine, setRoutine] = useState('');
  const [date, setDate] = useState('');
  const [setNumber, setSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(8);
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (setToEdit) {
      setExerciseId(setToEdit.exerciseId);
      setExerciseName(setToEdit.exerciseName);
      setRoutine(setToEdit.routine || 'General');
      setDate(setToEdit.date);
      setSetNumber(setToEdit.setNumber);
      setWeightKg(setToEdit.weightKg);
      setReps(setToEdit.reps);
      setRpe(setToEdit.rpe);
      setRestSeconds(setToEdit.restSeconds);
      setNotes(setToEdit.notes || '');
    }
  }, [setToEdit]);

  if (!isOpen || !setToEdit) return null;

  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setExerciseId(selectedId);
    const found = exercises.find((ex) => ex.id === selectedId);
    if (found) {
      setExerciseName(found.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setToEdit) return;

    const updated: WorkoutSet = {
      ...setToEdit,
      exerciseId,
      exerciseName,
      routine,
      date,
      setNumber: Math.max(1, Number(setNumber) || 1),
      weightKg: Math.max(0, Number(weightKg) || 0),
      reps: Math.max(1, Number(reps) || 1),
      rpe: Math.min(10, Math.max(1, Number(rpe) || 8)),
      restSeconds: Math.max(0, Number(restSeconds) || 0),
      notes: notes.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-cyan-950/60 border border-teal-200/60 dark:border-cyan-800/50 flex items-center justify-center text-[#0e7490] dark:text-cyan-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Editar Serie Registrada
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ajusta las cargas, repeticiones o información de esta serie
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Exercise Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ejercicio
            </label>
            <select
              value={exerciseId}
              onChange={handleExerciseChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
              {!exercises.some((e) => e.id === exerciseId) && (
                <option value={exerciseId}>{exerciseName || 'Ejercicio seleccionado'}</option>
              )}
            </select>
          </div>

          {/* Date, Routine & Set Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" /> Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" /> Rutina
              </label>
              <input
                type="text"
                value={routine}
                onChange={(e) => setRoutine(e.target.value)}
                placeholder="Ej. Torso, Pierna..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                # de Serie
              </label>
              <input
                type="number"
                min="1"
                value={setNumber}
                onChange={(e) => setSetNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
          </div>

          {/* Weight, Reps, RPE */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reps
              </label>
              <input
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                RPE (1-10)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseFloat(e.target.value) || 8)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
            </div>
          </div>

          {/* Rest Seconds */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Timer className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" /> Descanso (segundos)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="15"
                min="0"
                value={restSeconds}
                onChange={(e) => setRestSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
              />
              <div className="flex gap-1">
                {[60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setRestSeconds(sec)}
                    className={`px-2 py-1 text-[11px] rounded-lg font-semibold border transition-colors ${
                      restSeconds === sec
                        ? 'bg-[#0e7490] text-white border-[#0e7490]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notas / Sensaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Buena técnica, sin dolor articular, agarre neutro..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e7490]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
