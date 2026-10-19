import React, { useState, useEffect, useRef } from 'react';
import {
  StorageMode,
  CloudProvider,
  setStoragePreference,
  createAppDataSnapshot,
  exportAndShareBackup,
  parseAppDataSnapshot,
  AppDataSnapshot,
} from '../utils/storageManager';
import {
  signInWithGoogle,
  signOutGoogle,
  syncAppDataToGoogleDrive,
  fetchAppDataFromGoogleDrive,
  initAuthListener,
  auth,
} from '../services/googleDriveService';
import { User } from 'firebase/auth';
import { WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from '../types';
import {
  Cloud,
  Smartphone,
  CheckCircle2,
  Download,
  Upload,
  ShieldCheck,
  X,
  FileCheck,
  AlertCircle,
  Database,
  RefreshCw,
  Folder,
  LogOut,
  FolderCheck,
  Lock,
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

  // Google Drive Authentication State
  const [googleUser, setGoogleUser] = useState<User | null>(() => auth.currentUser);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null);
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null);

  // Listen for Google Auth changes
  useEffect(() => {
    const unsub = initAuthListener((u, token) => {
      setGoogleUser(u);
      setDriveToken(token);
      if (u?.email) {
        setStoragePreference(selectedMode, selectedProvider, u.email);
      }
    });
    return () => unsub();
  }, [selectedMode, selectedProvider]);

  if (!isOpen) return null;

  const safeSets = Array.isArray(sets) ? sets : [];
  const safeCardio = Array.isArray(cardioWorkouts) ? cardioWorkouts : [];
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  const totalLocalRecords = safeSets.length + safeCardio.length;

  const handleSavePreference = () => {
    setStoragePreference(selectedMode, selectedProvider, googleUser?.email || undefined);
    onModeChanged(selectedMode, selectedProvider);
    onClose();
  };

  const handleConnectGoogle = async () => {
    setIsProcessing(true);
    setDriveSyncError(null);
    setDriveSyncMessage(null);
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setDriveToken(res.accessToken);
      setSelectedMode('cloud');
      setSelectedProvider('google_drive');
      setStoragePreference('cloud', 'google_drive', res.user.email || undefined);
      setDriveSyncMessage(
        `¡Conectado exitosamente con ${res.user.email}! Ya puedes sincronizar tus datos con tu Google Drive.`
      );
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setDriveSyncError(err?.message || 'Error al autenticar con tu cuenta de Google.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setDriveToken(null);
    setDriveSyncMessage(null);
    setDriveSyncError(null);
  };

  const handleSyncToDriveNow = async () => {
    setIsDriveSyncing(true);
    setDriveSyncMessage(null);
    setDriveSyncError(null);
    try {
      let token = driveToken;
      if (!token) {
        const res = await signInWithGoogle();
        token = res.accessToken;
        setGoogleUser(res.user);
        setDriveToken(res.accessToken);
      }
      const snapshot = createAppDataSnapshot(safeSets, safeExercises, schedule, safeCardio);
      const res = await syncAppDataToGoogleDrive(token, snapshot);
      if (res.success) {
        setDriveSyncMessage(
          `¡Sincronizado con éxito! Carpeta "${res.folderName}" actualizada en tu Google Drive (${res.itemCount?.sets} series y ${res.itemCount?.cardio} entrenos de cardio guardados).`
        );
      } else {
        setDriveSyncError(res.error || 'No se pudo sincronizar en Google Drive.');
      }
    } catch (err: any) {
      setDriveSyncError(err?.message || 'Error durante la sincronización.');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleRestoreFromDriveNow = async () => {
    setIsDriveSyncing(true);
    setDriveSyncMessage(null);
    setDriveSyncError(null);
    try {
      let token = driveToken;
      if (!token) {
        const res = await signInWithGoogle();
        token = res.accessToken;
        setGoogleUser(res.user);
        setDriveToken(res.accessToken);
      }
      const snapshot = await fetchAppDataFromGoogleDrive(token);
      onImportFullBackup(snapshot);
      setDriveSyncMessage(
        `¡Restauración exitosa! Se recuperaron ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos de cardio desde la carpeta "LogGym" de tu Google Drive.`
      );
    } catch (err: any) {
      setDriveSyncError(err?.message || 'No se pudo restaurar el archivo de respaldo desde Google Drive.');
    } finally {
      setIsDriveSyncing(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
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
                  {isInitialPrompt ? '¿Dónde prefieres tus datos?' : 'Almacenamiento y Nube'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Guarda en este teléfono o en tu propia cuenta de Google Drive
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
                <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-teal-800">
                  {currentMode === 'cloud'
                    ? googleUser?.email
                      ? `☁️ Google Drive (${googleUser.email})`
                      : '☁️ Tu Nube Personal'
                    : '📱 Este Teléfono (Local)'}
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
                  <span className="text-xs text-teal-700 dark:text-cyan-400 font-medium">Rápido y privado · Sin cuentas</span>
                </div>
              </div>
            </div>
            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tus entrenamientos se quedan guardados únicamente en la memoria de este navegador/teléfono. Funciona 100% offline y no requiere iniciar sesión.
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
              <strong className="text-slate-700 dark:text-slate-200">Tu cuenta personal e independiente:</strong> cada persona que usa la app conecta su propia cuenta de Google o Microsoft. Los datos se guardan en tu propia nube y nunca en la cuenta del creador.
            </p>

            {/* Provider sub-selector */}
            {selectedMode === 'cloud' && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Selecciona tu servicio de nube:
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
                        ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-cyan-400 text-teal-700 dark:text-cyan-300 shadow-sm font-bold ring-1 ring-teal-500/20'
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
                        ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-cyan-400 text-teal-700 dark:text-cyan-300 shadow-sm font-bold ring-1 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>☁️ OneDrive / Nube</span>
                  </button>
                </div>

                {/* Google Drive Account Linking Panel */}
                {selectedProvider === 'google_drive' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/80 shadow-sm space-y-3"
                  >
                    {!googleUser ? (
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <Folder className="w-4 h-4 text-teal-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            Al vincular, se te pedirá tu cuenta de Google. LogGym creará automáticamente la carpeta <strong>«LogGym»</strong> en tu Google Drive personal para guardar tus entrenamientos.
                          </span>
                        </div>

                        {/* Official Google Sign-in Button */}
                        <button
                          type="button"
                          onClick={handleConnectGoogle}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-800 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] transition-all"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>{isProcessing ? 'Conectando con Google...' : 'Vincular mi cuenta de Google Drive'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Connected Account Card */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/70 dark:bg-cyan-950/40 border border-teal-200/80 dark:border-teal-800/60">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {googleUser.photoURL ? (
                              <img
                                src={googleUser.photoURL}
                                alt="Google Avatar"
                                className="w-8 h-8 rounded-full border border-teal-300 dark:border-cyan-500"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                                {googleUser.displayName?.charAt(0) || googleUser.email?.charAt(0) || 'G'}
                              </div>
                            )}
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {googleUser.displayName || 'Usuario de Google'}
                              </p>
                              <p className="text-[11px] text-teal-700 dark:text-cyan-300 truncate">
                                {googleUser.email}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleDisconnectGoogle}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Desvincular o cambiar cuenta"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Folder Info */}
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Carpeta en tu Google Drive: <strong className="text-slate-900 dark:text-white font-mono">LogGym</strong>
                          </span>
                        </div>

                        {/* Cloud Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleSyncToDriveNow}
                            disabled={isDriveSyncing}
                            className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                            <span>{isDriveSyncing ? 'Sincronizando...' : 'Subir a Drive'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRestoreFromDriveNow}
                            disabled={isDriveSyncing}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Bajar de Drive</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {driveSyncMessage && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{driveSyncMessage}</span>
                      </div>
                    )}

                    {driveSyncError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <span>{driveSyncError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* OneDrive explanation */}
                {selectedProvider === 'onedrive' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                  >
                    <p className="text-slate-600 dark:text-slate-300">
                      Para respaldar en <strong>OneDrive</strong>, iCloud o tus archivos: pulsa el botón <strong>«Exportar Copia»</strong> abajo para guardarlo directamente en tu carpeta de OneDrive en el móvil.
                    </p>
                  </div>
                )}

                {totalLocalRecords > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      Detectamos <strong>{safeSets.length} series</strong> y <strong>{safeCardio.length} registros de cardio</strong> en este teléfono. No se borrarán y se pueden sincronizar a tu nube.
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
              <span>Copia Manual de Respaldo (.json)</span>
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
                <span>Exportar Archivo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Cargar copia de seguridad descargada de Google Drive o la nube"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Restaurar Archivo</span>
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
              Cerrar
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
              ? 'Guardar Preferencia'
              : 'Guardar nuevo modo'}
          </button>
        </div>
      </div>
    </div>
  );
};
