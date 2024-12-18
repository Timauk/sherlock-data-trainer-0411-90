import React from 'react';

interface LogDisplayProps {
  logs: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  const filteredLogs = logs.filter(log => log.includes('Premiação'));

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Logs em Tempo Real</h3>
      <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
        {filteredLogs.map((log, index) => (
          <p key={index} className="text-sm font-medium text-green-600 dark:text-green-400">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};

export default LogDisplay;