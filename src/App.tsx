import { useState, useEffect } from 'react';
import { TabType, WorkoutSet, Exercise } from './types';
import { INITIAL_EXERCISES } from './data/initialExercises';
import { generateSampleSets, sortSetsChronological, getTodayDateString } from './utils/calculations';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { ProgressTab } from './components/ProgressTab';
import { ExercisesTab } from './components/ExercisesTab';
import { RestTimer } from './components/RestTimer';
import { NewExerciseModal } from './components/NewExerciseModal';
import { ExcelModal } from './components/ExcelModal';
import { InstallAppModal } from './components/InstallAppModal';
import { Volume2, VolumeX, Timer, RotateCcw, Sparkles, FileSpreadsheet, Smartphone, Moon, Sun } from 'lucide-react';

const STORAGE_KEY_SETS = 'fuerzalog_sets_v1';
const STORAGE_KEY_EXERCISES = 'fuerzalog_exercises_v1';
const STORAGE_KEY_SOUND = 'fuerzalog_sound_v1';
const STORAGE_KEY_THEME = 'fuerzalog_theme_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? saved === 'true' : true;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_EXERCISES;
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

  // Rest Timer State
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);

  // New Exercise Modal
  const [isNewExerciseModalOpen, setIsNewExerciseModalOpen] = useState(false);

  // Excel & App Install Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);

  // Preselected exercise when navigating from Exercises tab
  const [selectedExerciseForLog, setSelectedExerciseForLog] = useState('');

  // Persist sets
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
  }, [sets]);

  // Persist exercises
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(exercises));
  }, [exercises]);

  // Persist sound setting
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
  }, [soundEnabled]);

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
      setRestTimerSeconds(newSetData.restSeconds);
      setIsRestTimerOpen(true);
    }
  };

  const handleDeleteSet = (id: string) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
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
    setExercises((prev) => [newEx, ...prev]);
  };

  const handleDeleteCustomExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSelectExerciseForLog = (exerciseId: string) => {
    setSelectedExerciseForLog(exerciseId);
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
              onClick={() => setIsRestTimerOpen((prev) => !prev)}
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

        {/* Content Tabs */}
        <div className="flex-1 px-4 pt-3">
          {activeTab === 'home' && (
            <HomeTab
              sets={sets}
              exercises={exercises}
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
              onLoadSampleData={handleLoadSampleData}
              onOpenExcelModal={() => setIsExcelModalOpen(true)}
              onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
              onSelectExerciseForLog={handleSelectExerciseForLog}
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
          initialSeconds={restTimerSeconds}
          isOpen={isRestTimerOpen}
          onClose={() => setIsRestTimerOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
      </main>
    </div>
  );
}
