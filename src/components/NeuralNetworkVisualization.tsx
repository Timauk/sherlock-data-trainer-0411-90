import React, { useState, useEffect } from 'react';

interface NeuralNetworkVisualizationProps {
  layers: number[];
  inputData?: number[];
  outputData?: number[];
}

const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({ 
  layers = [17, 256, 128, 64, 15], 
  inputData, 
  outputData 
}) => {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const width = 800;
  const height = 500;
  const nodeRadius = 8;
  const layerSpacing = width / (layers.length + 1);

  useEffect(() => {
    if (inputData && outputData) {
      const newActiveNodes: string[] = [];
      
      // Ativar nós da camada de entrada
      inputData.forEach((value, index) => {
        if (value > 0.3) {
          newActiveNodes.push(`node-0-${index}`);
        }
      });
      
      // Ativar nós da camada de saída
      outputData.forEach((value, index) => {
        if (value > 0.3) {
          newActiveNodes.push(`node-${layers.length - 1}-${index}`);
        }
      });
      
      // Ativar alguns nós das camadas intermediárias aleatoriamente
      layers.slice(1, -1).forEach((_, layerIndex) => {
        const activationCount = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < activationCount; i++) {
          newActiveNodes.push(`node-${layerIndex + 1}-${Math.floor(Math.random() * layers[layerIndex + 1])}`);
        }
      });
      
      setActiveNodes(newActiveNodes);
    }
  }, [inputData, outputData, layers]);

  const calculateNodePosition = (layerIndex: number, nodeIndex: number, nodesInLayer: number) => {
    const x = (layerIndex + 1) * layerSpacing;
    const layerHeight = (height - 40) / (nodesInLayer + 1);
    const y = (nodeIndex + 1) * layerHeight + 20;
    return { x, y };
  };

  const renderNodes = () => {
    return layers.flatMap((nodesInLayer, layerIndex) =>
      Array.from({ length: nodesInLayer }, (_, nodeIndex) => {
        const { x, y } = calculateNodePosition(layerIndex, nodeIndex, nodesInLayer);
        const nodeKey = `node-${layerIndex}-${nodeIndex}`;
        const isActive = activeNodes.includes(nodeKey);
        return (
          <circle
            key={nodeKey}
            cx={x}
            cy={y}
            r={nodeRadius}
            className={`${
              isActive 
                ? 'fill-green-500 animate-pulse' 
                : 'fill-blue-500'
            } transition-all duration-300`}
          />
        );
      })
    );
  };

  const renderConnections = () => {
    return layers.slice(0, -1).flatMap((nodesInLayer, layerIndex) =>
      Array.from({ length: nodesInLayer }, (_, nodeIndex) =>
        Array.from({ length: layers[layerIndex + 1] }, (_, nextNodeIndex) => {
          const start = calculateNodePosition(layerIndex, nodeIndex, nodesInLayer);
          const end = calculateNodePosition(
            layerIndex + 1, 
            nextNodeIndex, 
            layers[layerIndex + 1]
          );
          
          const startNodeKey = `node-${layerIndex}-${nodeIndex}`;
          const endNodeKey = `node-${layerIndex + 1}-${nextNodeIndex}`;
          const isActive = activeNodes.includes(startNodeKey) && 
                          activeNodes.includes(endNodeKey);
          
          return (
            <line
              key={`connection-${layerIndex}-${nodeIndex}-${nextNodeIndex}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className={`${
                isActive 
                  ? 'stroke-green-300 stroke-2' 
                  : 'stroke-gray-300 stroke-1'
              } transition-all duration-300`}
            />
          );
        })
      ).flat()
    );
  };

  return (
    <div className="mt-8 bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Visualização da Rede Neural Melhorada</h3>
      <div className="relative">
        <svg width={width} height={height}>
          {renderConnections()}
          {renderNodes()}
        </svg>
        <div className="absolute top-2 right-2 text-sm text-gray-600">
          Camadas: {layers.join(' → ')}
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkVisualization;