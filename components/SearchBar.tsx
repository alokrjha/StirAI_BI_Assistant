
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

interface SearchBarProps {
  onCommand: (cmd: { type: string; payload: any }) => void;
  availableDashboards: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onCommand, availableDashboards }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User query: "${query}"`,
        config: {
          systemInstruction: `You are a BI Assistant for a system with these dashboards: ${availableDashboards.join(', ')}. 
          Analyze the user's English query. 
          If they want to see a specific report or dashboard, identify which one is the best match.
          Return ONLY a JSON object in this format: {"action": "switch", "target": "dashboard_id"} 
          If you don't find a match, return {"action": "none", "message": "I couldn't find a report for that."}`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              target: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ['action']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.action === 'switch' && result.target) {
        onCommand({ type: 'switch_dashboard', payload: result.target });
        setQuery('');
      } else if (result.message) {
        alert(result.message);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isLoading ? (
          <i className="fas fa-circle-notch fa-spin text-blue-500"></i>
        ) : (
          <i className="fas fa-search text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
        )}
      </div>
      <input
        type="text"
        className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm shadow-sm"
        placeholder="Query your reports in English (e.g. 'show me sales data')..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <button 
        type="submit"
        className="absolute inset-y-2 right-2 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Ask AI'}
      </button>
    </form>
  );
};
