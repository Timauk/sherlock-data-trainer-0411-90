import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const ManualPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manual do Sistema</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="players">Jogadores & IA</TabsTrigger>
          <TabsTrigger value="controls">Controles</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">O que é o Sistema?</h3>
                  <p>O Aprendiz é um sistema de treinamento que combina algoritmos genéticos com redes neurais para análise e previsão de padrões. O sistema utiliza múltiplos modelos de IA que trabalham em conjunto:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Rede Neural Principal: Responsável pelas previsões base</li>
                    <li>Rede Neural Sherlock: Focada em análise temporal e sequencial</li>
                    <li>Sistema de Ensemble: Combina diferentes modelos para melhor precisão</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Jogadores e Inteligência Artificial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Sistema de Jogadores</h3>
                  <p>Os jogadores são agentes de IA que evoluem através de um algoritmo genético:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Cada jogador possui pesos únicos que influenciam suas decisões</li>
                    <li>Fitness: Medida do desempenho do jogador</li>
                    <li>Score: Pontuação acumulada baseada em acertos</li>
                    <li>Generation: Indica a qual geração o jogador pertence</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">Evolução e Aprendizado</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Seleção Natural: Melhores jogadores são selecionados para reprodução</li>
                    <li>Mutação: Pequenas variações nos pesos para explorar novas estratégias</li>
                    <li>Clonagem: Replicação dos melhores jogadores</li>
                    <li>Feedback Loop: O desempenho influencia o treinamento do modelo neural</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls">
            <Card>
              <CardHeader>
                <CardTitle>Controles do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Controles Principais</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Iniciar/Pausar:</strong> Controla o ciclo de evolução</li>
                    <li><strong>Reiniciar:</strong> Reinicia o sistema com uma nova população</li>
                    <li><strong>Modo Infinito:</strong> Evolução contínua sem paradas</li>
                    <li><strong>Modo Manual:</strong> Permite controle manual da evolução</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">Upload e Salvamento</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Upload CSV:</strong> Carrega dados históricos para treinamento</li>
                    <li><strong>Upload Modelo:</strong> Carrega um modelo pré-treinado</li>
                    <li><strong>Salvar Modelo:</strong> Exporta o modelo atual</li>
                    <li><strong>Checkpoints:</strong> Sistema de backup e restauração</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Análises Disponíveis</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Análise de Padrões:</strong> Identifica padrões recorrentes</li>
                    <li><strong>Distribuição:</strong> Análise estatística dos números</li>
                    <li><strong>Tendências:</strong> Visualização de tendências temporais</li>
                    <li><strong>Lunar:</strong> Correlações com fases lunares</li>
                    <li><strong>Frequência:</strong> Análise de frequência dos números</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">Métricas e Visualizações</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Gráficos:</strong> Visualizações interativas dos dados</li>
                    <li><strong>Métricas do Modelo:</strong> Precisão e desempenho</li>
                    <li><strong>Evolução:</strong> Progresso das gerações</li>
                    <li><strong>Diagnósticos:</strong> Estado do sistema e recursos</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ManualPage;