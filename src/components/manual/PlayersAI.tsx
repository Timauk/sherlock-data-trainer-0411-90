import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PlayersAI = () => {
  return (
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
  );
};

export default PlayersAI;