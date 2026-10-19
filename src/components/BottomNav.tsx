import React, { useEffect, useRef } from 'react';
import { Home, Dumbbell, TrendingUp, BookOpen, Calendar, Activity, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeRestTimer?: boolean;
  restRemaining?: number;
  onOpenWhatsNew?: () => void;
  hasNewChangelog?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenWhatsNew,
  hasNewChangelog,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs: {
    id: TabType | 'whats_new';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isAction?: boolean;
  }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'planner', label: 'Plan Semanal', icon: Calendar },
    { id: 'workouts', label: 'Fuerza', icon: Dumbbell },
    { id: 'cardio', label: 'Cardio & Run', icon: Activity },
    { id: 'progress', label: 'Progreso', icon: TrendingUp },
    { id: 'exercises', label: 'Ejercicios', icon: BookOpen },
    { id: 'whats_new', label: 'Novedades', icon: Sparkles, isAction: true },
  ];

  // Auto-scroll active tab into view when activeTab changes
  useEffect(() => {
    const activeEl = document.getElementById(`nav-tab-${activeTab}`);
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeTab]);

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto transition-all shadow-xl"
    >
      {/* Scrollable container with swipeable large touch buttons */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto flex-nowrap scrollbar-none snap-x snap-mandatory touch-pan-x"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isWhatsNew = tab.id === 'whats_new';
            const isActive = !isWhatsNew && activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  if (isWhatsNew) {
                    onOpenWhatsNew?.();
                  } else {
                    onSelectTab(tab.id as TabType);
                  }
                }}
                className={`flex flex-col items-center justify-center shrink-0 min-w-[86px] py-2 px-3 rounded-2xl snap-center transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-b from-teal-50 to-teal-100/80 dark:from-cyan-950/80 dark:to-cyan-900/50 text-[#0e7490] dark:text-cyan-400 font-bold shadow-sm ring-1 ring-[#0e7490]/30 dark:ring-cyan-500/40'
                    : isWhatsNew
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200/50 dark:border-amber-800/40'
                    : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="relative mb-1">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.4]' : isWhatsNew ? 'text-amber-500 scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                  {tab.id === 'cardio' && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                  {isWhatsNew && hasNewChangelog && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <span
                  className={`text-[12px] leading-tight tracking-tight whitespace-nowrap ${
                    isActive
                      ? 'text-[#0e7490] dark:text-cyan-400 font-bold'
                      : isWhatsNew
                      ? 'text-amber-700 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
