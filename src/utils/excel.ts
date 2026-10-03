import * as XLSX from 'xlsx';
import { WorkoutSet, Exercise, SetStyle } from '../types';
import { calculateEstimated1RM, calculateSetVolume } from './calculations';
import { getSetStyleConfig } from './setStyles';

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
    const volume = calculateSetVolume(s);
    const est1RM = calculateEstimated1RM(s.weightKg, s.reps);
    const styleCfg = getSetStyleConfig(s.setStyle, s.customStyleName);
    const styleDisplay = s.pairedExerciseName 
      ? `${styleCfg.label} (con ${s.pairedExerciseName})`
      : styleCfg.label;

    const dropsFormatted = s.dropStages && s.dropStages.length > 0
      ? `Inicial: ${s.weightKg}kg × ${s.reps} | ` + s.dropStages.map((ds, i) => `Drop ${i + 1}: ${ds.weightKg}kg × ${ds.reps}`).join(' | ')
      : '';

    return {
      'Fecha': s.date,
      'Rutina': s.routine || 'General',
      'Ejercicio': s.exerciseName,
      'Grupo Muscular': muscle,
      'Estilo de Serie': styleDisplay,
      'Serie Nº': s.setNumber,
      'Peso (kg)': s.weightKg,
      'Repeticiones': s.reps,
      'Detalle Bajadas (Drops)': dropsFormatted,
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
    const volume = calculateSetVolume(s);
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
 * Flexible date parser supporting Excel serial numbers, YYYY-MM-DD, DD/MM/YYYY, etc.
 */
function parseFlexibleDate(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date (days since 1899-12-30)
    const excelEpoch = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(excelEpoch.getTime())) {
      return excelEpoch.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Fallback native Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Downloads a ready-to-use Excel template with sample rows and the exact expected columns.
 */
export function downloadExcelTemplate(): string {
  const templateData = [
    {
      'Fecha': '2026-09-07',
      'Rutina': 'Torso / Empuje',
      'Ejercicio': 'Press de banca plano',
      'Estilo de Serie': 'Top Set (Pesada)',
      'Serie Nº': 1,
      'Peso (kg)': 85,
      'Repeticiones': 6,
      'RPE (Esfuerzo)': 9,
      'Descanso (seg)': 150,
      'Notas': 'Serie pesada principal del día',
    },
    {
      'Fecha': '2026-09-07',
      'Rutina': 'Torso / Empuje',
      'Ejercicio': 'Press de banca plano',
      'Estilo de Serie': 'Drop Set (Descendente)',
      'Serie Nº': 2,
      'Peso (kg)': 65,
      'Repeticiones': 12,
      'RPE (Esfuerzo)': 9.5,
      'Descanso (seg)': 90,
      'Notas': 'Descenso de peso inmediato',
    },
    {
      'Fecha': '2026-09-07',
      'Rutina': 'Torso / Empuje',
      'Ejercicio': 'Press militar con barra',
      'Estilo de Serie': 'Superset (con Elevaciones laterales)',
      'Serie Nº': 1,
      'Peso (kg)': 50,
      'Repeticiones': 10,
      'RPE (Esfuerzo)': 8,
      'Descanso (seg)': 90,
      'Notas': 'Rango completo',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Historial de Series');
  const filename = 'Plantilla_FuerzaLog_Entrenamientos.xlsx';
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
    const rawStyle = String(row['Estilo de Serie'] || row['Estilo'] || row['Tipo de Serie'] || row['Style'] || '').trim();

    if (!rawExercise) return;

    const dateStr = parseFlexibleDate(rawDate);
    const exName = String(rawExercise).trim();
    const exId = exerciseMap.get(exName.toLowerCase()) || `ex-custom-${idx}`;
    const weightKg = parseFloat(String(rawWeight)) || 0;
    const reps = parseInt(String(rawReps), 10) || 1;
    const setNum = parseInt(String(rawSetNumber), 10) || 1;
    const rpe = parseFloat(String(rawRpe)) || 8;
    const restSeconds = parseInt(String(rawRest), 10) || 90;

    let setStyle: SetStyle = 'normal';
    let customStyleName: string | undefined = undefined;
    let pairedExerciseName: string | undefined = undefined;

    if (rawStyle) {
      const lower = rawStyle.toLowerCase();
      const pairedMatch = rawStyle.match(/\(con\s+([^)]+)\)/i);
      if (pairedMatch) {
        pairedExerciseName = pairedMatch[1].trim();
      }

      if (lower.includes('drop')) {
        setStyle = 'dropset';
      } else if (lower.includes('super')) {
        setStyle = 'superset';
      } else if (lower.includes('biserie')) {
        setStyle = 'biserie';
      } else if (lower.includes('triserie')) {
        setStyle = 'triserie';
      } else if (lower.includes('pause') || lower.includes('rest')) {
        setStyle = 'rest_pause';
      } else if (lower.includes('myo')) {
        setStyle = 'myo_reps';
      } else if (lower.includes('top')) {
        setStyle = 'top_set';
      } else if (lower.includes('back')) {
        setStyle = 'back_off';
      } else if (lower.includes('calent') || lower.includes('warm')) {
        setStyle = 'warmup';
      } else if (lower.includes('fallo') || lower.includes('amrap')) {
        setStyle = 'failure';
      } else if (!lower.includes('normal')) {
        setStyle = 'custom';
        customStyleName = rawStyle.replace(/\(con\s+[^)]+\)/i, '').trim();
      }
    }

    // Anchor timestamp to the actual workout date so chronological sorting is preserved
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
    const baseTime = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();
    const computedTimestamp = baseTime + setNum * 60000 + idx;

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
      timestamp: computedTimestamp,
      setStyle,
      customStyleName,
      pairedExerciseName,
    });
  });

  if (parsedSets.length === 0) {
    throw new Error('No se pudieron reconocer columnas válidas de ejercicios o series en el archivo. Revisa que contenga la columna "Ejercicio".');
  }

  return {
    importedSets: parsedSets,
    count: parsedSets.length,
  };
}
