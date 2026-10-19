import { useState, useEffect } from 'react';
import { TabType, WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from './types';
import { INITIAL_EXERCISES } from './data/initialExercises';
import {
  generateSampleSets,
  sortSetsChronological,
  getTodayDateString,
  sortExercisesAlphabetically,
} from './utils/calculations';
import { INITIAL_WEEKLY_SCHEDULE, getTodayDayOfWeek } from './utils/schedule';
import { getSampleCardioWorkouts } from './utils/cardioCalculations';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { PlannerTab } from './components/PlannerTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { CardioTab } from './components/CardioTab';
import { ProgressTab } from './components/ProgressTab';
import { ExercisesTab } from './components/ExercisesTab';
import { RestTimer } from './components/RestTimer';
import { NewExerciseModal } from './components/NewExerciseModal';
import { ExcelModal } from './components/ExcelModal';
import { InstallAppModal } from './components/InstallAppModal';
import { StoragePreferenceModal } from './components/StoragePreferenceModal';
import { WhatsNewModal } from './components/WhatsNewModal';
import {
  getStoragePreference,
  shouldShowChangelog,
  StorageMode,
  CloudProvider,
  AppDataSnapshot,
} from './utils/storageManager';
import { Volume2, VolumeX, Timer, RotateCcw, Sparkles, FileSpreadsheet, Smartphone, Moon, Sun, Activity, Cloud, HardDrive } from 'lucide-react';

const STORAGE_KEY_SETS = 'fuerzalog_sets_v1';
const STORAGE_KEY_EXERCISES = 'fuerzalog_exercises_v1';
const STORAGE_KEY_SOUND = 'fuerzalog_sound_v1';
const STORAGE_KEY_THEME = 'fuerzalog_theme_v1';
const STORAGE_KEY_SCHEDULE = 'fuerzalog_schedule_v1';
const STORAGE_KEY_TODAY_EXERCISES_PREFIX = 'fuerzalog_today_ex_';
const STORAGE_KEY_CARDIO = 'loggym_cardio_workouts_v1';
const STORAGE_KEY_ACTIVE_TIMER = 'loggym_active_rest_timer_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const todayDate = getTodayDateString();
  const currentDayOfWeek = getTodayDayOfWeek(todayDate);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEY_THEME, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEY_THEME, 'light');
      }
    } catch {
      // ignore
    }
  }, [isDark]);

  // Exercises
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXERCISES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortExercisesAlphabetically(parsed);
        }
      }
    } catch {
      // fallback
    }
    return sortExercisesAlphabetically(INITIAL_EXERCISES);
  });

  // Weekly Schedule
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.monday) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_WEEKLY_SCHEDULE;
  });

  // Today's active session exercises (defaults to today's schedule unless customized)
  const [todayExerciseIds, setTodayExerciseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TODAY_EXERCISES_PREFIX + todayDate);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    const dayPlan = INITIAL_WEEKLY_SCHEDULE[currentDayOfWeek];
    return dayPlan && Array.isArray(dayPlan.exercises) ? dayPlan.exercises.map((e) => e.exerciseId) : [];
  });

  // Preselected exercise and routine when navigating
  const [selectedExerciseForLog, setSelectedExerciseForLog] = useState('');
  const [selectedRoutineForLog, setSelectedRoutineForLog] = useState(() => {
    const dayPlan = INITIAL_WEEKLY_SCHEDULE[currentDayOfWeek];
    return dayPlan?.name || 'General';
  });

  // Workout Sets
  const [sets, setSets] = useState<WorkoutSet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return sortSetsChronological(parsed, 'desc');
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Rest Timer State (check if there was a running timer in background)
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.isActive && parsed?.targetEndTime && parsed.targetEndTime > Date.now()) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [restTimerKey, setRestTimerKey] = useState(0);
  const [restTimerAutoStart, setRestTimerAutoStart] = useState(false);

  // Cardio Workouts (Stored safely in LocalStorage)
  const [cardioWorkouts, setCardioWorkouts] = useState<CardioWorkout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARDIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return getSampleCardioWorkouts();
  });

  // Persist cardio workouts independently so strength logs are never touched or lost
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CARDIO, JSON.stringify(cardioWorkouts));
    } catch {
      // ignore
    }
  }, [cardioWorkouts]);

  // New Exercise Modal
  const [isNewExerciseModalOpen, setIsNewExerciseModalOpen] = useState(false);

  // Excel & App Install Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);

  // Storage Preference State (Local vs Personal Cloud)
  const [storagePref, setStoragePref] = useState(() => getStoragePreference());
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isStorageInitialPrompt, setIsStorageInitialPrompt] = useState(false);
  const [storageConfirmBannerDismissed, setStorageConfirmBannerDismissed] = useState(false);

  // Changelog / What's New Modal State
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasNewChangelog, setHasNewChangelog] = useState(() => shouldShowChangelog());

  // Startup verification: check if storage was already asked, and if new app changes exist
  useEffect(() => {
    try {
      const pref = getStoragePreference();
      if (!pref.hasBeenPrompted || pref.mode === null) {
        // First time opening: directly prompt the user to choose their preferred storage
        setIsStorageInitialPrompt(true);
        setIsStorageModalOpen(true);
      } else if (shouldShowChangelog()) {
        // Only show changelog if storage modal is not prompting, preventing dual modals
        setIsWhatsNewOpen(true);
      }
    } catch (e) {
      console.warn('Startup verification error:', e);
    }
  }, []);

  // Persist sets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
    } catch {
      // ignore
    }
  }, [sets]);

  // Persist exercises
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(exercises));
    } catch {
      // ignore
    }
  }, [exercises]);

  // Persist sound setting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Persist weekly schedule
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
    } catch {
      // ignore
    }
  }, [schedule]);

  // Persist today's session exercises
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TODAY_EXERCISES_PREFIX + todayDate, JSON.stringify(todayExerciseIds));
    } catch {
      // ignore
    }
  }, [todayExerciseIds, todayDate]);

  const handleUpdateSchedule = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    const dayPlan = newSchedule[currentDayOfWeek];
    if (dayPlan) {
      setTodayExerciseIds(dayPlan.exercises.map((e) => e.exerciseId));
      setSelectedRoutineForLog(dayPlan.name);
    }
  };

  const handleUpdateTodayExerciseIds = (newIds: string[]) => {
    setTodayExerciseIds(newIds);
  };

  const handleSaveSet = (
    newSetData: Omit<WorkoutSet, 'id' | 'timestamp'>,
    autoStartRest = true
  ) => {
    // Check if the set is logged for today
    const todayStr = getTodayDateString();
    let calculatedTimestamp: number;

    if (newSetData.date === todayStr) {
      // Use current real time to record exact chronological sequence
      calculatedTimestamp = Date.now();
    } else {
      // Past or custom date: anchor to that day and find highest timestamp for that date
      const [y, m, d] = newSetData.date.split('-').map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
      const baseTime = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();
      const sameDateSets = sets.filter((s) => s.date === newSetData.date);
      const maxExisting = sameDateSets.length > 0
        ? Math.max(...sameDateSets.map((s) => s.timestamp || 0))
        : baseTime;
      calculatedTimestamp = Math.max(maxExisting + 60000, baseTime + (newSetData.setNumber || 1) * 60000);
    }

    const newSet: WorkoutSet = {
      ...newSetData,
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: calculatedTimestamp,
    };

    setSets((prev) => sortSetsChronological([newSet, ...prev], 'desc'));

    if (autoStartRest && newSetData.restSeconds > 0) {
      const safeRest = Math.min(180, Math.max(1, newSetData.restSeconds));
      setRestTimerSeconds(safeRest);
      setRestTimerAutoStart(true);
      setIsRestTimerOpen(true);
      setRestTimerKey((prev) => prev + 1);
    }
  };

  const handleDeleteSet = (id: string) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSet = (updatedSet: WorkoutSet) => {
    setSets((prev) =>
      sortSetsChronological(
        prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)),
        'desc'
      )
    );
  };

  const handleDuplicateSet = (original: WorkoutSet) => {
    const sameSessionSets = sets.filter(
      (s) => s.exerciseId === original.exerciseId && s.date === original.date
    );
    const nextSetNumber =
      sameSessionSets.length > 0
        ? Math.max(...sameSessionSets.map((s) => s.setNumber)) + 1
        : original.setNumber + 1;

    const duplicated: WorkoutSet = {
      ...original,
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      setNumber: nextSetNumber,
      timestamp: Date.now() > (original.timestamp || 0) ? Date.now() : (original.timestamp || 0) + 60000,
    };

    setSets((prev) => sortSetsChronological([duplicated, ...prev], 'desc'));
  };

  const handleAddCustomExercise = (newEx: Exercise) => {
    setExercises((prev) => sortExercisesAlphabetically([newEx, ...prev]));
  };

  const handleDeleteCustomExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSelectExerciseForLog = (exerciseId: string, routineName?: string) => {
    setSelectedExerciseForLog(exerciseId);
    if (routineName) {
      setSelectedRoutineForLog(routineName);
    }
    setActiveTab('home');
    setTimeout(() => {
      const el = document.getElementById('quick-log-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLoadSampleData = () => {
    const samples = generateSampleSets();
    setSets(sortSetsChronological(samples, 'desc'));
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Seguro que deseas vaciar el historial de series para empezar desde cero?')) {
      setSets([]);
    }
  };

  const handleImportSets = (newSets: WorkoutSet[], replace: boolean) => {
    if (replace) {
      setSets(sortSetsChronological(newSets, 'desc'));
    } else {
      setSets((prev) => sortSetsChronological([...newSets, ...prev], 'desc'));
    }
  };

  // Cardio Handlers
  const handleSaveCardio = (newCardio: Omit<CardioWorkout, 'id' | 'timestamp'>) => {
    const workout: CardioWorkout = {
      ...newCardio,
      id: `cardio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setCardioWorkouts((prev) => [workout, ...prev]);
  };

  const handleDeleteCardio = (id: string) => {
    setCardioWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const handleLoadSampleCardio = () => {
    setCardioWorkouts(getSampleCardioWorkouts());
  };

  const handleStorageModeChanged = (newMode: StorageMode, provider: CloudProvider) => {
    const updated = getStoragePreference();
    setStoragePref({
      ...updated,
      mode: newMode,
      provider,
      hasBeenPrompted: true,
    });
    setStorageConfirmBannerDismissed(true);
    if (shouldShowChangelog()) {
      setIsWhatsNewOpen(true);
    }
  };

  const handleImportFullBackup = (snapshot: AppDataSnapshot) => {
    if (snapshot.sets && snapshot.sets.length > 0) {
      setSets(sortSetsChronological(snapshot.sets, 'desc'));
    }
    if (snapshot.exercises && snapshot.exercises.length > 0) {
      setExercises(sortExercisesAlphabetically(snapshot.exercises));
    }
    if (snapshot.schedule) {
      setSchedule(snapshot.schedule);
    }
    if (snapshot.cardioWorkouts && snapshot.cardioWorkouts.length > 0) {
      setCardioWorkouts(snapshot.cardioWorkouts);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start text-slate-900 dark:text-slate-100 selection:bg-teal-100 dark:selection:bg-teal-900 selection:text-teal-900 dark:selection:text-teal-100 transition-colors duration-200">
      {/* Mobile container centered on desktop */}
      <main className="w-full max-w-lg min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col shadow-xl relative border-x border-slate-200/60 dark:border-slate-800/80 pb-8 transition-colors duration-200">
        {/* Top utility bar */}
        <header
          id="top-utility-bar"
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200"
        >
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white tracking-tight">
            <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-cyan-400 animate-pulse"></span>
            <span>Log de Fuerza</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              id="btn-dark-mode-toggle"
              onClick={() => setIsDark((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Storage Preference Button (Local vs Personal Cloud) */}
            <button
              type="button"
              onClick={() => {
                setIsStorageInitialPrompt(false);
                setIsStorageModalOpen(true);
              }}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors border ${
                storagePref?.mode === 'cloud'
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/40'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-cyan-300 border-teal-200/80 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/40'
              }`}
              title={`Almacenamiento: ${storagePref?.mode === 'cloud' ? 'Mi Nube Personal' : 'Memoria del Teléfono'}. Toca para cambiar.`}
            >
              {storagePref?.mode === 'cloud' ? (
                <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
              )}
              <span className="text-[10px] font-bold hidden sm:inline">
                {storagePref?.mode === 'cloud' ? 'Nube' : 'Local'}
              </span>
            </button>

            {/* Excel Manager */}
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center gap-1 font-semibold transition-colors border border-emerald-200/60 dark:border-emerald-800/50"
              title="Exportar o importar datos con Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="text-[10px] font-bold">Excel</span>
            </button>

            {/* App / APK Install */}
            <button
              type="button"
              onClick={() => setIsInstallAppModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 font-medium transition-colors"
              title="Instalar en teléfono o descargar APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
              <span className="text-[10px] hidden sm:inline">APK / App</span>
            </button>

            {/* Rest Timer Button */}
            <button
              type="button"
              onClick={() => {
                setRestTimerAutoStart(false);
                setIsRestTimerOpen((prev) => !prev);
              }}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                isRestTimerOpen
                  ? 'bg-[#0e7490] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Temporizador de descanso"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Descanso</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
            </button>

            {/* Reset / Sample Data Quick Actions */}
            {sets.length === 0 ? (
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="p-1.5 rounded-lg bg-teal-50 dark:bg-cyan-950/60 text-[#0e7490] dark:text-cyan-300 hover:bg-teal-100 dark:hover:bg-cyan-900/50 flex items-center gap-1 font-medium transition-colors"
                title="Cargar historial de prueba"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-[10px]">Ejemplo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearAllData}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Reiniciar a 0 series"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Storage Preference Verification & Choice Banner */}
        {!storageConfirmBannerDismissed && storagePref?.mode && (
          <div className="mx-3.5 mt-2.5 p-3 bg-gradient-to-r from-teal-50 via-teal-50/70 to-cyan-50 dark:from-slate-900 dark:via-teal-950/40 dark:to-slate-900 border border-teal-200/90 dark:border-teal-800/70 rounded-2xl shadow-sm text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="p-2 rounded-xl bg-teal-600 dark:bg-cyan-500 text-white shadow-sm shrink-0">
                {storagePref.mode === 'cloud' ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
              </span>
              <div className="truncate">
                <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {storagePref.mode === 'cloud' ? (
                    storagePref.accountEmail ? (
                      <span>
                        ☁️ Google Drive:{' '}
                        <span className="text-teal-700 dark:text-cyan-400 font-normal">
                          {storagePref.accountEmail}
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        ☁️ Nube elegida: ¡Vincula tu cuenta!
                      </span>
                    )
                  ) : (
                    <span>
                      Guardando en:{' '}
                      <span className="text-teal-700 dark:text-cyan-400">📱 Este Teléfono (Local)</span>
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {storagePref.mode === 'cloud'
                    ? storagePref.accountEmail
                      ? 'Carpeta «LogGym» sincronizada en tu nube personal'
                      : 'Toca en "Vincular" para conectar tu Google Drive y crear tu carpeta LogGym'
                    : '¿Prefieres seguir guardándolos aquí o subir a tu nube?'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
              {storagePref.mode === 'cloud' && !storagePref.accountEmail ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsStorageInitialPrompt(false);
                    setIsStorageModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 dark:bg-cyan-500 text-white text-[11px] font-bold hover:bg-teal-700 dark:hover:bg-cyan-400 transition-colors shadow-sm"
                >
                  Vincular Google Drive
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStorageConfirmBannerDismissed(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 dark:bg-cyan-500 text-white text-[11px] font-bold hover:bg-teal-700 dark:hover:bg-cyan-400 transition-colors shadow-sm shrink-0"
                >
                  Seguir en {storagePref.mode === 'cloud' ? 'Nube' : 'Local'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsStorageInitialPrompt(false);
                  setIsStorageModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Ajustes
              </button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="flex-1 px-4 pt-3">
          {activeTab === 'home' && (
            <HomeTab
              sets={sets}
              exercises={exercises}
              schedule={schedule}
              todayDate={todayDate}
              todayExerciseIds={todayExerciseIds}
              onUpdateTodayExerciseIds={handleUpdateTodayExerciseIds}
              selectedExerciseForLog={selectedExerciseForLog}
              selectedRoutineForLog={selectedRoutineForLog}
              onSelectExerciseForLog={handleSelectExerciseForLog}
              onOpenPlanner={() => setActiveTab('planner')}
              onSaveSet={handleSaveSet}
              onDeleteSet={handleDeleteSet}
              onViewHistory={() => setActiveTab('workouts')}
              onOpenQuickLogModal={() => {
                const el = document.getElementById('quick-log-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenNewExerciseModal={() => setIsNewExerciseModalOpen(true)}
              onLoadSampleData={handleLoadSampleData}
              onOpenExcelModal={() => setIsExcelModalOpen(true)}
              onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
              onOpenCardio={() => setActiveTab('cardio')}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerTab
              schedule={schedule}
              exercises={exercises}
              onUpdateSchedule={handleUpdateSchedule}
              onGoToTodayWorkout={() => setActiveTab('home')}
              onOpenNewExerciseModal={() => setIsNewExerciseModalOpen(true)}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutsTab
              sets={sets}
              exercises={exercises}
              onOpenQuickLog={() => {
                setActiveTab('home');
                setTimeout(() => {
                  const el = document.getElementById('quick-log-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onDeleteSet={handleDeleteSet}
              onDuplicateSet={handleDuplicateSet}
              onUpdateSet={handleUpdateSet}
              onLoadSampleData={handleLoadSampleData}
              onOpenExcelModal={() => setIsExcelModalOpen(true)}
              onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
              onSelectExerciseForLog={handleSelectExerciseForLog}
            />
          )}

          {activeTab === 'cardio' && (
            <CardioTab
              cardioWorkouts={cardioWorkouts}
              onSaveCardio={handleSaveCardio}
              onDeleteCardio={handleDeleteCardio}
              onLoadSampleCardio={handleLoadSampleCardio}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab
              sets={sets}
              exercises={exercises}
              onLoadSampleData={handleLoadSampleData}
            />
          )}

          {activeTab === 'exercises' && (
            <ExercisesTab
              exercises={exercises}
              sets={sets}
              onOpenNewExerciseModal={() => setIsNewExerciseModalOpen(true)}
              onSelectForLog={handleSelectExerciseForLog}
              onDeleteCustomExercise={handleDeleteCustomExercise}
              onDuplicateSet={handleDuplicateSet}
              onDeleteSet={handleDeleteSet}
            />
          )}
        </div>

        {/* Floating Rest Timer */}
        <RestTimer
          key={restTimerKey}
          initialSeconds={restTimerSeconds}
          isOpen={isRestTimerOpen}
          onClose={() => {
            setIsRestTimerOpen(false);
            setRestTimerAutoStart(false);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          autoStart={restTimerAutoStart}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWhatsNew={() => {
            setHasNewChangelog(false);
            setIsWhatsNewOpen(true);
          }}
          hasNewChangelog={hasNewChangelog}
        />

        {/* Modal for adding custom exercise */}
        <NewExerciseModal
          isOpen={isNewExerciseModalOpen}
          onClose={() => setIsNewExerciseModalOpen(false)}
          onAddExercise={handleAddCustomExercise}
        />

        {/* Excel Export & Import Modal */}
        <ExcelModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          sets={sets}
          exercises={exercises}
          onImportSets={handleImportSets}
        />

        {/* PWA & APK Installation Guide Modal */}
        <InstallAppModal
          isOpen={isInstallAppModalOpen}
          onClose={() => setIsInstallAppModalOpen(false)}
        />

        {/* Storage Preference Modal (Local vs Personal Cloud) */}
        <StoragePreferenceModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          currentMode={storagePref?.mode ?? null}
          onModeChanged={handleStorageModeChanged}
          sets={sets}
          exercises={exercises}
          schedule={schedule}
          cardioWorkouts={cardioWorkouts}
          onImportFullBackup={handleImportFullBackup}
          isInitialPrompt={isStorageInitialPrompt}
        />

        {/* Whats New / Recent Changes Popup */}
        <WhatsNewModal
          isOpen={isWhatsNewOpen}
          onClose={() => setIsWhatsNewOpen(false)}
          onOpenStorageSettings={() => {
            setIsStorageInitialPrompt(false);
            setIsStorageModalOpen(true);
          }}
          onOpenCardio={() => setActiveTab('cardio')}
        />
      </main>
    </div>
  );
}
