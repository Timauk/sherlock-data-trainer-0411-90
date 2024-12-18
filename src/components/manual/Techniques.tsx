import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Techniques = () => {
  return (
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
  );
};

export default Techniques;