import React, { useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { systemLogger } from '@/utils/logging/systemLogger';
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  timestamp: Date;
  type: string;
  message: string;
  details?: any;
}

const EnhancedLogDisplay: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const updateLogs = (event: CustomEvent<LogEntry>) => {
      setLogs(prevLogs => [...prevLogs, event.detail]);
    };

    window.addEventListener('systemLog', updateLogs as EventListener);
    setLogs(systemLogger.getLogs());

    return () => {
      window.removeEventListener('systemLog', updateLogs as EventListener);
    };
  }, []);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'action':
        return 'bg-blue-500';
      case 'prediction':
        return 'bg-green-500';
      case 'performance':
        return 'bg-yellow-500';
      case 'system':
        return 'bg-purple-500';
      case 'lunar':
        return 'bg-indigo-500';
      case 'player':
        return 'bg-orange-500';
      case 'checkpoint':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">Todos os Logs</option>
          <option value="action">Ações</option>
          <option value="prediction">Previsões</option>
          <option value="performance">Performance</option>
          <option value="system">Sistema</option>
          <option value="lunar">Lunar</option>
          <option value="player">Jogadores</option>
          <option value="checkpoint">Checkpoints</option>
        </select>
      </div>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        {filteredLogs.map((log, index) => (
          <div key={index} className="mb-2 flex items-start gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <Badge variant="secondary" className={`${getLogColor(log.type)} text-white`}>
              {log.type}
            </Badge>
            <div className="flex-1">
              <span className="text-sm">{log.message}</span>
              {log.details && (
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default EnhancedLogDisplay;