import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const ManualPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manual do Sistema</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="players">Jogadores & IA</TabsTrigger>
          <TabsTrigger value="controls">Controles</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
          <TabsTrigger value="techniques">Técnicas</TabsTrigger>
          <TabsTrigger value="updates">Atualizações</TabsTrigger>
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
                  <p>O Aprendiz é um sistema avançado de treinamento que combina múltiplas técnicas de IA:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Redes Neurais Profundas (Deep Learning)</li>
                    <li>Algoritmos Genéticos para Evolução</li>
                    <li>Análise de Séries Temporais</li>
                    <li>Sistemas de Ensemble Learning</li>
                    <li>Processamento Paralelo</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Arquitetura do Sistema</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Frontend React com TypeScript</li>
                    <li>Backend Node.js com Express</li>
                    <li>TensorFlow.js para Deep Learning</li>
                    <li>Sistema de Checkpoints para Backup</li>
                    <li>Análise em Tempo Real</li>
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
                  <p>Os jogadores são agentes de IA que evoluem através de algoritmos genéticos sofisticados:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Pesos Neurais Individuais</li>
                    <li>Sistema de Fitness Adaptativo</li>
                    <li>Pontuação Baseada em Desempenho</li>
                    <li>Evolução por Gerações</li>
                    <li>Clonagem Seletiva</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Processo Evolutivo</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Seleção Natural:</strong> Os melhores jogadores são selecionados para reprodução</li>
                    <li><strong>Mutação Adaptativa:</strong> Taxa de mutação ajustada com base no desempenho</li>
                    <li><strong>Crossover Inteligente:</strong> Combinação otimizada de características</li>
                    <li><strong>Feedback Loop:</strong> Aprendizado contínuo com dados históricos</li>
                    <li><strong>Memória de Padrões:</strong> Armazenamento de sequências bem-sucedidas</li>
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
                    <li><strong>Iniciar/Pausar:</strong> Controla o ciclo de evolução e treinamento</li>
                    <li><strong>Reiniciar:</strong> Reinicia o sistema mantendo o conhecimento adquirido</li>
                    <li><strong>Modo Infinito:</strong> Evolução contínua sem interrupções</li>
                    <li><strong>Modo Manual:</strong> Controle granular da evolução</li>
                    <li><strong>Velocidade:</strong> Ajuste da velocidade de processamento</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Gestão de Dados</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Upload CSV:</strong> Importação de dados históricos</li>
                    <li><strong>Upload Modelo:</strong> Carregamento de modelos pré-treinados</li>
                    <li><strong>Salvar Modelo:</strong> Exportação do estado atual</li>
                    <li><strong>Checkpoints:</strong> Sistema de backup automático</li>
                    <li><strong>Exportação:</strong> Dados de análise e previsões</li>
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
                    <li><strong>Análise de Padrões:</strong> Identificação de sequências recorrentes</li>
                    <li><strong>Distribuição:</strong> Análise estatística avançada</li>
                    <li><strong>Tendências:</strong> Análise temporal com ARIMA</li>
                    <li><strong>Correlações:</strong> Análise de correlações complexas</li>
                    <li><strong>Previsões:</strong> Modelos preditivos ensemble</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Visualizações</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Gráficos:</strong> Visualizações interativas em tempo real</li>
                    <li><strong>Métricas:</strong> Indicadores de desempenho</li>
                    <li><strong>Evolução:</strong> Acompanhamento geracional</li>
                    <li><strong>Diagnósticos:</strong> Monitoramento do sistema</li>
                    <li><strong>Heatmaps:</strong> Mapas de calor de padrões</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="techniques">
            <Card>
              <CardHeader>
                <CardTitle>Técnicas Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Deep Learning</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Redes LSTM:</strong> Memória de longo prazo para padrões temporais</li>
                    <li><strong>Attention Mechanism:</strong> Foco em padrões relevantes</li>
                    <li><strong>Transfer Learning:</strong> Aproveitamento de conhecimento prévio</li>
                    <li><strong>Dropout:</strong> Prevenção de overfitting</li>
                    <li><strong>Batch Normalization:</strong> Estabilidade no treinamento</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Algoritmos Genéticos</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Seleção Adaptativa:</strong> Ajuste dinâmico de critérios</li>
                    <li><strong>Mutação Inteligente:</strong> Alterações direcionadas</li>
                    <li><strong>Crossover Multi-ponto:</strong> Combinação complexa de características</li>
                    <li><strong>Elitismo:</strong> Preservação dos melhores indivíduos</li>
                    <li><strong>Diversidade Populacional:</strong> Manutenção de variabilidade</li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Análise Estatística</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>ARIMA:</strong> Modelagem de séries temporais</li>
                    <li><strong>Análise Bayesiana:</strong> Probabilidades condicionais</li>
                    <li><strong>Regressão Não-Linear:</strong> Modelagem de relações complexas</li>
                    <li><strong>Testes de Hipótese:</strong> Validação estatística</li>
                    <li><strong>Análise de Componentes:</strong> Redução de dimensionalidade</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates">
            <Card>
              <CardHeader>
                <CardTitle>Atualizações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Últimas Atualizações</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Versão 2.0:</strong> 
                      <ul className="list-circle pl-6 mt-1">
                        <li>Novo sistema de ensemble learning</li>
                        <li>Melhorias na análise temporal</li>
                        <li>Interface mais responsiva</li>
                        <li>Otimização de performance</li>
                      </ul>
                    </li>
                    <li><strong>Versão 1.5:</strong>
                      <ul className="list-circle pl-6 mt-1">
                        <li>Implementação de LSTM</li>
                        <li>Sistema de checkpoints</li>
                        <li>Análise de correlações</li>
                      </ul>
                    </li>
                    <li><strong>Versão 1.0:</strong>
                      <ul className="list-circle pl-6 mt-1">
                        <li>Lançamento inicial</li>
                        <li>Sistema básico de evolução</li>
                        <li>Análises fundamentais</li>
                      </ul>
                    </li>
                  </ul>
                </section>

                <Separator className="my-4" />

                <section>
                  <h3 className="text-lg font-semibold">Próximas Atualizações</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Implementação de GPT para análise de padrões</li>
                    <li>Sistema de recomendação avançado</li>
                    <li>Análise de sentimento do mercado</li>
                    <li>Integração com APIs externas</li>
                    <li>Novas visualizações interativas</li>
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