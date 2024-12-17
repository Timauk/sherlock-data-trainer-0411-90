import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemStatusProps {
  isReady: boolean;
  message: string;
  icon?: React.ReactNode;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ isReady, message, icon }) => {
  return (
    <Alert variant={isReady ? "default" : "destructive"}>
      <AlertDescription className="flex items-center gap-2">
        {icon}
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default SystemStatus;