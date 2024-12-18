import React from 'react';
import { Card } from "@/components/ui/card";
import SystemDiagnostics from '@/components/SystemDiagnostics';
import LongTermMonitoring from '@/components/LongTermMonitoring';

const Index = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard do Sistema</h1>
      
      <div className="grid gap-6">
        <SystemDiagnostics />
        <LongTermMonitoring />
      </div>
    </div>
  );
};

export default Index;