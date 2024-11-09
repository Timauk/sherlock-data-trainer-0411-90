import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImplementationChecklist from '@/components/ImplementationChecklist';

const ImplementationPlanPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 neon-title">Plano de Implementação</h1>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="current">Plano Atual</TabsTrigger>
          <TabsTrigger value="evolution">Evolução do Sistema</TabsTrigger>
          <TabsTrigger value="layout">Layout e UI</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <ImplementationChecklist />
        </TabsContent>

        <TabsContent value="evolution">
          <div className="space-y-4">
            <h3 className="font-semibold">Melhorias em Implementação</h3>
            <p>Detalhes sobre as melhorias em implementação.</p>
            {/* Add more content as required */}
          </div>
        </TabsContent>

        <TabsContent value="layout">
          <div className="space-y-4">
            <h3 className="font-semibold">Organização do Layout e Melhorias Visuais</h3>
            <p>Detalhes sobre a organização do layout.</p>
            {/* Add more content as required */}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <h3 className="font-semibold">Segurança e Privacidade</h3>
            <p>Detalhes sobre segurança e privacidade.</p>
            {/* Add more content as required */}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-4">
            <h3 className="font-semibold">Otimização de Performance</h3>
            <p>Detalhes sobre otimização de performance.</p>
            {/* Add more content as required */}
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <h3 className="font-semibold">Integrações e APIs</h3>
            <p>Detalhes sobre integrações e APIs.</p>
            {/* Add more content as required */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationPlanPage;
