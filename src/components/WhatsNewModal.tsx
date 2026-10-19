import React from 'react';
import { CURRENT_APP_VERSION, markChangelogSeen } from '../utils/storageManager';
import {
  Sparkles,
  Activity,
  Timer,
  Cloud,
  Smartphone,
  CheckCircle,
  X,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStorageSettings?: () => void;
  onOpenCardio?: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onOpenStorageSettings,
  onOpenCardio,
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    markChangelogSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient badge */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent dark:from-teal-900/40 dark:via-cyan-950/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    ¡Novedades en LogGym!
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-900/70 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-cyan-800">
                    v{CURRENT_APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Descubre las nuevas funciones y mejoras añadidas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list of recent changes */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Item 1: Cardio & Running Module */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-cyan-800 transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1.5">
              <span className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-cyan-300">
                <Activity className="w-4 h-4" />
              </span>
              <span>Nueva sección de Cardio y Running</span>
            </div>
            <ul className="space-y-1 pl-7 list-disc list-outside text-slate-600 dark:text-slate-300">
              <li>
                <strong>Fácil y rápido:</strong> botones grandes para <em>Cinta</em>, <em>Calle</em> o <em>Pista</em>.
              </li>
              <li>
                <strong>Prueba del habla:</strong> tipos de cardio explicados de forma amigable (LISS, HIIT, Tempo) sin jerga técnica.
              </li>
              <li>
                <strong>Ritmo en tiempo real:</strong> cálculo automático del Pace (min/km) y conversión desde km/h para cinta.
              </li>
              <li>
                <strong>Historial y Gráfica:</strong> revisa tus últimos 3 entrenos de cardio y sigue tu evolución visual.
              </li>
            </ul>
          </div>

          {/* Item 2: Cloud vs Local Storage */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-cyan-800 transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1.5">
              <span className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                <Cloud className="w-4 h-4" />
              </span>
              <span>Almacenamiento Local o Nube Personal</span>
            </div>
            <ul className="space-y-1 pl-7 list-disc list-outside text-slate-600 dark:text-slate-300">
              <li>
                <strong>Tú decides dónde guardar:</strong> en la memoria privada de tu teléfono o en tu propia nube (Google Drive / OneDrive).
              </li>
              <li>
                <strong>Cuentas independientes:</strong> cada usuario conecta su propia cuenta de nube, sin mezclar datos con nadie.
              </li>
              <li>
                <strong>Migración inteligente:</strong> si ya tenías entrenamientos registrados, no se pierden y se respaldan con un solo clic.
              </li>
            </ul>
          </div>

          {/* Item 3: Background Rest Timer & Limiter */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-cyan-800 transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1.5">
              <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <Timer className="w-4 h-4" />
              </span>
              <span>Cronómetro de descanso mejorado</span>
            </div>
            <ul className="space-y-1 pl-7 list-disc list-outside text-slate-600 dark:text-slate-300">
              <li>
                <strong>Botón de cerrar:</strong> el recuadro flotante se puede cerrar o abrir cuando gustes con total libertad.
              </li>
              <li>
                <strong>Activación inmediata:</strong> el descanso empieza a correr enseguida tras anotar cada serie.
              </li>
              <li>
                <strong>Tope de 3 minutos:</strong> descanso protegido con un límite máximo de 180 segundos.
              </li>
              <li>
                <strong>Persistencia en segundo plano:</strong> el cronómetro sigue activo aun si minimizas o cierras la app.
              </li>
            </ul>
          </div>

          {/* Item 4: Bottom Navigation Ergonomics */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-cyan-800 transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-1.5">
              <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Smartphone className="w-4 h-4" />
              </span>
              <span>Botones inferiores cómodos y deslizables</span>
            </div>
            <ul className="space-y-1 pl-7 list-disc list-outside text-slate-600 dark:text-slate-300">
              <li>
                Botones de gran tamaño fáciles de pulsar con una sola mano en medio del gimnasio.
              </li>
              <li>
                Desplazamiento horizontal táctil y suave entre todas las funciones de la app.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
          {onOpenStorageSettings && (
            <button
              type="button"
              onClick={() => {
                handleDismiss();
                onOpenStorageSettings();
              }}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Ver Almacenamiento</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-teal-600 dark:bg-cyan-500 text-white hover:bg-teal-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-teal-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <span>¡Entendido, a entrenar!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
