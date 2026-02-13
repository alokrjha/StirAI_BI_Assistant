
export interface Dashboard {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface ReportState {
  activeDashboardId: string | null;
  filters: Record<string, any>;
  isVoiceActive: boolean;
  transcription: string;
  isModelThinking: boolean;
}

export enum DashboardType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  MARKETING = 'marketing',
  FINANCE = 'finance'
}
