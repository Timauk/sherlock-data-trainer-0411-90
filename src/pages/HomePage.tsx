import React from 'react';
import ImplementationChecklist from '@/components/ImplementationChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const HomePage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 neon-title">Plano de Implementação</h1>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Plano Atual</TabsTrigger>
          <TabsTrigger value="evolution">Evolução do Sistema</TabsTrigger>
          <TabsTrigger value="layout">Layout e Melhorias Visuais</TabsTrigger>
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
                      <label htmlFor="crossover">Crossover Uniforme Adaptativo ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mutation" checked />
                      <label htmlFor="mutation">Mutação Gaussiana ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="age" checked />
                      <label htmlFor="age">Sistema de Idade para Jogadores ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="niches" checked />
                      <label htmlFor="niches">Nichos Evolutivos ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">2. Análise e Validação</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="patterns" checked />
                      <label htmlFor="patterns">Análise de Padrões Temporais ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="seasonal" checked />
                      <label htmlFor="seasonal">Análise de Ciclos Sazonais ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="cross-validation" checked />
                      <label htmlFor="cross-validation">Validação Cruzada K-Fold ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">3. Sistema de Recompensa</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="history" checked />
                      <label htmlFor="history">Recompensas Baseadas em Histórico ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="patterns-reward" checked />
                      <label htmlFor="patterns-reward">Bônus por Novos Padrões ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="penalties" checked />
                      <label htmlFor="penalties">Sistema de Penalidades ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">4. Visualização e Monitoramento</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="evolution-graph" checked />
                      <label htmlFor="evolution-graph">Gráfico de Evolução Genética ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="niches-graph" checked />
                      <label htmlFor="niches-graph">Gráfico de Nichos ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="performance" checked />
                      <label htmlFor="performance">Métricas de Performance ✅</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layout">
          <ScrollArea className="h-[600px]">
            <Card>
              <CardHeader>
                <CardTitle>Organização do Layout e Melhorias Visuais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">1. Interface Principal</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="responsive" checked />
                      <label htmlFor="responsive">Layout Responsivo ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dark-mode" checked />
                      <label htmlFor="dark-mode">Tema Escuro/Claro ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="animations" checked />
                      <label htmlFor="animations">Animações Suaves ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">2. Painéis de Controle</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="organized-controls" checked />
                      <label htmlFor="organized-controls">Controles Organizados ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tooltips" checked />
                      <label htmlFor="tooltips">Tooltips Informativos ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feedback" checked />
                      <label htmlFor="feedback">Feedback Visual ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">3. Visualização de Dados</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="interactive-charts" checked />
                      <label htmlFor="interactive-charts">Gráficos Interativos ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="data-filters" checked />
                      <label htmlFor="data-filters">Filtros de Dados ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="real-time" checked />
                      <label htmlFor="real-time">Atualizações em Tempo Real ✅</label>
                    </div>
                  </div>

                  <h3 className="font-semibold">4. Acessibilidade</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="keyboard" checked />
                      <label htmlFor="keyboard">Navegação por Teclado ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="screen-readers" checked />
                      <label htmlFor="screen-readers">Suporte a Leitores de Tela ✅</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="contrast" checked />
                      <label htmlFor="contrast">Alto Contraste ✅</label>
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