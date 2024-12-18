import React from 'react';
import ImplementationChecklist from '@/components/ImplementationChecklist';

const HomePage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Plano de Implementação</h1>
      <ImplementationChecklist />
    </div>
  );
};

export default HomePage;