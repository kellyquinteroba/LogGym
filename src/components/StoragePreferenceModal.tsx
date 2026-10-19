import React, { useState, useEffect, useRef } from 'react';
import {
  StorageMode,
  CloudProvider,
  setStoragePreference,
  createAppDataSnapshot,
  exportAndShareBackup,
  parseAppDataSnapshot,
  AppDataSnapshot,
  getStoragePreference,
} from '../utils/storageManager';
import {
  signInWithGoogle,
  signOutGoogle,
  syncAppDataToGoogleDrive,
  fetchAppDataFromGoogleDrive,
  initAuthListener,
} from '../services/googleDriveService';
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
  Share2,
  ExternalLink,
  Mail,
  Check,
  FolderSync,
  Edit2,
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
  const initialPref = getStoragePreference();
  const [selectedMode, setSelectedMode] = useState<StorageMode>(currentMode || 'local');
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(initialPref.provider || 'google_drive');
  const [activeTab, setActiveTab] = useState<'local' | 'google_drive' | 'onedrive'>(
    (currentMode === 'cloud' ? initialPref.provider || 'google_drive' : 'local') as 'local' | 'google_drive' | 'onedrive'
  );

  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud Account State
  const [googleEmail, setGoogleEmail] = useState<string>(initialPref.accountEmail || '');
  const [emailInput, setEmailInput] = useState<string>(initialPref.accountEmail || '');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!initialPref.accountEmail);
  const [googleDisplayName, setGoogleDisplayName] = useState<string>('');
  const [googlePhoto, setGooglePhoto] = useState<string | undefined>(undefined);
  const [driveToken, setDriveToken] = useState<string | null>(null);

  // Folder Configuration
  const [folderName, setFolderName] = useState<string>(initialPref.folderName || 'LogGym');
  const [isEditingFolder, setIsEditingFolder] = useState<boolean>(false);
  const [folderInput, setFolderInput] = useState<string>(initialPref.folderName || 'LogGym');

  // OneDrive State
  const [oneDriveEmail, setOneDriveEmail] = useState<string>(
    initialPref.provider === 'onedrive' ? initialPref.accountEmail || '' : ''
  );
  const [oneDriveInput, setOneDriveInput] = useState<string>(
    initialPref.provider === 'onedrive' ? initialPref.accountEmail || '' : ''
  );
  const [isEditingOneDriveEmail, setIsEditingOneDriveEmail] = useState<boolean>(
    initialPref.provider !== 'onedrive' || !initialPref.accountEmail
  );

  // Sync / Action feedback
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null);
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null);

  // Sync activeTab with selectedMode
  useEffect(() => {
    if (activeTab === 'local') {
      setSelectedMode('local');
    } else {
      setSelectedMode('cloud');
      setSelectedProvider(activeTab);
    }
  }, [activeTab]);

  // Listen for Google Auth changes if available
  useEffect(() => {
    const unsub = initAuthListener((u, token) => {
      if (u?.email) {
        setGoogleEmail(u.email);
        setEmailInput(u.email);
        setIsEditingEmail(false);
        setGoogleDisplayName(u.displayName || u.email);
        setGooglePhoto(u.photoURL || undefined);
        setDriveToken(token);
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const safeSets = Array.isArray(sets) ? sets : [];
  const safeCardio = Array.isArray(cardioWorkouts) ? cardioWorkouts : [];
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  const totalLocalRecords = safeSets.length + safeCardio.length;

  const handleSavePreference = () => {
    let emailToSave: string | undefined = undefined;
    if (activeTab === 'google_drive') {
      emailToSave = googleEmail || emailInput.trim() || undefined;
    } else if (activeTab === 'onedrive') {
      emailToSave = oneDriveEmail || oneDriveInput.trim() || undefined;
    }

    const currentFolder = folderName.trim() || 'LogGym';
    setStoragePreference(selectedMode, selectedProvider, emailToSave, currentFolder);
    onModeChanged(selectedMode, selectedProvider);
    onClose();
  };

  const handleManualEmailConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setDriveSyncError('Por favor ingresa un correo electrónico válido (ej: tu-nombre@gmail.com)');
      return;
    }
    setGoogleEmail(cleanEmail);
    setIsEditingEmail(false);
    setDriveSyncError(null);
    setDriveSyncMessage(`¡Cuenta vinculada con ${cleanEmail}! Carpeta «${folderName}» configurada en tu Google Drive.`);
    setStoragePreference('cloud', 'google_drive', cleanEmail, folderName);
  };

  const handleManualOneDriveConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = oneDriveInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setDriveSyncError('Por favor ingresa un correo de Microsoft válido (ej: tu-nombre@outlook.com)');
      return;
    }
    setOneDriveEmail(cleanEmail);
    setIsEditingOneDriveEmail(false);
    setDriveSyncError(null);
    setDriveSyncMessage(`¡Cuenta vinculada con ${cleanEmail}! Carpeta «${folderName}» configurada en tu OneDrive.`);
    setStoragePreference('cloud', 'onedrive', cleanEmail, folderName);
  };

  const handleConnectGoogle = async () => {
    setIsProcessing(true);
    setDriveSyncError(null);
    setDriveSyncMessage(null);
    try {
      const res = await signInWithGoogle();
      if (res.success && res.user?.email) {
        setGoogleEmail(res.user.email);
        setEmailInput(res.user.email);
        setIsEditingEmail(false);
        setGoogleDisplayName(res.user.displayName || res.user.email);
        setGooglePhoto(res.user.photoURL);
        if (res.accessToken) setDriveToken(res.accessToken);
        setSelectedMode('cloud');
        setSelectedProvider('google_drive');
        setStoragePreference('cloud', 'google_drive', res.user.email, folderName);
        setDriveSyncMessage(`¡Conectado exitosamente con ${res.user.email}! Carpeta «${folderName}» lista en tu Google Drive.`);
      } else if (res.isDomainRestricted) {
        // Gentle fallback without raw Firebase errors
        setIsEditingEmail(true);
        setDriveSyncMessage('Confirma tu correo de Google a continuación para vincular tu cuenta y sincronizar con la carpeta «' + folderName + '»:');
      } else if (res.error && !res.error.includes('cancelado')) {
        setIsEditingEmail(true);
        setDriveSyncError(res.error);
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setIsEditingEmail(true);
      setDriveSyncMessage('Ingresa tu correo de Google a continuación para vincular tu cuenta:');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogle();
    setGoogleEmail('');
    setEmailInput('');
    setIsEditingEmail(true);
    setGoogleDisplayName('');
    setGooglePhoto(undefined);
    setDriveToken(null);
    setDriveSyncMessage(null);
    setDriveSyncError(null);
    setStoragePreference('local', 'google_drive', undefined, folderName);
  };

  const handleSaveCustomFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFolder = folderInput.trim() || 'LogGym';
    setFolderName(cleanFolder);
    setIsEditingFolder(false);
    setDriveSyncMessage(`Carpeta de respaldo actualizada a «${cleanFolder}».`);
    const emailToSave = activeTab === 'google_drive' ? googleEmail : oneDriveEmail;
    setStoragePreference(selectedMode, selectedProvider, emailToSave, cleanFolder);
  };

  const handleSyncToDriveNow = async () => {
    setIsDriveSyncing(true);
    setDriveSyncMessage(null);
    setDriveSyncError(null);
    try {
      const snapshot = createAppDataSnapshot(safeSets, safeExercises, schedule, safeCardio);
      const activeFolder = folderName.trim() || 'LogGym';

      // If active Google OAuth token is available in memory
      if (driveToken) {
        const res = await syncAppDataToGoogleDrive(driveToken, snapshot, activeFolder);
        if (res.success) {
          setDriveSyncMessage(
            `¡Guardado con éxito en tu Google Drive! Carpeta «${res.folderName || activeFolder}» actualizada (${res.itemCount?.sets} series y ${res.itemCount?.cardio} entrenos).`
          );
          setIsDriveSyncing(false);
          return;
        }
      }

      // Mobile share sheet: opens native Google Drive ("Guardar en Drive")
      // User picks their Google account and the folder directly in the native app
      const shared = await exportAndShareBackup(snapshot);
      if (shared) {
        setDriveSyncMessage(
          `¡Respaldo preparado! Selecciona tu cuenta de Google y la carpeta «${activeFolder}» para guardar tus ${safeSets.length} series.`
        );
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
      if (driveToken) {
        const activeFolder = folderName.trim() || 'LogGym';
        const snapshot = await fetchAppDataFromGoogleDrive(driveToken, activeFolder);
        onImportFullBackup(snapshot);
        setDriveSyncMessage(
          `¡Restauración exitosa! Se recuperaron ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos desde la carpeta «${activeFolder}» de tu Google Drive.`
        );
        setIsDriveSyncing(false);
        return;
      }
      // If token not directly available, let user select file from their Google Drive
      fileInputRef.current?.click();
    } catch (err: any) {
      setDriveSyncError(err?.message || 'Selecciona el archivo de respaldo descargado de tu Google Drive.');
      fileInputRef.current?.click();
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
        setExportSuccess('¡Copia preparada! Guárdala en tu Google Drive, OneDrive o archivos de tu teléfono.');
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
        setImportStatus(`¡Restauración exitosa! ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos recuperados.`);
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        setImportStatus(`Error al importar: ${err?.message || 'Archivo no válido'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88dvh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact, clean Header */}
        <div className="px-4 pt-3.5 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3 bg-gradient-to-r from-teal-500/10 via-slate-50 to-cyan-500/10 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/30 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Almacenamiento y Nube Personal
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isInitialPrompt ? '¿Dónde deseas guardar tus entrenamientos?' : 'Tus datos en tu teléfono o en tu nube privada'}
                </p>
              </div>
            </div>
            {!isInitialPrompt && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Mode Selector: 3 Options, perfectly fit, zero scroll */}
          <div className="grid grid-cols-3 p-1 mt-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'local'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Teléfono</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('google_drive')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'google_drive'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-sky-500" />
              <span>Google Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('onedrive')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'onedrive'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span>OneDrive</span>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable, well-spaced, never overflows viewport */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 overscroll-contain">
          {/* TAB 1: LOCAL STORAGE */}
          {activeTab === 'local' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-cyan-950/30 border border-teal-200 dark:border-teal-800/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1">
                  <Smartphone className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  <span>Memoria local de este dispositivo</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-cyan-400 ml-auto" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Tus datos se guardan únicamente en la memoria de este teléfono o navegador. Funciona 100% sin internet, con total privacidad y sin vincular ninguna cuenta externa.
                </p>
              </div>

              {totalLocalRecords > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      Datos guardados en tu teléfono:
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {safeSets.length} series de fuerza • {safeCardio.length} entrenos cardio
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportNow}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Copia .json</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'google_drive' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Informative Header */}
              <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-start gap-2.5">
                <Folder className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Tu nube personal de Google Drive
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Cada usuario conecta su propia cuenta de Google. LogGym guarda los datos exclusivamente en tu propio Google Drive personal, nunca en servidores del creador.
                  </p>
                </div>
              </div>

              {/* 1. Account Linking Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    1. Cuenta de Google
                  </span>
                  {googleEmail && !isEditingEmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className="text-[11px] text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>

                {googleEmail && !isEditingEmail ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {googlePhoto ? (
                        <img
                          src={googlePhoto}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-teal-400"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                          {googleDisplayName?.charAt(0) || googleEmail.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {googleDisplayName || 'Google Drive'}
                          </p>
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ Vinculada
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-700 dark:text-cyan-400 truncate font-mono">
                          {googleEmail}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors ml-2"
                      title="Desvincular cuenta"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Official Sign In with Google */}
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={isProcessing}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 shadow-sm transition-all"
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
                      <span>{isProcessing ? 'Conectando...' : 'Seleccionar Cuenta de Google'}</span>
                    </button>

                    <div className="relative flex items-center justify-center py-1">
                      <span className="h-px bg-slate-200 dark:bg-slate-700 w-full" />
                      <span className="px-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 uppercase font-semibold">
                        O escribe tu cuenta
                      </span>
                      <span className="h-px bg-slate-200 dark:bg-slate-700 w-full" />
                    </div>

                    {/* Direct email input (never fails on preview domains or brave shields) */}
                    <form onSubmit={handleManualEmailConnect} className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="usuario@gmail.com"
                          className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Vincular</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* 2. Folder Configuration Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    2. Carpeta en tu Google Drive
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFolderInput(folderName);
                      setIsEditingFolder(!isEditingFolder);
                    }}
                    className="text-[11px] text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingFolder ? 'Cancelar' : 'Personalizar'}</span>
                  </button>
                </div>

                {isEditingFolder ? (
                  <form onSubmit={handleSaveCustomFolder} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={folderInput}
                      onChange={(e) => setFolderInput(e.target.value)}
                      placeholder="Nombre de carpeta (ej: LogGym)"
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      Guardar
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Carpeta por defecto: <strong className="font-mono text-teal-700 dark:text-cyan-400">/{folderName}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Automática</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Se crea automáticamente en la raíz de tu Google Drive para almacenar tu archivo privado de entrenamientos.
                </p>
              </div>

              {/* 3. Sync & Action Controls */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-cyan-950/20 border border-teal-200/80 dark:border-cyan-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-cyan-300">
                    3. Guardar y Restaurar
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {safeSets.length} series • {safeCardio.length} cardio
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSyncToDriveNow}
                    disabled={isDriveSyncing}
                    className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                    <span>{isDriveSyncing ? 'Guardando...' : 'Subir a Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreFromDriveNow}
                    disabled={isDriveSyncing}
                    className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Bajar de Drive</span>
                  </button>
                </div>

                <div className="flex items-center justify-center pt-1">
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir mi Google Drive en otra pestaña</span>
                  </a>
                </div>
              </div>

              {/* Status alerts */}
              {driveSyncMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="break-words leading-tight">{driveSyncMessage}</span>
                </div>
              )}

              {driveSyncError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span className="break-words leading-tight">{driveSyncError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ONEDRIVE */}
          {activeTab === 'onedrive' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5">
                <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Tu nube personal de Microsoft OneDrive
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Guarda tus entrenamientos en tu cuenta de Microsoft personal con la carpeta «{folderName}».
                  </p>
                </div>
              </div>

              {/* Account Input for OneDrive */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Cuenta de Microsoft / OneDrive
                  </span>
                  {oneDriveEmail && !isEditingOneDriveEmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingOneDriveEmail(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>

                {oneDriveEmail && !isEditingOneDriveEmail ? (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        ✓ Vinculada
                      </span>
                      <p className="font-mono text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        {oneDriveEmail}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">OneDrive/{folderName}</span>
                  </div>
                ) : (
                  <form onSubmit={handleManualOneDriveConnect} className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={oneDriveInput}
                        onChange={(e) => setOneDriveInput(e.target.value)}
                        placeholder="usuario@outlook.com"
                        className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Vincular</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Actions for OneDrive */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportNow}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Guardar a OneDrive</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Importar de OneDrive</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for Importing */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {exportSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
              <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="break-words">{exportSuccess}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-teal-600" />
              <span className="break-words">{importStatus}</span>
            </div>
          )}
        </div>

        {/* Compact Sticky Footer - Always visible, never cut off on mobile */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0 z-10">
          {!isInitialPrompt && (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          )}

          <button
            type="button"
            onClick={handleSavePreference}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-600 dark:bg-cyan-500 text-white hover:bg-teal-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-teal-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <span>{isInitialPrompt ? 'Guardar y Continuar' : 'Confirmar Preferencia'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
