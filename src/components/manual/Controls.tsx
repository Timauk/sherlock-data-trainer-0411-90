import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Controls = () => {
  return (
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
  );
};

export default Controls;