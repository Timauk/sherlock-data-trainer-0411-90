import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  PlayCircle, 
  Settings, 
  BarChart, 
  Database,
  Upload,
  Save,
  RefreshCw,
  Pause,
  Infinity,
  Hand,
  Cpu,
  Moon
} from 'lucide-react';

const ManualPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manual do Sistema</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="howtoplay">Como Jogar</TabsTrigger>
          <TabsTrigger value="controls">Controles</TabsTrigger>
          <TabsTrigger value="ai">Inteligência Artificial</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Visão Geral do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">O que é o Sistema?</h3>
                  <p>O Aprendiz é um sistema avançado de treinamento que combina algoritmos genéticos com redes neurais para análise e previsão de padrões. O sistema utiliza múltiplos modelos de IA que trabalham em conjunto:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Rede Neural Principal: Responsável pelas previsões base e análise de padrões históricos</li>
                    <li>Rede Neural Sherlock: Focada em análise temporal e sequencial de padrões complexos</li>
                    <li>Sistema de Ensemble: Combina diferentes modelos especializados para melhor precisão</li>
                    <li>Análise Lunar: Correlaciona resultados com fases lunares e ciclos naturais</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="howtoplay">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  Como Jogar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Passo a Passo</h3>
                  <ol className="list-decimal pl-6 mt-2 space-y-4">
                    <li>
                      <strong>Inicialização:</strong>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Carregue um arquivo CSV com dados históricos usando o botão "Upload CSV"</li>
                        <li>Opcionalmente, carregue um modelo pré-treinado com "Upload Modelo"</li>
                        <li>Aguarde a inicialização dos jogadores</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Configuração:</strong>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Ajuste a velocidade de evolução usando o controle deslizante</li>
                        <li>Escolha entre modo manual ou automático</li>
                        <li>Configure o modo infinito se desejar evolução contínua</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Evolução:</strong>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Clique em "Iniciar" para começar o processo evolutivo</li>
                        <li>Observe as previsões e resultados em tempo real</li>
                        <li>Acompanhe o desempenho através dos gráficos e métricas</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Análise:</strong>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Utilize as diferentes abas de análise para insights detalhados</li>
                        <li>Examine padrões identificados pelo sistema</li>
                        <li>Acompanhe o progresso dos jogadores</li>
                      </ul>
                    </li>
                  </ol>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Controles do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Controles Principais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Alert>
                      <PlayCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Iniciar/Pausar:</strong> Controla o ciclo de evolução dos jogadores
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <RefreshCw className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Reiniciar:</strong> Recria a população de jogadores do zero
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Infinity className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Modo Infinito:</strong> Permite evolução contínua sem paradas
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Hand className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Modo Manual:</strong> Controle manual sobre a evolução
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Moon className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Tema:</strong> Alterna entre modo claro e escuro
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Cpu className="h-4 w-4" />
                      <AlertDescription>
                        <strong>GPU:</strong> Ativa/desativa processamento na GPU
                      </AlertDescription>
                    </Alert>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">Gerenciamento de Dados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Alert>
                      <Upload className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Upload CSV:</strong> Carrega dados históricos para treinamento
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Upload Modelo:</strong> Carrega um modelo pré-treinado
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Save className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Salvar Modelo:</strong> Exporta o modelo atual com seus pesos
                      </AlertDescription>
                    </Alert>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Sistema de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Jogadores e Evolução</h3>
                  <div className="space-y-4">
                    <p>Cada jogador é um agente de IA com características únicas:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Pesos Neurais:</strong> Conjunto único de valores que determinam como o jogador interpreta os dados</li>
                      <li><strong>Nicho:</strong> Especialização do jogador (pares, ímpares, sequências ou geral)</li>
                      <li><strong>Idade:</strong> Número de gerações que o jogador sobreviveu</li>
                      <li><strong>Fitness:</strong> Medida de sucesso baseada em acertos</li>
                    </ul>

                    <p className="mt-4">O processo evolutivo inclui:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Seleção Natural:</strong> Os melhores jogadores são mantidos para a próxima geração</li>
                      <li><strong>Crossover:</strong> Combinação de características de dois jogadores bem-sucedidos</li>
                      <li><strong>Mutação:</strong> Pequenas alterações aleatórias nos pesos para explorar novas estratégias</li>
                      <li><strong>Especialização:</strong> Desenvolvimento de nichos específicos de atuação</li>
                    </ul>

                    <p className="mt-4">Sistema de Recompensas:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>11 acertos: Recompensa base</li>
                      <li>12 acertos: Recompensa aumentada</li>
                      <li>13 acertos: Recompensa premium</li>
                      <li>14-15 acertos: Recompensa excepcional + Clonagem automática</li>
                    </ul>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-6 w-6" />
                  Ferramentas de Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Análises Disponíveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Análise de Padrões:</strong>
                        <ul className="list-disc pl-6 mt-2">
                          <li>Detecção de sequências</li>
                          <li>Análise de frequência</li>
                          <li>Identificação de ciclos</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <AlertDescription>
                        <strong>Análise Lunar:</strong>
                        <ul className="list-disc pl-6 mt-2">
                          <li>Correlação com fases da lua</li>
                          <li>Padrões sazonais</li>
                          <li>Ciclos naturais</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <AlertDescription>
                        <strong>Análise Estatística:</strong>
                        <ul className="list-disc pl-6 mt-2">
                          <li>Distribuição de números</li>
                          <li>Probabilidades condicionais</li>
                          <li>Tendências temporais</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <AlertDescription>
                        <strong>Visualização Neural:</strong>
                        <ul className="list-disc pl-6 mt-2">
                          <li>Estrutura da rede</li>
                          <li>Pesos das conexões</li>
                          <li>Ativações em tempo real</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">Parâmetros do Sistema</h3>
                  <div className="space-y-4">
                    <p>Configurações que podem ser ajustadas para otimizar o desempenho:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Taxa de Mutação:</strong> Controla a frequência de mudanças aleatórias</li>
                      <li><strong>Taxa de Crossover:</strong> Define a frequência de combinação entre jogadores</li>
                      <li><strong>Tamanho da População:</strong> Número de jogadores ativos</li>
                      <li><strong>Pressão Seletiva:</strong> Intensidade da seleção natural</li>
                      <li><strong>Ciclo de Vida:</strong> Duração máxima de um jogador</li>
                    </ul>

                    <p className="mt-4">Otimizações de Performance:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Processamento GPU:</strong> Acelera cálculos usando hardware gráfico</li>
                      <li><strong>Cache de Previsões:</strong> Armazena resultados frequentes</li>
                      <li><strong>Batch Processing:</strong> Processa múltiplos jogadores simultaneamente</li>
                    </ul>
                  </div>
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