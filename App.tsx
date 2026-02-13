
import React, { useState, useCallback } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import { DashboardView } from './components/DashboardView';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { Dashboard } from './types';

const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'sales',
    name: 'Global Sales Performance',
    description: 'Analyzing Parquet-based sales data across all regions.',
    url: 'https://picsum.photos/seed/sales/1200/800'
  },
  {
    id: 'inventory',
    name: 'Real-time Inventory',
    description: 'DuckDB optimized inventory levels from warehouse parquet files.',
    url: 'https://picsum.photos/seed/inventory/1200/800'
  },
  {
    id: 'marketing',
    name: 'Marketing Campaign ROI',
    description: 'Ad spend vs conversion tracking.',
    url: 'https://picsum.photos/seed/marketing/1200/800'
  }
];

const App: React.FC = () => {
  const [activeDashboardId, setActiveDashboardId] = useState<string>('sales');
  const [transcription, setTranscription] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  const activeDashboard = MOCK_DASHBOARDS.find(d => d.id === activeDashboardId) || MOCK_DASHBOARDS[0];

  const handleCommand = useCallback((command: { type: string; payload: any }) => {
    if (command.type === 'switch_dashboard') {
      const searchTerm = command.payload.toLowerCase();
      const target = MOCK_DASHBOARDS.find(d => 
        d.id.toLowerCase().includes(searchTerm) || 
        d.name.toLowerCase().includes(searchTerm)
      );
      if (target) {
        setActiveDashboardId(target.id);
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        dashboards={MOCK_DASHBOARDS} 
        activeId={activeDashboardId} 
        onSelect={setActiveDashboardId} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex-shrink-0 mr-8">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Voice BI Assistant</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Superset + DuckDB
            </p>
          </div>
          
          {/* New Natural Language Search Bar */}
          <div className="flex-1 flex justify-center">
            <SearchBar 
              onCommand={handleCommand} 
              availableDashboards={MOCK_DASHBOARDS.map(d => d.id)}
            />
          </div>

          <div className="flex items-center space-x-6 ml-8">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 border ${isLive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              {isLive ? 'LIVE' : 'IDLE'}
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <i className="fas fa-user-circle text-lg"></i>
            </div>
          </div>
        </header>

        {/* Dashboard Display */}
        <div className="flex-1 overflow-auto p-8">
          <DashboardView dashboard={activeDashboard} />
        </div>

        {/* Transcription Overlay */}
        {transcription && (
          <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none z-20">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-4 animate-bounce-in">
              <p className="text-white text-sm font-medium text-center flex items-center justify-center gap-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                {transcription}
              </p>
            </div>
          </div>
        )}

        {/* Voice Assistant Controller */}
        <VoiceAssistant 
          onCommand={handleCommand} 
          onTranscriptionUpdate={setTranscription}
          onStateChange={setIsLive}
        />
      </main>
    </div>
  );
};

export default App;
