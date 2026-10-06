import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutSet, Exercise, SetStyle, DropStage } from '../types';
import { SET_STYLES, getSetStyleConfig } from '../utils/setStyles';
import { sortExercisesAlphabetically } from '../utils/calculations';
import { X, Check, Dumbbell, Calendar, Timer, Tag, Layers, Link2, Info, Flame, Plus, Trash2 } from 'lucide-react';

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
  const sortedExercises = useMemo(() => {
    return sortExercisesAlphabetically(exercises);
  }, [exercises]);

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
  const [setStyle, setSetStyle] = useState<SetStyle>('normal');
  const [customStyleName, setCustomStyleName] = useState('');
  const [pairedExerciseName, setPairedExerciseName] = useState('');
  const [dropStages, setDropStages] = useState<DropStage[]>([]);

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
      setSetStyle(setToEdit.setStyle || 'normal');
      setCustomStyleName(setToEdit.customStyleName || '');
      setPairedExerciseName(setToEdit.pairedExerciseName || '');
      if (setToEdit.dropStages && Array.isArray(setToEdit.dropStages)) {
        setDropStages(setToEdit.dropStages.map((d) => ({ ...d })));
      } else {
        setDropStages([]);
      }
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

  const handleSelectStyle = (newStyle: SetStyle) => {
    setSetStyle(newStyle);
    if (newStyle === 'dropset' && dropStages.length === 0) {
      const curW = Number(weightKg) || 100;
      setDropStages([
        { weightKg: Math.max(1, Math.round(curW * 0.8 * 2) / 2), reps: 8 },
        { weightKg: Math.max(1, Math.round(curW * 0.6 * 2) / 2), reps: 5 },
      ]);
    }
  };

  const handleAddDropStage = () => {
    const lastWeight =
      dropStages.length > 0 ? dropStages[dropStages.length - 1].weightKg : Number(weightKg) || 60;
    const lastReps =
      dropStages.length > 0 ? dropStages[dropStages.length - 1].reps : Number(reps) || 8;
    const nextWeight = Math.max(0, Math.round(lastWeight * 0.8 * 2) / 2);
    const nextReps = Math.max(1, lastReps - 2 || 5);
    setDropStages([...dropStages, { weightKg: nextWeight, reps: nextReps }]);
  };

  const handleUpdateDropStage = (index: number, field: 'weightKg' | 'reps', val: number) => {
    setDropStages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveDropStage = (index: number) => {
    setDropStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setToEdit) return;

    const cleanedDropStages =
      setStyle === 'dropset' && dropStages.length > 0
        ? dropStages.filter((d) => Number(d.weightKg) > 0 || Number(d.reps) > 0)
        : undefined;

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
      setStyle,
      customStyleName: setStyle === 'custom' ? customStyleName.trim() : undefined,
      pairedExerciseName:
        setStyle === 'superset' || setStyle === 'biserie' || setStyle === 'triserie'
          ? pairedExerciseName.trim()
          : undefined,
      dropStages: cleanedDropStages,
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
              {sortedExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
              {!sortedExercises.some((e) => e.id === exerciseId) && (
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
                {setStyle === 'dropset' ? 'Peso inicial (kg)' : 'Peso (kg)'}
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
                {setStyle === 'dropset' ? 'Reps iniciales' : 'Reps'}
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

          {/* Estilo de Serie */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                Estilo de serie
              </label>
              <select
                value={setStyle}
                onChange={(e) => handleSelectStyle(e.target.value as SetStyle)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
              >
                {SET_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick chips in modal */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { id: 'normal' as const, label: 'Normal' },
                { id: 'dropset' as const, label: 'Drop Set' },
                { id: 'superset' as const, label: 'Superset' },
                { id: 'biserie' as const, label: 'Biserie' },
                { id: 'rest_pause' as const, label: 'Rest-Pause' },
                { id: 'top_set' as const, label: 'Top Set' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectStyle(item.id)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                    setStyle === item.id
                      ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Drop stages editor if dropset */}
            {setStyle === 'dropset' && (
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/60 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Bajadas consecutivas (Drops en Serie {setNumber}):
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    {1 + dropStages.length} pesos en 1 serie
                  </span>
                </div>

                <div className="space-y-2 mb-2.5">
                  {dropStages.map((ds, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
                    >
                      <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/80 px-2 py-1 rounded-md shrink-0">
                        Drop {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={ds.weightKg}
                            onChange={(e) =>
                              handleUpdateDropStage(idx, 'weightKg', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg pl-2 pr-6 py-1.5 border border-slate-200 dark:border-slate-700"
                            placeholder="Peso"
                          />
                          <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                            kg
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={ds.reps}
                            onChange={(e) =>
                              handleUpdateDropStage(idx, 'reps', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg pl-2 pr-8 py-1.5 border border-slate-200 dark:border-slate-700"
                            placeholder="Reps"
                          />
                          <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                            reps
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDropStage(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg"
                        title="Eliminar bajada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddDropStage}
                  className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200/80 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  Añadir bajada (drop)
                </button>
              </div>
            )}

            {/* Paired exercise input if Superset, Biserie or Triserie */}
            {(setStyle === 'superset' || setStyle === 'biserie' || setStyle === 'triserie') && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#0e7490] dark:text-cyan-400" />
                  Ejercicio complementario / en pareja:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="edit-paired-exercises-list"
                    value={pairedExerciseName}
                    onChange={(e) => setPairedExerciseName(e.target.value)}
                    placeholder="Ej. Elevaciones laterales, Curl de bíceps..."
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
                  />
                  <datalist id="edit-paired-exercises-list">
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

            {/* Custom style name */}
            {setStyle === 'custom' && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de variante personalizada:
                </label>
                <input
                  type="text"
                  value={customStyleName}
                  onChange={(e) => setCustomStyleName(e.target.value)}
                  placeholder="Ej. Cluster Set, Isometría..."
                  className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e7490]"
                />
              </div>
            )}

            {/* Description */}
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
