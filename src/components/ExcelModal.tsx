import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Download, Upload, Check, AlertCircle, X, Database, RefreshCw, FileText, Info, HelpCircle, Table, FileDown } from 'lucide-react';
import { WorkoutSet, Exercise } from '../types';
import { exportWorkoutSetsToExcel, importWorkoutSetsFromExcel, downloadExcelTemplate } from '../utils/excel';

interface ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: WorkoutSet[];
  exercises: Exercise[];
  onImportSets: (newSets: WorkoutSet[], replace: boolean) => void;
}

export const ExcelModal: React.FC<ExcelModalProps> = ({
  isOpen,
  onClose,
  sets,
  exercises,
  onImportSets,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ sets: WorkoutSet[]; count: number; filename: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [showColumnsGuide, setShowColumnsGuide] = useState(false);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      setExportSuccess(null);
      const filename = exportWorkoutSetsToExcel(sets, exercises);
      setExportSuccess(`Archivo generado: ${filename}`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al exportar a Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMessage(null);
    setIsImporting(true);

    try {
      const result = await importWorkoutSetsFromExcel(file, exercises);
      setImportPreview({
        sets: result.importedSets,
        count: result.count,
        filename: file.name,
      });
    } catch (err: unknown) {
      setImportError((err as Error).message || 'No se pudo leer el archivo Excel.');
      setImportPreview(null);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = (replace: boolean) => {
    if (!importPreview) return;
    onImportSets(importPreview.sets, replace);
    setImportSuccessMessage(
      replace
        ? `Se reemplazó el historial con ${importPreview.count} series de Excel.`
        : `Se añadieron ${importPreview.count} series nuevas desde Excel.`
    );
    setImportPreview(null);
    setTimeout(() => {
      setImportSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-emerald-900/30 dark:border-slate-800 flex items-center justify-between bg-emerald-800 dark:bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 dark:bg-emerald-900/80 border border-emerald-500/40 dark:border-emerald-700/50 flex items-center justify-center text-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Gestión con Excel (.xlsx)</h2>
              <p className="text-[11px] text-emerald-200/80">Exportar y guardar tus datos en hojas de cálculo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/80 dark:hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 dark:bg-slate-800/90 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportPreview(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar a Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setExportSuccess(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Cargar desde Excel
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {activeTab === 'export' ? (
            <div className="space-y-3.5">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5 text-emerald-950 dark:text-emerald-200">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Libro Excel Completo (.xlsx)
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1">
                  Genera un archivo nativo de Microsoft Excel con <strong>3 pestañas formateadas automáticamente</strong>:
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-emerald-900 dark:text-emerald-200/90 list-disc list-inside">
                  <li><strong>Historial de Series:</strong> Cada peso, repetición, RPE, descanso y 1RM calculado.</li>
                  <li><strong>Récords y Máximos:</strong> Cargas máximas y volumen total por ejercicio.</li>
                  <li><strong>Resumen por Sesión:</strong> Volumen total acumulado por día y rutina.</li>
                </ul>
              </div>

              {/* Stats overview */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-xs">Series disponibles para exportar:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {sets.length}
                </span>
              </div>

              {exportSuccess && (
                <div className="bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{exportSuccess}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={sets.length === 0 || isExporting}
                className="w-full bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}
              </button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Compatible con Microsoft Excel, Google Sheets, LibreOffice y Numbers.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Info banner with columns breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Importar o Restaurar Copia
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const filename = downloadExcelTemplate();
                        setImportSuccessMessage(`Plantilla descargada: ${filename}`);
                        setTimeout(() => setImportSuccessMessage(null), 3500);
                      } catch (err: unknown) {
                        alert((err as Error).message || 'Error al descargar plantilla');
                      }
                    }}
                    className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 bg-emerald-100/70 dark:bg-emerald-900/50 hover:bg-emerald-200/70 dark:hover:bg-emerald-800/50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors border border-emerald-300/60 dark:border-emerald-700/50"
                    title="Descargar un archivo Excel listo con las columnas correctas"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    Descargar Plantilla
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para que la app reconozca e importe correctamente tus entrenamientos, la primera fila de tu archivo Excel o CSV debe incluir los siguientes nombres de columna:
                </p>

                {/* Columns Explanation Card */}
                <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-lg p-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Table className="w-3.5 h-3.5 text-[#0e7490] dark:text-cyan-400" />
                      Estructura de Columnas (Fila 1 = Encabezados):
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/40 dark:border-emerald-800/40">
                      Excel / CSV
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 min-w-[84px] shrink-0">
                        • Ejercicio:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        <strong className="text-rose-600 dark:text-rose-400 font-bold">(Obligatoria)</strong> Nombre del ejercicio (ej. <em>Press de banca plano</em>, <em>Sentadilla con barra</em>).
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Fecha:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Formato recomendado <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">AAAA-MM-DD</code> (ej. <code>2026-09-07</code>) o <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">DD/MM/AAAA</code>. Si se deja vacía, se asigna la fecha de hoy.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Peso (kg):
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Carga numérica levantada en kg (ej. <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">80</code> o <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">102.5</code>). También se reconoce la cabecera <em>Peso</em> o <em>Weight</em>.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Repeticiones:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Número entero de repeticiones realizadas (ej. <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">8</code>, <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">10</code>). También se reconoce <em>Reps</em>.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Serie Nº:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Número ordinal de la serie (1, 2, 3...). Opcional (por defecto 1).
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • RPE (Esfuerzo):
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Grado de esfuerzo percibido del 1 al 10 (ej. <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">8</code> u <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">8.5</code>). Opcional (por defecto 8).
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Descanso (seg):
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Segundos de pausa tras la serie (ej. <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">90</code>, <code className="bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">120</code>). Opcional (por defecto 90).
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Rutina:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Nombre de la rutina o día (ej. <em>Torso / Empuje</em>, <em>Pierna</em>). Opcional (por defecto &quot;General&quot;).
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[84px] shrink-0">
                        • Notas:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        Anotaciones adicionales sobre la técnica o sensaciones. Opcional.
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 rounded-lg p-2 leading-relaxed">
                  💡 <strong>Consejo:</strong> Cualquier archivo exportado desde FuerzaLog con el botón <em>&quot;Descargar Excel (.xlsx)&quot;</em> ya viene con este formato exacto en su pestaña &quot;Historial de Series&quot; y se puede importar directamente sin modificar nada.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file-upload-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 font-medium py-6 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isImporting ? 'Analizando archivo...' : 'Seleccionar archivo Excel (.xlsx / .csv)'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Toca para explorar tus archivos</span>
              </button>

              {importError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div className="bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl p-3 flex items-center gap-2 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              {importPreview && (
                <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-950 dark:text-cyan-200">
                      Archivo reconocido: {importPreview.filename}
                    </span>
                    <span className="bg-cyan-200 dark:bg-cyan-900/80 text-cyan-900 dark:text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {importPreview.count} series
                    </span>
                  </div>

                  <p className="text-[11px] text-cyan-900 dark:text-cyan-300">
                    ¿Cómo deseas incorporar estos registros a la aplicación?
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmImport(false)}
                      className="bg-[#0e7490] hover:bg-[#0c627a] text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Añadir a actuales
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmImport(true)}
                      className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reemplazar todo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
