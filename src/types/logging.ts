export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model';
  message: string;
  details?: any;
}

export interface SystemLoggerInterface {
  log: (type: LogEntry['type'], message: string, details?: any) => void;
  error: (type: LogEntry['type'], message: string, details?: any) => void;
  warn: (type: LogEntry['type'], message: string, details?: any) => void;
  debug: (type: LogEntry['type'], message: string, details?: any) => void;
  getLogs: () => LogEntry[];
  getLogsByType: (type: LogEntry['type']) => LogEntry[];
  clearLogs: () => void;
}