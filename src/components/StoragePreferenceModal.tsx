import React, { useState, useRef } from 'react';
import {
  StorageMode,
  CloudProvider,
  setStoragePreference,
  createAppDataSnapshot,
  exportAndShareBackup,
  parseAppDataSnapshot,
  AppDataSnapshot,
} from '../utils/storageManager';
import { WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from '../types';
import {
  Cloud,
  Smartphone,
  CheckCircle2,
  Download,
  Upload,
  ShieldCheck,
  HelpCircle,
  X,
  FileCheck,
  AlertCircle,
  Database,
} from 'lucide-react';

interface StoragePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: StorageMode | null;
  onModeChanged: (newMode: StorageMode, provider: CloudProvider) => void;
  sets: WorkoutSet[];
  exercises: Exercise[];
  schedule: WeeklySchedule;
  cardioWorkouts: CardioWorkout[];
  onImportFullBackup: (snapshot: AppDataSnapshot) => void;
  isInitialPrompt?: boolean;
}

export const StoragePreferenceModal: React.FC<StoragePreferenceModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onModeChanged,
  sets,
  exercises,
  schedule,
  cardioWorkouts,
  onImportFullBackup,
  isInitialPrompt = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<StorageMode>(currentMode || 'local');
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('google_drive');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const safeSets = Array.isArray(sets) ? sets : [];
  const safeCardio = Array.isArray(cardioWorkouts) ? cardioWorkouts : [];
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  const totalLocalRecords = safeSets.length + safeCardio.length;

  const handleSavePreference = () => {
    setStoragePreference(selectedMode, selectedProvider);
    onModeChanged(selectedMode, selectedProvider);
    onClose();
  };

  const handleExportNow = async () => {
    setIsProcessing(true);
    setExportSuccess(null);
    try {
      const snapshot = createAppDataSnapshot(safeSets, safeExercises, schedule, safeCardio);
      const ok = await exportAndShareBackup(snapshot);
      if (ok) {
        setExportSuccess('¡Respaldo preparado con éxito! Guárdalo en tu Google Drive, OneDrive o archivos.');
        setTimeout(() => setExportSuccess(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const snapshot = parseAppDataSnapshot(text);
        onImportFullBackup(snapshot);
        setImportStatus(`¡Restauración exitosa! ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos de cardio recuperados.`);
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        setImportStatus(`Error al importar: ${err?.message || 'Archivo no válido'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-teal-500/10 via-teal-50/40 dark:from-teal-950/30 dark:via-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 dark:bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {isInitialPrompt ? '¿Dónde prefieres tus datos?' : 'Almacenamiento de Datos'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Elige entre la memoria de tu teléfono o tu propia nube
                </p>
              </div>
            </div>
            {!isInitialPrompt && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-sm text-slate-600 dark:text-slate-300">
          {/* Current Status banner */}
          {currentMode && (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Guardando actualmente en:</span>
                <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {currentMode === 'cloud' ? '☁️ Tu Nube Personal' : '📱 Este Teléfono (Local)'}
                </span>
              </div>
            </div>
          )}

          {/* Option 1: Local Device Storage */}
          <div
            onClick={() => setSelectedMode('local')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedMode === 'local'
                ? 'border-teal-600 dark:border-cyan-400 bg-teal-50/50 dark:bg-cyan-950/20 ring-1 ring-teal-500/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedMode === 'local' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Guardar en este teléfono (Local)
                    {selectedMode === 'local' && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />}
                  </div>
                  <span className="text-xs text-teal-700 dark:text-cyan-400 font-medium">Recomendado · Rápido y privado</span>
                </div>
              </div>
            </div>
            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tus entrenamientos se quedan guardados únicamente en la memoria de este navegador/teléfono. Funciona sin internet y no requiere cuentas de usuario.
            </p>
          </div>

          {/* Option 2: Personal Cloud Storage */}
          <div
            onClick={() => setSelectedMode('cloud')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedMode === 'cloud'
                ? 'border-teal-600 dark:border-cyan-400 bg-teal-50/50 dark:bg-cyan-950/20 ring-1 ring-teal-500/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedMode === 'cloud' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Subir a mi Nube Personal
                    {selectedMode === 'cloud' && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />}
                  </div>
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">Google Drive / OneDrive independiente</span>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-200">Tu cuenta personal e independiente:</strong> cada persona que usa la app conecta o respalda en su propio almacenamiento en la nube, jamás en la cuenta del creador.
            </p>

            {/* Provider sub-selector */}
            {selectedMode === 'cloud' && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ¿Qué servicio de nube utilizas?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider('google_drive');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      selectedProvider === 'google_drive'
                        ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-cyan-400 text-teal-700 dark:text-cyan-300 shadow-sm font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>📁 Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider('onedrive');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      selectedProvider === 'onedrive'
                        ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-cyan-400 text-teal-700 dark:text-cyan-300 shadow-sm font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>☁️ OneDrive / Nube</span>
                  </button>
                </div>

                {totalLocalRecords > 0 && (
                  <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      Detectamos <strong>{safeSets.length} series</strong> y <strong>{safeCardio.length} registros de cardio</strong> en este teléfono. No se borrarán: se exportarán automáticamente a tu nube.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Migration & Export/Import Quick Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Acciones de Respaldo y Migración</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportNow}
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Descargar o compartir copia de seguridad completa a tu Google Drive u otra app"
              >
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                <span>Exportar Copia (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Cargar copia de seguridad descargada de Google Drive o la nube"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Restaurar Copia</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {exportSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{exportSuccess}</span>
              </div>
            )}

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-teal-600" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          {!isInitialPrompt && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleSavePreference}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-teal-600 dark:bg-cyan-500 text-white hover:bg-teal-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-teal-500/20 active:scale-[0.98]"
          >
            {isInitialPrompt
              ? 'Guardar y Continuar'
              : selectedMode === currentMode
              ? 'Seguir con esta opción'
              : 'Guardar nuevo modo'}
          </button>
        </div>
      </div>
    </div>
  );
};
