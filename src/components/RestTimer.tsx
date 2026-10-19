import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, X, Bell, Volume2, VolumeX, Volume1, Smartphone } from 'lucide-react';
import { formatTimeSeconds } from '../utils/calculations';
import { playRestCompleteSound, playBeep, unlockAudio } from '../utils/audio';

const STORAGE_KEY_ACTIVE_TIMER = 'loggym_active_rest_timer_v2';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound?: () => void;
  autoStart?: boolean;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 90,
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  autoStart = false,
}) => {
  // Enforce maximum rest of 3 minutes (180 seconds)
  const clampedInitial = Math.min(180, Math.max(1, initialSeconds));

  const [totalSeconds, setTotalSeconds] = useState(clampedInitial);
  const [secondsLeft, setSecondsLeft] = useState(clampedInitial);
  const [isActive, setIsActive] = useState<boolean>(() => {
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
    return autoStart;
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  const targetEndTimeRef = useRef<number>(Date.now() + clampedInitial * 1000);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  // Request browser notification permission for background alerts
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setHasNotificationPermission(result === 'granted');
        if (result === 'granted') {
          new Notification('LogGym', {
            body: '¡Avisos de descanso en segundo plano activados!',
            icon: '/favicon.png',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const triggerCompletionAlert = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);

    if (soundEnabled) {
      playRestCompleteSound();
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 450]);
      } catch {
        // Ignore
      }
    }

    // Native Notification if user is outside the app or tab
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏱️ ¡Tiempo de descanso completado!', {
          body: 'Listo para tu siguiente serie. ¡A por ella en LogGym!',
          icon: '/favicon.png',
        });
      } catch {
        // ignore
      }
    }
  };

  // When initialSeconds changes (e.g. logging a new set)
  useEffect(() => {
    if (initialSeconds > 0) {
      const clamped = Math.min(180, Math.max(1, initialSeconds));
      setTotalSeconds(clamped);
      setSecondsLeft(clamped);
      setIsCompleted(false);

      if (autoStart) {
        const targetTime = Date.now() + clamped * 1000;
        targetEndTimeRef.current = targetTime;
        setIsActive(true);

        // Persist target end time so it survives page reloads / app closes
        try {
          localStorage.setItem(
            STORAGE_KEY_ACTIVE_TIMER,
            JSON.stringify({
              targetEndTime: targetTime,
              totalSeconds: clamped,
              isActive: true,
            })
          );
        } catch {
          // ignore
        }
      }
    }
  }, [initialSeconds, autoStart]);

  // Sync with real-time target timestamp whenever user returns to the tab or app
  useEffect(() => {
    const handleSyncWithClock = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.isActive && parsed.targetEndTime) {
            const now = Date.now();
            const diffSeconds = Math.ceil((parsed.targetEndTime - now) / 1000);

            if (diffSeconds <= 0) {
              setSecondsLeft(0);
              triggerCompletionAlert();
            } else {
              setSecondsLeft(Math.min(180, diffSeconds));
              setIsActive(true);
              setIsCompleted(false);
              targetEndTimeRef.current = parsed.targetEndTime;
            }
          }
        }
      } catch {
        // ignore
      }
    };

    // Run sync on tab visibility change or window focus
    document.addEventListener('visibilitychange', handleSyncWithClock);
    window.addEventListener('focus', handleSyncWithClock);

    return () => {
      document.removeEventListener('visibilitychange', handleSyncWithClock);
      window.removeEventListener('focus', handleSyncWithClock);
    };
  }, [soundEnabled]);

  // Main countdown interval (checks real elapsed time against targetEndTimeRef)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((targetEndTimeRef.current - now) / 1000);

        if (diff <= 4 && diff > 1 && soundEnabled) {
          playBeep(700, 0.08, 'triangle', 0.25); // warning pip at 3, 2, 1
        }

        if (diff <= 0) {
          setSecondsLeft(0);
          triggerCompletionAlert();
        } else {
          setSecondsLeft(diff);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, soundEnabled]);

  const toggleTimer = () => {
    unlockAudio();
    if (secondsLeft === 0) {
      const targetTime = Date.now() + totalSeconds * 1000;
      targetEndTimeRef.current = targetTime;
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setIsActive(true);
      try {
        localStorage.setItem(
          STORAGE_KEY_ACTIVE_TIMER,
          JSON.stringify({
            targetEndTime: targetTime,
            totalSeconds,
            isActive: true,
          })
        );
      } catch {
        // ignore
      }
    } else if (isActive) {
      // Pause: cancel targetEndTime
      setIsActive(false);
      try {
        localStorage.setItem(
          STORAGE_KEY_ACTIVE_TIMER,
          JSON.stringify({
            targetEndTime: 0,
            totalSeconds,
            secondsLeft,
            isActive: false,
          })
        );
      } catch {
        // ignore
      }
    } else {
      // Resume: create new targetEndTime from remaining seconds
      const targetTime = Date.now() + secondsLeft * 1000;
      targetEndTimeRef.current = targetTime;
      setIsActive(true);
      try {
        localStorage.setItem(
          STORAGE_KEY_ACTIVE_TIMER,
          JSON.stringify({
            targetEndTime: targetTime,
            totalSeconds,
            isActive: true,
          })
        );
      } catch {
        // ignore
      }
    }
  };

  const resetTimer = () => {
    unlockAudio();
    setIsActive(false);
    setIsCompleted(false);
    setSecondsLeft(totalSeconds);
    targetEndTimeRef.current = Date.now() + totalSeconds * 1000;
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);
    } catch {
      // ignore
    }
  };

  const addTime = (secs: number) => {
    unlockAudio();
    const next = Math.min(180, Math.max(0, secondsLeft + secs));
    setSecondsLeft(next);
    setTotalSeconds((prev) => Math.min(180, Math.max(next, prev)));
    const targetTime = Date.now() + next * 1000;
    targetEndTimeRef.current = targetTime;

    if (isActive) {
      try {
        localStorage.setItem(
          STORAGE_KEY_ACTIVE_TIMER,
          JSON.stringify({
            targetEndTime: targetTime,
            totalSeconds: Math.min(180, Math.max(next, totalSeconds)),
            isActive: true,
          })
        );
      } catch {
        // ignore
      }
    }
  };

  const setPreset = (secs: number) => {
    unlockAudio();
    const clamped = Math.min(180, Math.max(5, secs));
    const targetTime = Date.now() + clamped * 1000;
    targetEndTimeRef.current = targetTime;
    setTotalSeconds(clamped);
    setSecondsLeft(clamped);
    setIsActive(true);
    setIsCompleted(false);

    try {
      localStorage.setItem(
        STORAGE_KEY_ACTIVE_TIMER,
        JSON.stringify({
          targetEndTime: targetTime,
          totalSeconds: clamped,
          isActive: true,
        })
      );
    } catch {
      // ignore
    }
  };

  const handleTestSound = () => {
    unlockAudio();
    playRestCompleteSound();
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore
      }
    }
  };

  const handleClose = () => {
    setIsActive(false);
    setIsCompleted(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);
    } catch {
      // ignore
    }
    onClose();
  };

  if (!isOpen) return null;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div
      id="rest-timer-container"
      className="fixed bottom-20 left-0 right-0 z-30 max-w-lg mx-auto px-4 pb-2 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl border p-3.5 backdrop-blur-md transition-colors ${
          isCompleted ? 'border-emerald-500/80 ring-2 ring-emerald-500/30' : 'border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg transition-colors ${
                isCompleted ? 'bg-emerald-600 animate-pulse text-white' : 'bg-[#0e7490] text-white'
              }`}
            >
              <Timer className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isCompleted ? '¡Descanso finalizado!' : isActive ? 'Descansando...' : 'Temporizador de Descanso'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isCompleted ? 'Listo para la siguiente serie' : `Objetivo: ${formatTimeSeconds(totalSeconds)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 animate-bounce">
                <Bell className="w-3 h-3" /> ¡A entrenar!
              </span>
            )}

            {/* Background notification button if supported and not granted */}
            {!hasNotificationPermission && typeof window !== 'undefined' && 'Notification' in window && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="text-[10px] bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 px-2 py-1 rounded-md flex items-center gap-1 border border-cyan-800/60 transition-colors"
                title="Activar avisos en segundo plano"
              >
                <Bell className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">2º Plano</span>
              </button>
            )}

            {/* Test sound button */}
            <button
              type="button"
              onClick={handleTestSound}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md flex items-center gap-1 transition-colors border border-slate-700/50"
              title="Probar sonido y vibración"
            >
              <Volume1 className="w-3 h-3 text-cyan-400" />
              <span>Probar</span>
            </button>

            {/* Sound toggle button */}
            {onToggleSound && (
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  onToggleSound();
                }}
                className={`p-1 rounded-md transition-colors ${
                  soundEnabled
                    ? 'text-cyan-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={soundEnabled ? 'Sonido activado (toca para silenciar)' : 'Sonido silenciado (toca para activar)'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}

            {/* Close button */}
            <button
              id="close-rest-timer-btn"
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title="Cerrar temporizador / cronómetro"
              aria-label="Cerrar recuadro del cronómetro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCompleted ? 'bg-emerald-500' : 'bg-[#0e7490]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Main display & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-mono font-bold tracking-tight transition-colors ${
                isCompleted ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {formatTimeSeconds(secondsLeft)}
            </span>
            <span className="text-xs text-slate-400 font-mono">min:seg</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="timer-minus-15"
              onClick={() => addTime(-15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center font-medium transition-colors"
              title="Restar 15s"
            >
              <Minus className="w-3.5 h-3.5" />
              <span className="text-[10px]">15s</span>
            </button>

            <button
              id="timer-plus-30"
              onClick={() => addTime(30)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center font-medium transition-colors"
              title="Sumar 30s"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[10px]">30s</span>
            </button>

            <button
              id="timer-toggle-play"
              onClick={toggleTimer}
              className={`p-2 rounded-xl font-medium text-white flex items-center justify-center transition-transform active:scale-95 ${
                isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0e7490] hover:bg-[#0c627a]'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              id="timer-reset"
              onClick={resetTimer}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Presets:</span>
            {[45, 60, 90, 120, 180].map((preset) => (
              <button
                key={preset}
                onClick={() => setPreset(preset)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  totalSeconds === preset
                    ? 'bg-[#0e7490] text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset < 60 ? `${preset}s` : preset === 180 ? '3m (máx)' : `${preset / 60}m`}
              </button>
            ))}
          </div>

          <div className="text-[9px] text-slate-500 flex items-center gap-1 ml-auto">
            <span>Sigue activo en 2º plano</span>
          </div>
        </div>
      </div>
    </div>
  );
};
