import React from 'react';
import { Home, Dumbbell, TrendingUp, BookOpen } from 'lucide-react';
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
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'workouts', label: 'Entrenos', icon: Dumbbell },
    { id: 'progress', label: 'Progreso', icon: TrendingUp },
    { id: 'exercises', label: 'Ejercicios', icon: BookOpen },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto transition-all shadow-lg"
    >
      <div className="flex items-center justify-around py-2 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-teal-50 dark:bg-cyan-950/60 text-[#0e7490] dark:text-cyan-400 font-semibold ring-1 ring-[#0e7490]/20 dark:ring-cyan-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[11px] tracking-tight mt-0.5 ${isActive ? 'text-[#0e7490] dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
