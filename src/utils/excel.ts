import * as XLSX from 'xlsx';
import { WorkoutSet, Exercise } from '../types';
import { calculateEstimated1RM } from './calculations';

/**
 * Export workout sets to a comprehensive Excel (.xlsx) file with multiple sheets.
 */
export function exportWorkoutSetsToExcel(sets: WorkoutSet[], exercises: Exercise[] = []) {
  if (!sets || sets.length === 0) {
    throw new Error('No hay series registradas para exportar');
  }

  // Create a map for exercise muscle group lookup
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((ex) => {
    exerciseMap.set(ex.id, ex);
    exerciseMap.set(ex.name.toLowerCase(), ex);
  });

  // Sheet 1: Detailed Sets Log (Historial Completo)
  const sortedSets = [...sets].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.setNumber - b.setNumber;
  });

  const detailedData = sortedSets.map((s) => {
    const ex = exerciseMap.get(s.exerciseId) || exerciseMap.get(s.exerciseName.toLowerCase());
    const muscle = ex ? ex.category : 'General';
    const volume = Math.round(s.weightKg * s.reps * 10) / 10;
    const est1RM = calculateEstimated1RM(s.weightKg, s.reps);

    return {
      'Fecha': s.date,
      'Rutina': s.routine || 'General',
      'Ejercicio': s.exerciseName,
      'Grupo Muscular': muscle,
      'Serie Nº': s.setNumber,
      'Peso (kg)': s.weightKg,
      'Repeticiones': s.reps,
      'RPE (Esfuerzo)': s.rpe,
      'Descanso (seg)': s.restSeconds,
      'Volumen Serie (kg)': volume,
      '1RM Estimado (kg)': est1RM,
      'Notas': s.notes || '',
    };
  });

  // Sheet 2: PRs and Best Lifts per Exercise
  const exerciseStatsMap = new Map<
    string,
    {
      name: string;
      muscle: string;
      maxWeight: number;
      best1RM: number;
      totalSets: number;
      totalVolume: number;
      lastDate: string;
    }
  >();

  sets.forEach((s) => {
    const ex = exerciseMap.get(s.exerciseId) || exerciseMap.get(s.exerciseName.toLowerCase());
    const muscle = ex ? ex.category : 'General';
    const volume = s.weightKg * s.reps;
    const est1RM = calculateEstimated1RM(s.weightKg, s.reps);

    const existing = exerciseStatsMap.get(s.exerciseName);
    if (!existing) {
      exerciseStatsMap.set(s.exerciseName, {
        name: s.exerciseName,
        muscle,
        maxWeight: s.weightKg,
        best1RM: est1RM,
        totalSets: 1,
        totalVolume: volume,
        lastDate: s.date,
      });
    } else {
      existing.maxWeight = Math.max(existing.maxWeight, s.weightKg);
      existing.best1RM = Math.max(existing.best1RM, est1RM);
      existing.totalSets += 1;
      existing.totalVolume += volume;
      if (s.date > existing.lastDate) existing.lastDate = s.date;
    }
  });

  const recordsData = Array.from(exerciseStatsMap.values())
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .map((r) => ({
      'Ejercicio': r.name,
      'Grupo Muscular': r.muscle,
      'Carga Máxima (kg)': r.maxWeight,
      'Mejor 1RM Estimado (kg)': r.best1RM,
      'Total Series Realizadas': r.totalSets,
      'Volumen Total Acumulado (kg)': Math.round(r.totalVolume),
      'Última Sesión': r.lastDate,
    }));

  // Sheet 3: Daily Session Summary
  const sessionsMap = new Map<
    string,
    { date: string; routine: string; totalSets: number; totalVolume: number; exercisesList: Set<string> }
  >();

  sets.forEach((s) => {
    const key = `${s.date}_${s.routine || 'General'}`;
    const existing = sessionsMap.get(key);
    const volume = s.weightKg * s.reps;

    if (!existing) {
      const exSet = new Set<string>();
      exSet.add(s.exerciseName);
      sessionsMap.set(key, {
        date: s.date,
        routine: s.routine || 'General',
        totalSets: 1,
        totalVolume: volume,
        exercisesList: exSet,
      });
    } else {
      existing.totalSets += 1;
      existing.totalVolume += volume;
      existing.exercisesList.add(s.exerciseName);
    }
  });

  const sessionsData = Array.from(sessionsMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((ses) => ({
      'Fecha': ses.date,
      'Rutina': ses.routine,
      'Total Series': ses.totalSets,
      'Volumen Total Sesión (kg)': Math.round(ses.totalVolume),
      'Ejercicios Entrenados': Array.from(ses.exercisesList).join(', '),
    }));

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // Create Worksheets
  const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
  const wsRecords = XLSX.utils.json_to_sheet(recordsData);
  const wsSessions = XLSX.utils.json_to_sheet(sessionsData);

  // Auto-size columns for readability
  const setColumnWidths = (ws: XLSX.WorkSheet, data: Record<string, unknown>[]) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
    });
  };

  setColumnWidths(wsDetailed, detailedData);
  setColumnWidths(wsRecords, recordsData);
  setColumnWidths(wsSessions, sessionsData);

  // Append sheets
  XLSX.utils.book_append_sheet(workbook, wsDetailed, 'Historial de Series');
  XLSX.utils.book_append_sheet(workbook, wsRecords, 'Récords y Máximos');
  XLSX.utils.book_append_sheet(workbook, wsSessions, 'Resumen por Sesión');

  // Trigger Download
  const today = new Date().toISOString().split('T')[0];
  const filename = `FuerzaLog_Entrenamientos_${today}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
}

/**
 * Import workout sets from an Excel or CSV file.
 */
export async function importWorkoutSetsFromExcel(
  file: File,
  existingExercises: Exercise[] = []
): Promise<{ importedSets: WorkoutSet[]; count: number }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Look for the first sheet or 'Historial de Series'
  const sheetName = workbook.SheetNames.includes('Historial de Series')
    ? 'Historial de Series'
    : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('No se encontró ninguna hoja válida en el archivo Excel.');
  }

  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  if (!rows || rows.length === 0) {
    throw new Error('El archivo Excel está vacío o no contiene filas con datos.');
  }

  const exerciseMap = new Map<string, string>(); // name -> id
  existingExercises.forEach((ex) => {
    exerciseMap.set(ex.name.toLowerCase().trim(), ex.id);
  });

  const parsedSets: WorkoutSet[] = [];

  rows.forEach((row, idx) => {
    // Flexible column names (Spanish and English support)
    const rawDate = row['Fecha'] || row['fecha'] || row['Date'] || row['date'];
    const rawExercise = row['Ejercicio'] || row['ejercicio'] || row['Exercise'] || row['exercise'] || row['Nombre'];
    const rawWeight = row['Peso (kg)'] || row['Peso'] || row['peso'] || row['Weight'] || row['weight'] || row['kg'];
    const rawReps = row['Repeticiones'] || row['Reps'] || row['reps'] || row['repeticiones'];
    const rawSetNumber = row['Serie Nº'] || row['Serie'] || row['serie'] || row['Set'];
    const rawRpe = row['RPE (Esfuerzo)'] || row['RPE'] || row['rpe'];
    const rawRest = row['Descanso (seg)'] || row['Descanso'] || row['descanso'] || row['Rest'];
    const rawRoutine = row['Rutina'] || row['rutina'] || row['Routine'] || 'General';
    const rawNotes = row['Notas'] || row['notas'] || row['Notes'] || '';

    if (!rawExercise) return;

    let dateStr = new Date().toISOString().split('T')[0];
    if (rawDate) {
      if (typeof rawDate === 'number') {
        // Excel serial date number
        const excelEpoch = new Date((rawDate - 25569) * 86400 * 1000);
        if (!isNaN(excelEpoch.getTime())) {
          dateStr = excelEpoch.toISOString().split('T')[0];
        }
      } else {
        const parsed = String(rawDate).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
          dateStr = parsed;
        } else {
          const tryDate = new Date(parsed);
          if (!isNaN(tryDate.getTime())) {
            dateStr = tryDate.toISOString().split('T')[0];
          }
        }
      }
    }

    const exName = String(rawExercise).trim();
    const exId = exerciseMap.get(exName.toLowerCase()) || `ex-custom-${idx}`;
    const weightKg = parseFloat(String(rawWeight)) || 0;
    const reps = parseInt(String(rawReps), 10) || 1;
    const setNum = parseInt(String(rawSetNumber), 10) || 1;
    const rpe = parseFloat(String(rawRpe)) || 8;
    const restSeconds = parseInt(String(rawRest), 10) || 90;

    parsedSets.push({
      id: `set-import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: exId,
      exerciseName: exName,
      routine: String(rawRoutine).trim() || 'General',
      date: dateStr,
      weightKg,
      reps,
      setNumber: setNum,
      rpe,
      restSeconds,
      notes: rawNotes ? String(rawNotes).trim() : undefined,
      timestamp: new Date(dateStr).getTime() + idx * 1000,
    });
  });

  if (parsedSets.length === 0) {
    throw new Error('No se pudieron reconocer columnas válidas de ejercicios o series en el archivo.');
  }

  return {
    importedSets: parsedSets,
    count: parsedSets.length,
  };
}
