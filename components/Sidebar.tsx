
import React from 'react';
import { Dashboard } from '../types';

interface SidebarProps {
  dashboards: Dashboard[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ dashboards, activeId, onSelect }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
      <div className="p-6 flex items-center space-x-3 bg-slate-950">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
          <i className="fas fa-chart-line"></i>
        </div>
        <span className="text-xl font-bold tracking-tight">Superset V-BI</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-4">Dashboards</p>
        {dashboards.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeId === d.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${d.id === 'sales' ? 'fa-dollar-sign' : d.id === 'inventory' ? 'fa-warehouse' : 'fa-bullhorn'} w-5`}></i>
            <span className="font-medium">{d.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 text-slate-400 text-xs text-center">
        <p>© 2025 Voice Analytics</p>
        <p>DuckDB Engine Active</p>
      </div>
    </aside>
  );
};
