import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bem-vindo ao Aprendiz</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-lg">
            Sistema de treinamento e análise para previsões de jogos usando inteligência artificial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;