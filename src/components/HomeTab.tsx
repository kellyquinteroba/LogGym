import React from 'react';
import { WorkoutSet, Exercise } from '../types';
import { QuickLogCard } from './QuickLogCard';
import { History, Plus, Trash2, Clock, Sparkles, FileSpreadsheet, Smartphone, ArrowRight } from 'lucide-react';
import { calculateTotalVolume, calculateAverageRPE, formatDisplayDate, sortSetsChronological } from '../utils/calculations';

interface HomeTabProps {
  sets: WorkoutSet[];
  exercises: Exercise[];
  onSaveSet: (newSet: Omit<WorkoutSet, 'id' | 'timestamp'>, autoStartRest?: boolean) => void;
  onDeleteSet: (id: string) => void;
  onViewHistory: () => void;
  onOpenQuickLogModal: () => void;
  onOpenNewExerciseModal: () => void;
  onLoadSampleData: () => void;
  onOpenExcelModal?: () => void;
  onOpenInstallModal?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  sets,
  exercises,
  onSaveSet,
  onDeleteSet,
  onViewHistory,
  onOpenQuickLogModal,
  onOpenNewExerciseModal,
  onLoadSampleData,
  onOpenExcelModal,
  onOpenInstallModal,
}) => {
  // Today's metrics (or all recent if today is empty, to give immediate feedback)
  const totalVolume = calculateTotalVolume(sets);
  const totalSetsCount = sets.length;
  const avgRpe = calculateAverageRPE(sets);

  const latestSets = sortSetsChronological(sets, 'desc').slice(0, 5);

  const scrollToQuickLog = () => {
    const el = document.getElementById('quick-log-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const select = document.getElementById('select-ejercicio');
      if (select) select.focus();
    }
  };

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hoy entrenas</h1>
        <button
          type="button"
          id="btn-top-registrar-serie"
          onClick={scrollToQuickLog}
          className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar serie
        </button>
      </div>

      {/* KPI Cards (Matches Screenshot 1) */}
      <div className="space-y-3">
        {/* Volumen total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Volumen total</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalVolume.toLocaleString()} kg
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {totalSetsCount > 0 ? `${totalSetsCount} series calculadas` : 'Historial cargado'}
          </p>
        </div>

        {/* Series totales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Series totales</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalSetsCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Registradas</p>
        </div>

        {/* RPE medio */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">RPE medio</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {avgRpe > 0 ? avgRpe : '0'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Esfuerzo percibido</p>
        </div>
      </div>

      {/* Quick shortcuts for Excel and APK */}
      {(onOpenExcelModal || onOpenInstallModal) && (
        <div className="grid grid-cols-2 gap-2 mt-3 mb-1">
          {onOpenExcelModal && (
            <button
              type="button"
              onClick={onOpenExcelModal}
              className="bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-950 leading-tight">Guardar Excel</p>
                  <p className="text-[10px] text-emerald-700 leading-tight">Exportar .xlsx</p>
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="bg-cyan-50/80 hover:bg-cyan-100/80 border border-cyan-200/80 rounded-xl p-2.5 flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0e7490] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-cyan-950 leading-tight">App / APK</p>
                  <p className="text-[10px] text-cyan-700 leading-tight">Instalar en móvil</p>
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-cyan-600 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      )}

      {/* Quick Log Form (Matches Screenshot 1 & 2) */}
      <QuickLogCard
        exercises={exercises}
        recentSets={sets}
        onSaveSet={onSaveSet}
        onViewHistory={onViewHistory}
        onOpenNewExerciseModal={onOpenNewExerciseModal}
      />

      {/* Últimas series Section (Matches Screenshot 2) */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Últimas series</h2>
          <span className="text-slate-400 text-xs font-mono">
            {latestSets.length > 0 ? `${latestSets.length} recientes` : ''}
          </span>
        </div>

        {latestSets.length === 0 ? (
          /* Empty state matching Image 2 */
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No hay series todavía</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
              Registra tu primera serie para verla aquí.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={scrollToQuickLog}
                className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Registrar serie
              </button>
              <button
                type="button"
                onClick={onLoadSampleData}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Cargar datos de prueba
              </button>
            </div>
          </div>
        ) : (
          /* Recent sets list */
          <div className="space-y-2.5">
            {latestSets.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-100 p-3 shadow-xs hover:border-slate-200 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {s.exerciseName}
                    </h4>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      Serie {s.setNumber}
                    </span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                      {s.routine}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-900">{s.weightKg} kg</span>
                    <span>×</span>
                    <span className="font-semibold text-slate-900">{s.reps} reps</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">RPE {s.rpe}</span>
                    <span className="text-slate-400">|</span>
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <Clock className="w-3 h-3" /> {s.restSeconds}s
                    </span>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                      "{s.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 mr-1">
                    {formatDisplayDate(s.date)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteSet(s.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Eliminar serie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
