import React, { useState, useId } from 'react';
import {
  CardioWorkout,
  CardioLocation,
  CardioType,
} from '../types';
import {
  CARDIO_LOCATIONS,
  CARDIO_TYPES,
  calculatePaceSeconds,
  formatPace,
  calculateSpeedKmh,
  calculateDistanceFromSpeed,
  formatCardioDuration,
  getRpeDescription,
} from '../utils/cardioCalculations';
import {
  Activity,
  Flame,
  CheckCircle2,
  Trash2,
  TrendingUp,
  Gauge,
  Timer,
  Footprints,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Compass,
  Zap,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface CardioTabProps {
  cardioWorkouts: CardioWorkout[];
  onSaveCardio: (workout: Omit<CardioWorkout, 'id' | 'timestamp'>) => void;
  onDeleteCardio: (id: string) => void;
  onLoadSampleCardio: () => void;
}

export const CardioTab: React.FC<CardioTabProps> = ({
  cardioWorkouts,
  onSaveCardio,
  onDeleteCardio,
  onLoadSampleCardio,
}) => {
  const formId = useId();

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<CardioLocation>('street');
  const [selectedType, setSelectedType] = useState<CardioType>('steady_easy_jog');
  
  // Treadmill Input Mode: 'distance_time' or 'speed_time'
  const [treadmillMode, setTreadmillMode] = useState<'distance_time' | 'speed_time'>('distance_time');

  // Metrics
  const [distanceKm, setDistanceKm] = useState<number | ''>(5.0);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(28);
  const [durationSeconds, setDurationSeconds] = useState<number | ''>(30);
  const [speedKmh, setSpeedKmh] = useState<number | ''>(10.5);

  // RPE & Notes
  const [rpe, setRpe] = useState<number>(6);
  const [notes, setNotes] = useState('');

  // UI States
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [chartMetric, setChartMetric] = useState<'distance' | 'pace' | 'duration'>('distance');

  // Convert inputs to numbers
  const numMin = typeof durationMinutes === 'number' ? durationMinutes : 0;
  const numSec = typeof durationSeconds === 'number' ? durationSeconds : 0;
  const totalSeconds = numMin * 60 + numSec;

  // Real-time calculation of Distance / Speed / Pace
  let effectiveDistanceKm = typeof distanceKm === 'number' ? distanceKm : 0;
  let effectiveSpeedKmh = 0;
  let effectivePaceSeconds = 0;

  if (selectedLocation === 'treadmill' && treadmillMode === 'speed_time') {
    const numSpeed = typeof speedKmh === 'number' ? speedKmh : 0;
    effectiveSpeedKmh = numSpeed;
    if (numSpeed > 0 && totalSeconds > 0) {
      effectiveDistanceKm = calculateDistanceFromSpeed(numSpeed, totalSeconds);
      effectivePaceSeconds = (3600 / numSpeed);
    }
  } else {
    effectiveDistanceKm = typeof distanceKm === 'number' ? distanceKm : 0;
    if (effectiveDistanceKm > 0 && totalSeconds > 0) {
      effectiveSpeedKmh = calculateSpeedKmh(effectiveDistanceKm, totalSeconds);
      effectivePaceSeconds = calculatePaceSeconds(effectiveDistanceKm, totalSeconds);
    }
  }

  const livePaceDisplay = formatPace(effectivePaceSeconds);

  // Handle Location Change
  const handleLocationChange = (loc: CardioLocation) => {
    setSelectedLocation(loc);
    if (loc !== 'treadmill') {
      setTreadmillMode('distance_time');
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (effectiveDistanceKm <= 0 && effectiveSpeedKmh <= 0) {
      alert('Por favor indica una distancia o velocidad válida');
      return;
    }
    if (totalSeconds <= 0) {
      alert('Por favor indica un tiempo de entrenamiento válido (minutos o segundos)');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    onSaveCardio({
      date: todayStr,
      location: selectedLocation,
      cardioType: selectedType,
      distanceKm: effectiveDistanceKm,
      durationMinutes: numMin,
      durationSeconds: numSec,
      totalDurationSeconds: totalSeconds,
      paceMinPerKm: livePaceDisplay,
      paceSecondsPerKm: effectivePaceSeconds,
      speedKmh: effectiveSpeedKmh,
      rpe,
      notes: notes.trim() || undefined,
      inputMode: selectedLocation === 'treadmill' ? treadmillMode : undefined,
    });

    // Animate Success Feedback
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);

    // Reset Form Fields for next workout
    setDistanceKm('');
    setDurationMinutes('');
    setDurationSeconds('');
    setSpeedKmh('');
    setNotes('');
    setRpe(6);
  };

  // Aggregated Stats
  const totalKmRun = cardioWorkouts.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const totalSessions = cardioWorkouts.length;
  const totalSecondsRun = cardioWorkouts.reduce((acc, w) => acc + (w.totalDurationSeconds || 0), 0);

  // Sort chronological for charts (oldest to newest)
  const chartData = [...cardioWorkouts]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((w) => {
      const dateParts = w.date.split('-');
      const shortDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : w.date;
      return {
        date: shortDate,
        fullDate: w.date,
        distance: Number(w.distanceKm.toFixed(2)),
        durationMin: Number((w.totalDurationSeconds / 60).toFixed(1)),
        paceNumeric: Number((w.paceSecondsPerKm / 60).toFixed(2)),
        paceFormatted: w.paceMinPerKm,
        speedKmh: w.speedKmh,
        location: w.location === 'treadmill' ? 'Cinta' : w.location === 'street' ? 'Calle' : 'Pista',
      };
    });

  // Recent 3 workouts (newest first)
  const recentWorkouts = [...cardioWorkouts]
    .sort((a, b) => b.timestamp - a.timestamp);
  const displayWorkouts = showFullHistory ? recentWorkouts : recentWorkouts.slice(0, 3);

  const rpeInfo = getRpeDescription(rpe);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div
          id="cardio-success-toast"
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-300 border border-emerald-400/40"
        >
          <div className="p-2 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm">
            <CheckCircle2 className="w-6 h-6 text-white animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">¡Entrenamiento de Cardio Guardado!</p>
            <p className="text-xs text-emerald-100">
              Registrado con éxito en LogGym. ¡Excelente esfuerzo!
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/30 rounded-3xl p-5 border border-emerald-500/20 dark:border-emerald-500/30 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 mb-2 border border-emerald-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>LogGym Cardio & Running</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Registro Rápido de Cardio
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
              Diseñado para guardar tu sesión con un solo dedo al terminar en el gym o la calle.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-500/20">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Distancia</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalKmRun.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">km</span>
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Sesiones</p>
            <p className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
              {totalSessions}
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Tiempo Total</p>
            <p className="text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 mt-1 truncate">
              {formatCardioDuration(totalSecondsRun)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Registration Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6"
      >
        {/* Step 1: Location */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>1. ¿Dónde entrenaste?</span>
            </label>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {CARDIO_LOCATIONS.find((l) => l.id === selectedLocation)?.name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {CARDIO_LOCATIONS.map((loc) => {
              const isSelected = selectedLocation === loc.id;
              return (
                <button
                  type="button"
                  key={loc.id}
                  id={`cardio-loc-${loc.id}`}
                  onClick={() => handleLocationChange(loc.id)}
                  className={`py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-center font-bold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-2xl">{loc.emoji}</span>
                  <span className="text-xs font-extrabold">{loc.name}</span>
                </button>
              );
            })}
          </div>

          {/* Special Toggle for Treadmill */}
          {selectedLocation === 'treadmill' && (
            <div className="mt-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20 flex items-center justify-between animate-in fade-in duration-200">
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Modo de entrada en Cinta:
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {treadmillMode === 'speed_time'
                    ? 'Escribes velocidad (km/h) y la app calcula la distancia'
                    : 'Escribes distancia y tiempo clásico'}
                </p>
              </div>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-emerald-500/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setTreadmillMode('distance_time')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    treadmillMode === 'distance_time'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Distancia
                </button>
                <button
                  type="button"
                  onClick={() => setTreadmillMode('speed_time')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    treadmillMode === 'speed_time'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Velocidad
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Cardio Type with Speech Test */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-emerald-500" />
              <span>2. ¿Qué tipo de cardio hiciste?</span>
            </label>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Prueba del habla 🗣️
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
            Elige la intensidad según cómo pudiste hablar durante el entrenamiento:
          </p>

          <div className="space-y-2">
            {CARDIO_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  id={`cardio-type-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.99] flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 dark:ring-emerald-500/40'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{type.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {type.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type.badgeColor}`}>
                        {type.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                      "{type.speechTest}"
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Training Metrics & Realtime Pace Calculation */}
        <div>
          <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2.5">
            <Timer className="w-4 h-4 text-emerald-500" />
            <span>3. Datos del entrenamiento</span>
          </label>

          {/* Metric Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Distance Input or Speed Input */}
            {selectedLocation === 'treadmill' && treadmillMode === 'speed_time' ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>Velocidad de Cinta (km/h)</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {effectiveDistanceKm > 0 ? `${effectiveDistanceKm} km calculados` : ''}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeedKmh((prev) => Math.max(1, Number(((typeof prev === 'number' ? prev : 8) - 0.5).toFixed(1))))}
                    className="w-10 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg text-slate-700 dark:text-slate-200 active:bg-slate-100 flex items-center justify-center shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="30"
                    value={speedKmh}
                    onChange={(e) => setSpeedKmh(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="10.0"
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSpeedKmh((prev) => Number(((typeof prev === 'number' ? prev : 8) + 0.5).toFixed(1)))}
                    className="w-10 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg text-slate-700 dark:text-slate-200 active:bg-slate-100 flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                </div>
                {/* Quick Speed Presets */}
                <div className="flex gap-1.5 mt-2 justify-center">
                  {[8.0, 9.5, 10.5, 12.0, 14.0].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSpeedKmh(s)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        speedKmh === s
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {s} k/h
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>Distancia (km)</span>
                  <span className="text-[11px] text-slate-500 font-medium">Ej: 5.0 km</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDistanceKm((prev) => Math.max(0.1, Number(((typeof prev === 'number' ? prev : 3) - 0.5).toFixed(2))))}
                    className="w-10 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg text-slate-700 dark:text-slate-200 active:bg-slate-100 flex items-center justify-center shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="100"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="5.0"
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDistanceKm((prev) => Number(((typeof prev === 'number' ? prev : 3) + 0.5).toFixed(2)))}
                    className="w-10 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg text-slate-700 dark:text-slate-200 active:bg-slate-100 flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                </div>
                {/* Quick Presets for Distance */}
                <div className="flex gap-1.5 mt-2 justify-center">
                  {[2.0, 3.0, 5.0, 8.0, 10.0].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDistanceKm(d)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        distanceKm === d
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {d} km
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Input (Minutes & Seconds) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                <span>Tiempo Total</span>
                <span className="text-[11px] text-slate-500 font-medium">Minutos y Segundos</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Min"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-center text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute right-2 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                      min
                    </span>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Seg"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-center text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute right-2 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                      seg
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Time Presets */}
              <div className="flex gap-1.5 mt-2 justify-center">
                {[15, 20, 30, 45, 60].map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      setDurationMinutes(m);
                      setDurationSeconds(0);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      durationMinutes === m && durationSeconds === 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Computed Pace Highlight Card */}
          <div className="mt-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Ritmo Medio (Pace)
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                  {effectivePaceSeconds > 0 ? livePaceDisplay : '--:-- min/km'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Velocidad Media
              </p>
              <p className="text-base sm:text-lg font-bold text-white">
                {effectiveSpeedKmh > 0 ? `${effectiveSpeedKmh} km/h` : '-- km/h'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Perceived Exertion (RPE 1-10) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>4. Esfuerzo Percibido (RPE 1 al 10)</span>
            </label>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${rpeInfo.colorClass}`}>
              RPE {rpe} • {rpeInfo.label}
            </span>
          </div>

          {/* Large touch color buttons (1 to 10) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = rpe === num;
              // Visual color gradient based on exertion
              let btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
              if (num <= 2) {
                btnClass = isSelected
                  ? 'bg-sky-500 text-white ring-2 ring-sky-400'
                  : 'hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300';
              } else if (num <= 4) {
                btnClass = isSelected
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
              } else if (num <= 6) {
                btnClass = isSelected
                  ? 'bg-teal-500 text-white ring-2 ring-teal-400'
                  : 'hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300';
              } else if (num <= 8) {
                btnClass = isSelected
                  ? 'bg-amber-500 text-white ring-2 ring-amber-400'
                  : 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300';
              } else {
                btnClass = isSelected
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300';
              }

              return (
                <button
                  type="button"
                  key={num}
                  id={`rpe-button-${num}`}
                  onClick={() => setRpe(num)}
                  className={`h-11 rounded-xl font-black text-sm flex flex-col items-center justify-center transition-all active:scale-90 ${btnClass}`}
                >
                  <span>{num}</span>
                </button>
              );
            })}
          </div>

          {/* Description of selected RPE */}
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {rpeInfo.desc}
            </p>
          </div>
        </div>

        {/* Step 5: Brief Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            5. Notas breves (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Rodilla perfecta, cinta con 1% inclinación, música motivante..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Sensaciones geniales', 'Sin molestias', 'Inclinación 1%', 'Día caluroso', 'Piernas pesadas'].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setNotes((prev) => (prev ? `${prev}, ${tag}` : tag))}
                className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          id="save-cardio-workout-btn"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-extrabold text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Guardar Entrenamiento de Cardio</span>
        </button>
      </form>

      {/* Progress Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Avance de Cardio y Running</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evolución de tus entrenamientos a lo largo del tiempo
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setChartMetric('distance')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                chartMetric === 'distance'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Distancia (km)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('pace')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                chartMetric === 'pace'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ritmo (min/km)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('duration')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                chartMetric === 'duration'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tiempo (min)
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cardioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  domain={
                    chartMetric === 'pace'
                      ? ['auto', 'auto']
                      : [0, 'auto']
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{data.fullDate} ({data.location})</p>
                          <p>📏 Distancia: <span className="font-bold">{data.distance} km</span></p>
                          <p>⚡ Ritmo: <span className="font-bold text-teal-300">{data.paceFormatted}</span></p>
                          <p>⏱️ Duración: <span className="font-bold">{data.durationMin} min</span></p>
                          <p>🏎️ Velocidad: <span className="font-bold">{data.speedKmh} km/h</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={
                    chartMetric === 'distance'
                      ? 'distance'
                      : chartMetric === 'pace'
                      ? 'paceNumeric'
                      : 'durationMin'
                  }
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#cardioGradient)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Footprints className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Aún no hay suficientes datos para la gráfica
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Registra tu primer entrenamiento o carga ejemplos para visualizarla.
            </p>
            <button
              type="button"
              onClick={onLoadSampleCardio}
              className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
            >
              Cargar datos de ejemplo
            </button>
          </div>
        )}
      </div>

      {/* Recent History (Last 3 workouts as requested) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-500" />
              <span>Últimos Entrenamientos de Cardio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {recentWorkouts.length > 0
                ? `Mostrando ${displayWorkouts.length} de ${recentWorkouts.length} guardados`
                : 'Sin registros todavía'}
            </p>
          </div>

          {recentWorkouts.length > 3 && (
            <button
              type="button"
              onClick={() => setShowFullHistory((prev) => !prev)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              {showFullHistory ? (
                <>Ver solo últimos 3 <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Ver todos ({recentWorkouts.length}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>

        {displayWorkouts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            <Footprints className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-xs font-medium">No has registrado entrenamientos de cardio aún.</p>
            <button
              type="button"
              onClick={onLoadSampleCardio}
              className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Cargar 3 sesiones de ejemplo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayWorkouts.map((workout) => {
              const loc = CARDIO_LOCATIONS.find((l) => l.id === workout.location);
              const typ = CARDIO_TYPES.find((t) => t.id === workout.cardioType);
              const rpeBadge = getRpeDescription(workout.rpe);

              return (
                <div
                  key={workout.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5 transition-all hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{loc?.emoji || '🏃'}</span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {typ?.title || 'Cardio'}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {loc?.name || 'Entreno'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{workout.date}</span>
                        </p>
                      </div>
                    </div>

                    {/* Delete button with confirmation */}
                    {deletingId === workout.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-300 dark:border-rose-800">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCardio(workout.id);
                            setDeletingId(null);
                          }}
                          className="text-[10px] bg-rose-600 text-white font-bold px-2 py-1 rounded-lg"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] text-slate-500 px-1.5 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(workout.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Borrar entrenamiento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Speech test excerpt */}
                  {typ?.speechTest && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                      "{typ.speechTest}"
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distancia</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {workout.distanceKm} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tiempo</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {workout.durationMinutes}m {workout.durationSeconds > 0 ? `${workout.durationSeconds}s` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ritmo</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {workout.paceMinPerKm}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Esfuerzo</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        RPE {workout.rpe}
                      </span>
                    </div>
                  </div>

                  {workout.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 pl-1 border-l-2 border-emerald-500">
                      {workout.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
