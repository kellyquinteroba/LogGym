import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, ExternalLink, X, HelpCircle, Layers, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-cyan-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Descargar e Instalar</h2>
              <p className="text-[11px] text-cyan-200/80">App en tu teléfono o archivo APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 dark:bg-slate-800/90 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-700 text-cyan-900 dark:text-cyan-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            1. Instalar en Móvil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-700 text-cyan-900 dark:text-cyan-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Descargar como APK
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {activeTab === 'pwa' ? (
            <div className="space-y-3.5">
              {isInstalled ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">¡Ya está instalada!</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 mt-0.5">
                      Esta aplicación ya está instalada y funcionando en modo autónomo con icono en tu pantalla.
                    </p>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 rounded-xl p-3.5 text-cyan-950 dark:text-cyan-200">
                  <p className="font-bold text-xs">Instalación directa disponible</p>
                  <p className="text-[11px] text-cyan-800 dark:text-cyan-300/90 mt-1 mb-3">
                    Tu navegador permite instalar la app directamente en un toque. Creará un icono en tu móvil que abre a pantalla completa y sin conexión.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-[#0e7490] hover:bg-[#0c627a] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    Instalar en este dispositivo
                  </button>
                </div>
              ) : null}

              {/* Instructions by Platform */}
              <div className="space-y-2.5">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">
                      A
                    </span>
                    <span>Android (Google Chrome / Samsung Internet)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] pl-1">
                    <li>Toca el botón de <strong>tres puntos (⋮)</strong> en la esquina superior del navegador.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                    <li>Listo: se añadirá como una aplicación con su propio icono sin barra de navegación.</li>
                  </ol>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">
                      i
                    </span>
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] pl-1">
                    <li>Abre la app en <strong>Safari</strong>.</li>
                    <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</li>
                    <li>Baja y pulsa en <strong>"Añadir a pantalla de inicio"</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-[11px] text-slate-500 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-300">Ventaja PWA:</strong> Ocupa menos de 5 MB, se actualiza automáticamente cuando hay mejoras y tus registros de peso y repeticiones se guardan en el teléfono de forma segura.
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <HelpCircle className="w-4 h-4 text-[#0e7490] dark:text-cyan-400" />
                  <span>¿Cómo generar un archivo .APK?</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sí, es 100% posible obtener un archivo <strong>.APK</strong> instalable para Android. Como esta app ya está optimizada con manifest y service worker (PWA), puedes empaquetarla en APK de dos formas sencillas:
                </p>
              </div>

              {/* Option 1: PWABuilder */}
              <div className="border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/50 dark:bg-cyan-950/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0e7490] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    PWABuilder (Recomendado - 1 Clic)
                  </span>
                  <span className="text-[10px] font-semibold text-[#0e7490] dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 rounded-full">Gratis y Oficial</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Es la herramienta oficial creada por Microsoft y recomendada por Google. Introduce la URL de esta app y descarga el paquete APK firmado listo para instalar.
                </p>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedUrl ? '✓ URL copiada al portapapeles' : 'Copiar URL de la aplicación'}
                  </button>

                  <a
                    href="https://www.pwabuilder.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#0e7490] hover:bg-[#0c627a] text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Abrir PWABuilder y generar APK</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Option 2: Capacitor / Bubblewrap */}
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 rounded-xl p-3 space-y-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 dark:bg-slate-700 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Con Bubblewrap CLI o Capacitor
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Para desarrolladores: puedes usar Google Bubblewrap (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">npx @bubblewrap/cli build</code>) para compilar el proyecto directamente en un binario APK o AAB para Google Play.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
