import React, { useState } from 'react';
import { MuscleGroup, Exercise } from '../types';
import { X, Plus } from 'lucide-react';

interface NewExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Pecho / Torso',
  'Espalda',
  'Pierna / Cuádriceps',
  'Isquiotibiales / Glúteo',
  'Glúteos',
  'Hombros',
  'Brazos',
  'Core / Abdomen',
  'Cuerpo Completo',
];

export const NewExerciseModal: React.FC<NewExerciseModalProps> = ({
  isOpen,
  onClose,
  onAddExercise,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MuscleGroup>('Pecho / Torso');
  const [cues, setCues] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      category,
      cues: cues.trim() || 'Técnica controlada y rango de movimiento completo.',
      isCustom: true,
    };

    onAddExercise(newEx);
    setName('');
    setCues('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Nuevo ejercicio</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del ejercicio
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Press Francés con Mancuernas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-100 text-slate-900 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Grupo muscular
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MuscleGroup)}
              className="w-full bg-slate-100 text-slate-900 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none font-medium"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clave técnica / Cues (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Mantener codos cerrados y retracción de hombros..."
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              className="w-full bg-slate-100 text-slate-900 text-sm rounded-lg px-3 py-2 border-0 focus:bg-white focus:ring-2 focus:ring-[#0e7490] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0e7490] hover:bg-[#0c627a] text-white rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Guardar ejercicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
