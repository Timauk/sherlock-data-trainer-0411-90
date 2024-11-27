import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Overview = () => {
  return (
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
  );
};

export default Overview;