import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutSet, Exercise } from '../types';
import {
  calculateTotalVolume,
  calculatePeakLoad,
  countUniqueSessions,
  calculateEstimated1RM,
  formatDisplayDate,
} from '../utils/calculations';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Award, Flame, Timer, Sparkles } from 'lucide-react';

interface ProgressTabProps {
  sets: WorkoutSet[];
  exercises: Exercise[];
  onLoadSampleData: () => void;
}

type ChartView = 'volume' | 'max_load' | 'sessions' | 'rest';

export const ProgressTab: React.FC<ProgressTabProps> = ({
  sets,
  exercises,
  onLoadSampleData,
}) => {
  const [chartView, setChartView] = useState<ChartView>('volume');
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('all');
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const totalTonnage = calculateTotalVolume(sets);
  const peakLoad = calculatePeakLoad(sets);
  const totalSessions = countUniqueSessions(sets);
  const totalSetsCount = sets.length;

  // Filter sets if a specific exercise is picked for detailed tracking
  const targetSets = useMemo(() => {
    if (selectedExerciseFilter === 'all') return sets;
    return sets.filter((s) => s.exerciseId === selectedExerciseFilter);
  }, [sets, selectedExerciseFilter]);

  // Aggregate data by date in strict ascending chronological order (past to present)
  const chartData = useMemo(() => {
    if (targetSets.length === 0) return [];

    const grouped: {
      [date: string]: {
        date: string;
        displayDate: string;
        fullDate: string;
        volumen: number;
        maxCarga: number;
        series: number;
        avgRest: number;
        restTotal: number;
        e1RM: number;
      };
    } = {};

    targetSets.forEach((s) => {
      const d = s.date;
      if (!d) return;

      if (!grouped[d]) {
        grouped[d] = {
          date: d,
          displayDate: '',
          fullDate: formatDisplayDate(d),
          volumen: 0,
          maxCarga: 0,
          series: 0,
          avgRest: 0,
          restTotal: 0,
          e1RM: 0,
        };
      }
      const vol = s.weightKg * s.reps;
      grouped[d].volumen += vol;
      grouped[d].series += 1;
      grouped[d].restTotal += s.restSeconds || 0;
      if (s.weightKg > grouped[d].maxCarga) {
        grouped[d].maxCarga = s.weightKg;
      }
      const calc1RM = calculateEstimated1RM(s.weightKg, s.reps);
      if (calc1RM > grouped[d].e1RM) {
        grouped[d].e1RM = calc1RM;
      }
    });

    // Sort strictly chronologically by ISO date string (e.g. 2026-05-15 before 2026-09-07)
    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Check if dates span across different years to adapt the X-axis label
    const years = new Set(sortedDates.map((d) => d.slice(0, 4)));
    const spansMultipleYears = years.size > 1;

    return sortedDates.map((d) => {
      const item = grouped[d];
      const parts = d.split('-');
      const displayDate = spansMultipleYears && parts.length === 3
        ? `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`
        : parts.length === 3
        ? `${parts[2]}/${parts[1]}`
        : d;

      return {
        ...item,
        displayDate,
        volumen: Math.round(item.volumen * 10) / 10,
        avgRest: item.series > 0 ? Math.round(item.restTotal / item.series) : 0,
      };
    });
  }, [targetSets]);

  // Best records per exercise
  const bestRecords = useMemo(() => {
    const map: {
      [exerciseId: string]: {
        exerciseName: string;
        maxWeight: number;
        bestSetReps: number;
        bestEstimated1RM: number;
        totalVolume: number;
      };
    } = {};

    sets.forEach((s) => {
      if (!map[s.exerciseId]) {
        map[s.exerciseId] = {
          exerciseName: s.exerciseName,
          maxWeight: s.weightKg,
          bestSetReps: s.reps,
          bestEstimated1RM: calculateEstimated1RM(s.weightKg, s.reps),
          totalVolume: s.weightKg * s.reps,
        };
      } else {
        map[s.exerciseId].totalVolume += s.weightKg * s.reps;
        const currentE1RM = calculateEstimated1RM(s.weightKg, s.reps);
        if (currentE1RM > map[s.exerciseId].bestEstimated1RM) {
          map[s.exerciseId].bestEstimated1RM = currentE1RM;
          map[s.exerciseId].maxWeight = s.weightKg;
          map[s.exerciseId].bestSetReps = s.reps;
        } else if (s.weightKg > map[s.exerciseId].maxWeight) {
          map[s.exerciseId].maxWeight = s.weightKg;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.maxWeight - a.maxWeight);
  }, [sets]);

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Header (Matches Screenshot 4) */}
      <div className="pt-1 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Progreso</h1>
      </div>

      {/* KPI Cards (Matches Screenshot 4) */}
      <div className="space-y-3">
        {/* Tonelaje acumulado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tonelaje acumulado</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalTonnage.toLocaleString()} kg
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Todas las series registradas</p>
        </div>

        {/* Carga pico registrada */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Carga pico registrada</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {peakLoad} kg
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {peakLoad > 0 ? 'Mayor peso levantado' : 'Sin registros'}
          </p>
        </div>

        {/* Sesiones */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sesiones</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalSessions}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{totalSetsCount} series en total</p>
        </div>
      </div>

      {/* Chart controls & Segmented tabs (Matches Screenshot 4) */}
      <div className="mt-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
          <button
            type="button"
            onClick={() => setChartView('volume')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              chartView === 'volume'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Volumen total
          </button>
          <button
            type="button"
            onClick={() => setChartView('max_load')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              chartView === 'max_load'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cargas máximas
          </button>
          <button
            type="button"
            onClick={() => setChartView('sessions')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              chartView === 'sessions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sesiones
          </button>
          <button
            type="button"
            onClick={() => setChartView('rest')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              chartView === 'rest'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Descansos
          </button>
        </div>

        {/* Exercise filter for chart */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Filtrar gráfico:</span>
          <select
            value={selectedExerciseFilter}
            onChange={(e) => setSelectedExerciseFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0e7490] dark:focus:ring-cyan-500 focus:outline-none font-medium"
          >
            <option value="all">Todos los ejercicios combinados</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Visual Chart Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors">
          {chartData.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                No hay datos suficientes para trazar la curva de progresión.
              </p>
              <button
                type="button"
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cargar datos de prueba
              </button>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'volume' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e7490" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0e7490" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`${val.toLocaleString()} kg`, 'Volumen']}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return `Fecha: ${item?.fullDate || label}`;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="volumen" stroke="#0e7490" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                ) : chartView === 'max_load' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        `${val} kg`,
                        name === 'e1RM' ? '1RM Estimado' : 'Carga Real',
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return `Fecha: ${item?.fullDate || label}`;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="maxCarga" name="Carga máxima" stroke="#0e7490" strokeWidth={2.5} dot={{ r: 4, fill: '#0e7490' }} />
                    <Line type="monotone" dataKey="e1RM" name="1RM" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#059669' }} />
                  </LineChart>
                ) : chartView === 'sessions' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`${val} series`, 'Series totales']}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return `Fecha: ${item?.fullDate || label}`;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="series" fill="#0e7490" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`${val} seg`, 'Descanso medio']}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return `Fecha: ${item?.fullDate || label}`;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="avgRest" name="Descanso medio (s)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4, fill: '#d97706' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Mejores marcas por ejercicio (Matches Screenshot 4) */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Mejores marcas por ejercicio
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {bestRecords.length} movimientos
          </span>
        </div>

        {bestRecords.length === 0 ? (
          /* Empty state matching Image 4 */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-8 text-center shadow-xs transition-colors">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Sin cargas todavía</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Las mejores marcas y cálculos de 1RM aparecerán aquí conforme registres tus series.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden transition-colors">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <div>Ejercicio ↕</div>
              <div className="text-center">Carga máxima ↕</div>
              <div className="text-right">Mejor serie ↕</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {bestRecords.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 px-4 py-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.exerciseName}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      1RM est: ~{item.bestEstimated1RM} kg
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.maxWeight} kg
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.maxWeight} kg × {item.bestSetReps}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
