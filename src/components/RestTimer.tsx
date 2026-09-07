import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, X, Bell, Volume2, VolumeX, Volume1 } from 'lucide-react';
import { formatTimeSeconds } from '../utils/calculations';
import { playRestCompleteSound, playBeep, unlockAudio } from '../utils/audio';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 90,
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (initialSeconds > 0) {
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      setIsCompleted(false);
    }
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playBeep(700, 0.08, 'triangle', 0.25); // warning pip at 3, 2, 1
          }
          if (prev <= 1) {
            setIsActive(false);
            setIsCompleted(true);
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
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, soundEnabled]);

  const toggleTimer = () => {
    unlockAudio();
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    unlockAudio();
    setIsActive(false);
    setIsCompleted(false);
    setSecondsLeft(totalSeconds);
  };

  const addTime = (secs: number) => {
    unlockAudio();
    const next = Math.max(0, secondsLeft + secs);
    setSecondsLeft(next);
    if (next > totalSeconds) setTotalSeconds(next);
  };

  const setPreset = (secs: number) => {
    unlockAudio();
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsActive(true);
    setIsCompleted(false);
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

  if (!isOpen && !isActive && !isCompleted) return null;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div
      id="rest-timer-container"
      className="fixed bottom-16 left-0 right-0 z-30 max-w-lg mx-auto px-4 pb-2 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-xl border p-3.5 backdrop-blur-md transition-colors ${
          isCompleted ? 'border-emerald-500/80 ring-2 ring-emerald-500/30' : 'border-slate-700/60'
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

            <button
              id="close-rest-timer-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title="Cerrar temporizador"
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
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Presets:</span>
          {[45, 60, 90, 120, 180].map((preset) => (
            <button
              key={preset}
              onClick={() => setPreset(preset)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                totalSeconds === preset
                  ? 'bg-[#0e7490] text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset < 60 ? `${preset}s` : `${preset / 60}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
