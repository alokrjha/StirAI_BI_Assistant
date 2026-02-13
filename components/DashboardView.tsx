
import React from 'react';
import { Dashboard } from '../types';

interface DashboardViewProps {
  dashboard: Dashboard;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ dashboard }) => {
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{dashboard.name}</h2>
        <p className="text-slate-500">{dashboard.description}</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative min-h-[500px]">
        {/* In a real app, this would be an IFrame to Apache Superset */}
        <img 
          src={dashboard.url} 
          alt={dashboard.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <i className="fas fa-expand text-slate-600"></i>
          </button>
          <button className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <i className="fas fa-download text-slate-600"></i>
          </button>
        </div>

        {/* Mocking some BI elements */}
        <div className="absolute inset-0 pointer-events-none p-12 flex items-center justify-center">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/60 backdrop-blur border border-white/50 p-6 rounded-2xl shadow-xl pointer-events-auto">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <i className={`fas ${i === 1 ? 'fa-chart-area' : i === 2 ? 'fa-users' : 'fa-shopping-cart'}`}></i>
                      </div>
                      <span className="text-green-500 text-sm font-bold flex items-center">
                        <i className="fas fa-arrow-up mr-1"></i>
                        {Math.floor(Math.random() * 20)}%
                      </span>
                   </div>
                   <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Metric {i}</h3>
                   <p className="text-2xl font-bold text-slate-900">${(Math.random() * 1000).toFixed(2)}K</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
