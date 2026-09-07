import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSet } from '../types';
import { getTodayDateString } from '../utils/calculations';
import { Sparkles, Timer, Check, Plus } from 'lucide-react';

interface QuickLogCardProps {
  exercises: Exercise[];
  recentSets: WorkoutSet[];
  onSaveSet: (newSet: Omit<WorkoutSet, 'id' | 'timestamp'>, autoStartRest?: boolean) => void;
  onViewHistory: () => void;
  initialExerciseId?: string;
  onOpenNewExerciseModal?: () => void;
}

export const QuickLogCard: React.FC<QuickLogCardProps> = ({
  exercises,
  recentSets,
  onSaveSet,
  onViewHistory,
  initialExerciseId = '',
  onOpenNewExerciseModal,
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [routine, setRoutine] = useState('Torso A');
  const [exerciseId, setExerciseId] = useState(initialExerciseId || (exercises[0]?.id ?? ''));
  const [setNumber, setSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState<number | ''>(0);
  const [reps, setReps] = useState<number | ''>(10);
  const [rpe, setRpe] = useState<number | ''>(7);
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState('');
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  // Sync initial exercise if passed externally
  useEffect(() => {
    if (initialExerciseId) {
      setExerciseId(initialExerciseId);
    }
  }, [initialExerciseId]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    const parsedWeight = typeof weightKg === 'number' ? weightKg : parseFloat(String(weightKg)) || 0;
    const parsedReps = typeof reps === 'number' ? reps : parseInt(String(reps), 10) || 1;
    const parsedRpe = typeof rpe === 'number' ? rpe : parseFloat(String(rpe)) || 7;

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
      },
      autoStartTimer
    );

    // Prepare for next set
    setSetNumber((prev) => prev + 1);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const calculatedVolume = (Number(weightKg) || 0) * (Number(reps) || 0);

  return (
    <div id="quick-log-card" className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Registro rápido</h2>
        <button
          type="button"
          id="btn-ver-historial"
          onClick={onViewHistory}
          className="text-xs font-semibold text-[#0e7490] hover:underline"
        >
          Ver historial
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          El volumen se calcula automáticamente como peso por repeticiones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              id="input-fecha"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all"
            />
          </div>

          {/* Día / Rutina */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Día / Rutina</label>
            <div className="relative">
              <input
                type="text"
                id="input-rutina"
                list="rutinas-list"
                value={routine}
                onChange={(e) => setRoutine(e.target.value)}
                placeholder="Ej. Torso A, Pierna, Empuje..."
                className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all"
              />
              <datalist id="rutinas-list">
                <option value="Torso A" />
                <option value="Torso B" />
                <option value="Pierna & Glúteo" />
                <option value="Empuje (Push)" />
                <option value="Tirón (Pull)" />
                <option value="Fullbody" />
              </datalist>
            </div>
          </div>

          {/* Ejercicio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Ejercicio</label>
              {onOpenNewExerciseModal && (
                <button
                  type="button"
                  onClick={onOpenNewExerciseModal}
                  className="text-[11px] text-[#0e7490] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Añadir nuevo
                </button>
              )}
            </div>
            <select
              id="select-ejercicio"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2.5 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all font-medium"
            >
              <option value="" disabled>
                Selecciona un ejercicio
              </option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
            </select>
            {selectedExercise && (
              <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                💡 {selectedExercise.cues}
              </p>
            )}
          </div>

          {/* 2x2 Grid for Serie, Peso, Reps, RPE */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Serie */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serie</label>
              <input
                type="number"
                id="input-serie"
                min="1"
                max="30"
                value={setNumber}
                onChange={(e) => setSetNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all"
              />
            </div>

            {/* Peso (kg) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Peso (kg)</label>
                {calculatedVolume > 0 && (
                  <span className="text-[10px] text-teal-700 font-medium">
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
                className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* Reps */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reps</label>
              <input
                type="number"
                id="input-reps"
                min="1"
                max="100"
                value={reps}
                onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* RPE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">RPE (1-10)</label>
                <span className="text-[10px] text-slate-400">Esfuerzo</span>
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
                className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Descanso entre series */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-[#0e7490]" />
                Descanso posterior
              </label>
              <span className="text-xs font-medium text-slate-600">
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
                      ? 'bg-[#0e7490]/10 border-[#0e7490] text-[#0e7490] font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={autoStartTimer}
                onChange={(e) => setAutoStartTimer(e.target.checked)}
                className="rounded border-slate-300 text-[#0e7490] focus:ring-[#0e7490]"
              />
              <span>Iniciar temporizador de descanso automáticamente al guardar</span>
            </label>
          </div>

          {/* Notas / Sensaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas / Sensaciones
            </label>
            <textarea
              id="input-notas"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pausa, técnica, energía o molestias..."
              className="w-full bg-slate-100/90 text-slate-800 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none transition-all resize-none"
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
                  <Check className="w-4 h-4" /> ¡Serie registrada con éxito!
                </>
              ) : (
                <>Guardar serie</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
