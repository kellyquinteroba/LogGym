import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Download, Upload, Check, AlertCircle, X, Database, RefreshCw } from 'lucide-react';
import { WorkoutSet, Exercise } from '../types';
import { exportWorkoutSetsToExcel, importWorkoutSetsFromExcel } from '../utils/excel';

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
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Gestión con Excel (.xlsx)</h2>
              <p className="text-[11px] text-emerald-200/80">Exportar y guardar tus datos en hojas de cálculo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportPreview(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Cargar desde Excel
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-600">
          {activeTab === 'export' ? (
            <div className="space-y-3.5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-emerald-950">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Libro Excel Completo (.xlsx)
                </p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Genera un archivo nativo de Microsoft Excel con <strong>3 pestañas formateadas automáticamente</strong>:
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-emerald-900 list-disc list-inside">
                  <li><strong>Historial de Series:</strong> Cada peso, repetición, RPE, descanso y 1RM calculado.</li>
                  <li><strong>Récords y Máximos:</strong> Cargas máximas y volumen total por ejercicio.</li>
                  <li><strong>Resumen por Sesión:</strong> Volumen total acumulado por día y rutina.</li>
                </ul>
              </div>

              {/* Stats overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-slate-700">
                <span className="text-xs">Series disponibles para exportar:</span>
                <span className="font-bold text-slate-900 text-sm bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  {sets.length}
                </span>
              </div>

              {exportSuccess && (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportSuccess}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={sets.length === 0 || isExporting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Compatible con Microsoft Excel, Google Sheets, LibreOffice y Numbers.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  Importar o Restaurar Copia
                </p>
                <p className="text-[11px] text-slate-600">
                  Sube un archivo <strong>.xlsx</strong> o <strong>.csv</strong> exportado previamente para restaurar tus entrenamientos o cargarlos desde tu ordenador.
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
                className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/30 text-slate-700 font-medium py-6 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-6 h-6 text-emerald-700" />
                <span className="text-xs font-semibold text-slate-800">
                  {isImporting ? 'Analizando archivo...' : 'Seleccionar archivo Excel (.xlsx / .csv)'}
                </span>
                <span className="text-[10px] text-slate-400">Toca para explorar tus archivos</span>
              </button>

              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              {importPreview && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-950">
                      Archivo reconocido: {importPreview.filename}
                    </span>
                    <span className="bg-cyan-200 text-cyan-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {importPreview.count} series
                    </span>
                  </div>

                  <p className="text-[11px] text-cyan-900">
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
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
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
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
