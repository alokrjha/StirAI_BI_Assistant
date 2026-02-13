
import React, { useState, useCallback } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import { DashboardView } from './components/DashboardView';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './types';

const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'sales',
    name: 'Global Sales Performance',
    description: 'Analyzing Parquet-based sales data across all regions.',
    url: 'https://picsum.photos/seed/sales/1200/800' // In reality, this would be a Superset embed URL
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

  const handleVoiceCommand = useCallback((command: { type: string; payload: any }) => {
    if (command.type === 'switch_dashboard') {
      const target = MOCK_DASHBOARDS.find(d => 
        d.id.toLowerCase().includes(command.payload.toLowerCase()) || 
        d.name.toLowerCase().includes(command.payload.toLowerCase())
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Voice BI Assistant</h1>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
              Powered by Apache Superset & DuckDB
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-user"></i>
            </div>
          </div>
        </header>

        {/* Dashboard Display */}
        <div className="flex-1 overflow-auto p-6">
          <DashboardView dashboard={activeDashboard} />
        </div>

        {/* Transcription Overlay */}
        {transcription && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md border border-blue-100 shadow-2xl rounded-2xl p-4 animate-bounce-in">
              <p className="text-gray-700 font-medium text-center">
                <i className="fas fa-quote-left mr-2 text-blue-400"></i>
                {transcription}
              </p>
            </div>
          </div>
        )}

        {/* Voice Assistant Controller */}
        <VoiceAssistant 
          onCommand={handleVoiceCommand} 
          onTranscriptionUpdate={setTranscription}
          onStateChange={setIsLive}
        />
      </main>
    </div>
  );
};

export default App;
