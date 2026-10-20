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
  initAuth,
  googleSignIn,
  logout,
  writeWorkoutJsonToDrive,
  readWorkoutJsonFromDrive,
  listLogGymFolderFiles,
  GoogleDriveFileMeta,
  GoogleDriveUser,
} from '../services/googleDriveService';
import { WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from '../types';
import {
  Cloud,
  Smartphone,
  CheckCircle2,
  Download,
  Upload,
  X,
  FileCheck,
  AlertCircle,
  Database,
  Folder,
  FolderCheck,
  Share2,
  ExternalLink,
  Mail,
  Check,
  Edit2,
  LogOut,
  Info,
  ShieldCheck,
  RefreshCw,
  FileText,
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

  // Google Drive API State
  const [googleUser, setGoogleUser] = useState<GoogleDriveUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFileMeta[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'write' | 'read';
  } | null>(null);

  // Folder Configuration
  const [folderName, setFolderName] = useState<string>(initialPref.folderName || 'LogGym');
  const [isEditingFolder, setIsEditingFolder] = useState<boolean>(false);
  const [folderInput, setFolderInput] = useState<string>(initialPref.folderName || 'LogGym');

  // Microsoft OneDrive State
  const [oneDriveEmail, setOneDriveEmail] = useState<string>(
    initialPref.provider === 'onedrive' ? initialPref.accountEmail || '' : ''
  );
  const [oneDriveInput, setOneDriveInput] = useState<string>(
    initialPref.provider === 'onedrive' ? initialPref.accountEmail || '' : ''
  );
  const [isEditingOneDriveEmail, setIsEditingOneDriveEmail] = useState<boolean>(
    !initialPref.accountEmail || initialPref.provider !== 'onedrive'
  );

  // Feedback notifications
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync activeTab with selectedMode
  useEffect(() => {
    if (activeTab === 'local') {
      setSelectedMode('local');
    } else {
      setSelectedMode('cloud');
      setSelectedProvider(activeTab);
    }
  }, [activeTab]);

  // Initialize auth listener
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAuthToken(token);
        if (user.email) {
          setStoragePreference('cloud', 'google_drive', user.email, folderName);
        }
        // Load existing files in LogGym folder
        listLogGymFolderFiles(token, folderName)
          .then((files) => setDriveFiles(files))
          .catch(() => {});
      },
      () => {
        setGoogleUser(null);
        setAuthToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsub();
  }, [folderName]);

  if (!isOpen) return null;

  const safeSets = Array.isArray(sets) ? sets : [];
  const safeCardio = Array.isArray(cardioWorkouts) ? cardioWorkouts : [];
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  const totalLocalRecords = safeSets.length + safeCardio.length;

  const handleSavePreference = () => {
    let emailToSave: string | undefined = undefined;
    if (activeTab === 'google_drive') {
      emailToSave = googleUser?.email || undefined;
    } else if (activeTab === 'onedrive') {
      emailToSave = oneDriveEmail || oneDriveInput.trim() || undefined;
    }

    const currentFolder = folderName.trim() || 'LogGym';
    setStoragePreference(selectedMode, selectedProvider, emailToSave, currentFolder);
    onModeChanged(selectedMode, selectedProvider);
    onClose();
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAuthToken(res.accessToken);
        setStoragePreference('cloud', 'google_drive', res.user.email || undefined, folderName);
        setSyncMessage(`¡Conectado exitosamente con ${res.user.email}! Carpeta «${folderName}» lista en tu Google Drive.`);
        const files = await listLogGymFolderFiles(res.accessToken, folderName);
        setDriveFiles(files);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setSyncError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsProcessing(true);
    try {
      await logout();
      setGoogleUser(null);
      setAuthToken(null);
      setDriveFiles([]);
      setSyncMessage('Sesión de Google cerrada.');
      setStoragePreference('local', 'google_drive', undefined, folderName);
    } catch (err: any) {
      setSyncError('Error al cerrar sesión.');
    } finally {
      setIsProcessing(false);
    }
  };

  // User confirmed action for writing to Google Drive
  const executeWriteToDrive = async () => {
    if (!authToken) {
      setSyncError('Debes iniciar sesión con Google primero.');
      return;
    }
    setIsProcessing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const snapshot = createAppDataSnapshot(safeSets, safeExercises, schedule, safeCardio);
      const res = await writeWorkoutJsonToDrive(authToken, snapshot, folderName);
      if (res.success) {
        setSyncMessage(
          `¡Archivo JSON guardado con éxito! "${res.fileName}" actualizado en la carpeta «${folderName}» de tu Google Drive (${safeSets.length} series de fuerza y ${safeCardio.length} entrenos de cardio).`
        );
        const files = await listLogGymFolderFiles(authToken, folderName);
        setDriveFiles(files);
      }
    } catch (err: any) {
      console.error('Error writing to Drive:', err);
      setSyncError(err?.message || 'Error al escribir el archivo en Google Drive.');
    } finally {
      setIsProcessing(false);
      setConfirmDialog(null);
    }
  };

  // User confirmed action for reading from Google Drive
  const executeReadFromDrive = async () => {
    if (!authToken) {
      setSyncError('Debes iniciar sesión con Google primero.');
      return;
    }
    setIsProcessing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const snapshot = await readWorkoutJsonFromDrive(authToken, folderName);
      onImportFullBackup(snapshot);
      setSyncMessage(
        `¡Restauración exitosa! Se leyeron ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos desde la carpeta «${folderName}» de tu Google Drive.`
      );
    } catch (err: any) {
      console.error('Error reading from Drive:', err);
      setSyncError(err?.message || 'Error al leer los datos desde Google Drive.');
    } finally {
      setIsProcessing(false);
      setConfirmDialog(null);
    }
  };

  const handleLinkOneDriveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = oneDriveInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSyncError('Por favor ingresa un correo de Microsoft válido (ej: tu-nombre@outlook.com)');
      return;
    }
    setOneDriveEmail(cleanEmail);
    setIsEditingOneDriveEmail(false);
    setSyncError(null);
    setSyncMessage(`¡Cuenta vinculada con ${cleanEmail}! Tus respaldos se guardarán en tu OneDrive personal.`);
    setStoragePreference('cloud', 'onedrive', cleanEmail, folderName);
  };

  const handleUnlinkOneDrive = () => {
    setOneDriveEmail('');
    setOneDriveInput('');
    setIsEditingOneDriveEmail(true);
    setSyncMessage(null);
    setSyncError(null);
    setStoragePreference('local', 'onedrive', undefined, folderName);
  };

  const handleSaveCustomFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFolder = folderInput.trim() || 'LogGym';
    setFolderName(cleanFolder);
    setIsEditingFolder(false);
    setSyncMessage(`Carpeta de Google Drive actualizada a «${cleanFolder}».`);
    const emailToSave = activeTab === 'google_drive' ? googleUser?.email : oneDriveEmail;
    setStoragePreference(selectedMode, selectedProvider, emailToSave, cleanFolder);
  };

  const handleSaveToCloudFromPhone = async (providerName: 'Google Drive' | 'OneDrive') => {
    setIsProcessing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const snapshot = createAppDataSnapshot(safeSets, safeExercises, schedule, safeCardio);
      const activeFolder = folderName.trim() || 'LogGym';

      const ok = await exportAndShareBackup(snapshot);
      if (ok) {
        setSyncMessage(
          `¡Enviado a tu teléfono! Selecciona "${providerName}" en tu pantalla y guarda el archivo en la carpeta «${activeFolder}».`
        );
      }
    } catch (err: any) {
      setSyncError(err?.message || `No se pudo enviar el archivo a ${providerName}.`);
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
        setImportStatus(`¡Restauración exitosa! Se recuperaron ${snapshot.sets.length} series de fuerza y ${snapshot.cardioWorkouts.length} entrenos.`);
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
        {/* Compact Header */}
        <div className="px-4 pt-3.5 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3 bg-gradient-to-r from-teal-500/10 via-slate-50 to-cyan-500/10 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/30 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Almacenamiento y Google Drive
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isInitialPrompt ? '¿Dónde deseas guardar tus entrenamientos?' : 'Integración con API de Google Drive y lectura/escritura'}
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

          {/* Segmented Mode Selector */}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 overscroll-contain">
          {/* TAB 1: LOCAL */}
          {activeTab === 'local' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-cyan-950/30 border border-teal-200 dark:border-teal-800/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1">
                  <Smartphone className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  <span>Memoria local de este dispositivo</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-cyan-400 ml-auto" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Tus datos se guardan únicamente en la memoria de este dispositivo o navegador. Funciona 100% sin conexión a internet y con total privacidad.
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
                    onClick={() => handleSaveToCloudFromPhone('Google Drive')}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Copia .json</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE (API INTEGRATION) */}
          {activeTab === 'google_drive' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Header card */}
              <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-start gap-2.5">
                <Folder className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Integración oficial con API de Google Drive
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Lectura y escritura directa de archivos JSON en tu carpeta dedicada <strong>«{folderName}»</strong> dentro de tu Google Drive personal.
                  </p>
                </div>
              </div>

              {/* Authentication Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Cuenta de Google
                  </span>
                  {googleUser && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Autenticado</span>
                    </span>
                  )}
                </div>

                {googleUser ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-teal-400"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {googleUser.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {googleUser.displayName || 'Google Drive Conectado'}
                        </p>
                        <p className="text-[11px] text-teal-700 dark:text-cyan-400 truncate font-mono">
                          {googleUser.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors ml-2"
                      title="Cerrar sesión de Google"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Inicia sesión para conceder acceso a tu carpeta personal de Google Drive:
                    </p>
                    {/* Official Sign in with Google button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] transition-all"
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
                      <span>{isProcessing ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dedicated Folder Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Carpeta Dedicada en Google Drive
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
                      placeholder="LogGym"
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
                        Ruta: <strong className="font-mono text-teal-700 dark:text-cyan-400">Google Drive / {folderName}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Dedicada</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Archivo JSON principal: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">LogGym_Entrenamientos.json</code>
                </p>
              </div>

              {/* Read / Write API Operations */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-cyan-950/30 border border-teal-200 dark:border-cyan-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-cyan-300">
                    Operaciones con la API de Drive
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {safeSets.length} series • {safeCardio.length} cardio
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Write JSON to Drive Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleUser) {
                        handleGoogleLogin();
                        return;
                      }
                      setConfirmDialog({
                        isOpen: true,
                        title: '¿Guardar en Google Drive?',
                        description: `Se escribirá el archivo JSON con tus ${safeSets.length} series de fuerza y ${safeCardio.length} entrenamientos de cardio en la carpeta «${folderName}» de tu Google Drive personal.`,
                        actionType: 'write',
                      });
                    }}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Escribir en Drive</span>
                  </button>

                  {/* Read JSON from Drive Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleUser) {
                        handleGoogleLogin();
                        return;
                      }
                      setConfirmDialog({
                        isOpen: true,
                        title: '¿Restaurar desde Google Drive?',
                        description: `Se leerá el archivo JSON desde la carpeta «${folderName}» de tu Google Drive personal para actualizar tus entrenamientos actuales en la app.`,
                        actionType: 'read',
                      });
                    }}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Leer de Drive</span>
                  </button>
                </div>

                {/* Files in folder summary */}
                {driveFiles.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-900/60 space-y-1 text-[11px]">
                    <span className="font-bold text-teal-800 dark:text-cyan-300 block">
                      Archivos detectados en «{folderName}»:
                    </span>
                    {driveFiles.map((f) => (
                      <div key={f.id} className="flex items-center justify-between font-mono text-[10px] text-slate-600 dark:text-slate-400">
                        <span className="truncate flex items-center gap-1">
                          <FileText className="w-3 h-3 text-sky-500" />
                          {f.name}
                        </span>
                        <span>{new Date(f.modifiedTime).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center pt-0.5">
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir Google Drive en tu navegador</span>
                  </a>
                </div>
              </div>

              {/* Status alerts */}
              {syncMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="break-words leading-tight">{syncMessage}</span>
                </div>
              )}

              {syncError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span className="break-words leading-tight">{syncError}</span>
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
                    Tu propia nube personal de Microsoft OneDrive
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Guarda tus entrenamientos en tu cuenta de Microsoft personal con la carpeta «{folderName}» directamente desde tu teléfono.
                  </p>
                </div>
              </div>

              {/* Account Input for OneDrive */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tu cuenta de Microsoft / OneDrive
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
                  <form onSubmit={handleLinkOneDriveAccount} className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Indica tu correo de Microsoft (Outlook, Hotmail o Live):
                    </p>
                    <div className="flex gap-2">
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
                    </div>
                  </form>
                )}
              </div>

              {/* Actions for OneDrive */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                  Guardar en OneDrive
                </span>

                <button
                  type="button"
                  onClick={() => handleSaveToCloudFromPhone('OneDrive')}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Preparando...' : '📲 Guardar en mi OneDrive (desde este celular)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>📥 Restaurar respaldo desde OneDrive</span>
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

        {/* Confirmation Modal for Google Drive Mutating Operations (Skill Requirement) */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{confirmDialog.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDialog.actionType === 'write') {
                      executeWriteToDrive();
                    } else {
                      executeReadFromDrive();
                    }
                  }}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Sticky Footer */}
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
