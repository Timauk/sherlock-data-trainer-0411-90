import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DiagnosticResult } from './SystemDiagnostics';

interface DiagnosticResultsProps {
  results: DiagnosticResult[];
}

const DiagnosticResults = ({ results }: DiagnosticResultsProps) => {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Alert 
          key={index} 
          variant={result.status === 'error' ? 'destructive' : 'default'}
          className={
            result.status === 'warning' 
              ? 'border-yellow-500 dark:border-yellow-400' 
              : result.status === 'success'
              ? 'border-green-500 dark:border-green-400'
              : ''
          }
        >
          <h3 className="font-medium">{result.phase}</h3>
          <AlertDescription>
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default DiagnosticResults;