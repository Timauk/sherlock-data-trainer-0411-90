import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Updates = () => {
  return (
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
  );
};

export default Updates;