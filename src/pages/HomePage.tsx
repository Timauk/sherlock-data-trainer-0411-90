import React from 'react';
import ImplementationChecklist from '@/components/ImplementationChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const HomePage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Plano de Implementação</h1>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Plano Atual</TabsTrigger>
          <TabsTrigger value="evolution">Evolução do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <ImplementationChecklist />
        </TabsContent>

        <TabsContent value="evolution">
          <ScrollArea className="h-[600px]">
            <Card>
              <CardHeader>
                <CardTitle>Melhorias em Implementação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">1. Sistema de Evolução Aprimorado</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="crossover" checked />
                      <label htmlFor="crossover">Crossover Uniforme Adaptativo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mutation" checked />
                      <label htmlFor="mutation">Mutação Gaussiana</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="age" checked />
                      <label htmlFor="age">Sistema de Idade para Jogadores</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="niches" checked />
                      <label htmlFor="niches">Nichos Evolutivos</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">2. Análise e Validação</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="patterns" checked />
                      <label htmlFor="patterns">Análise de Padrões Temporais</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="seasonal" checked />
                      <label htmlFor="seasonal">Análise de Ciclos Sazonais</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="cross-validation" checked />
                      <label htmlFor="cross-validation">Validação Cruzada K-Fold</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">3. Sistema de Recompensa</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="history" checked />
                      <label htmlFor="history">Recompensas Baseadas em Histórico</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="patterns-reward" checked />
                      <label htmlFor="patterns-reward">Bônus por Novos Padrões</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="penalties" checked />
                      <label htmlFor="penalties">Sistema de Penalidades</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="consistency" checked />
                      <label htmlFor="consistency">Bônus por Consistência</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">4. Visualização e Monitoramento</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="evolution-graph" checked />
                      <label htmlFor="evolution-graph">Gráfico de Evolução Genética</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="niches-graph" checked />
                      <label htmlFor="niches-graph">Gráfico de Nichos</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="performance" checked />
                      <label htmlFor="performance">Métricas de Performance</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePage;