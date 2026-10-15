import React, { useEffect, useRef } from 'react';
import { Home, Dumbbell, TrendingUp, BookOpen, Calendar, Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeRestTimer?: boolean;
  restRemaining?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'planner', label: 'Plan Semanal', icon: Calendar },
    { id: 'workouts', label: 'Fuerza', icon: Dumbbell },
    { id: 'cardio', label: 'Cardio & Run', icon: Activity },
    { id: 'progress', label: 'Progreso', icon: TrendingUp },
    { id: 'exercises', label: 'Ejercicios', icon: BookOpen },
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
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center shrink-0 min-w-[84px] py-2 px-3 rounded-2xl snap-center transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-b from-teal-50 to-teal-100/80 dark:from-cyan-950/80 dark:to-cyan-900/50 text-[#0e7490] dark:text-cyan-400 font-bold shadow-sm ring-1 ring-[#0e7490]/30 dark:ring-cyan-500/40'
                    : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="relative mb-1">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {tab.id === 'cardio' && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-[12px] leading-tight tracking-tight whitespace-nowrap ${
                    isActive ? 'text-[#0e7490] dark:text-cyan-400 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'
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
