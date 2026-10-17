import React from 'react';
import { Search, Sliders, Building2, ShieldAlert, BookOpen } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MOBILE_TABS = [
  { id: 'scan', label: 'Scanner', href: '/', icon: Search },
  { id: 'scamometer', label: 'Diagnostic', href: '/?tab=scamometer', icon: Sliders },
  { id: 'siret', label: 'SIRET Gouv', href: '/?tab=siret', icon: Building2 },
  { id: 'scamwatch', label: 'ScamWatch', href: '/?tab=scamwatch', icon: ShieldAlert },
  { id: 'guides', label: 'Guides', href: '/?tab=guides', icon: BookOpen },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav aria-label="Navigation mobile" className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800/80 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <a
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 font-medium hover:text-slate-300'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500/20' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
