import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

async function validateModelForPrediction(model: tf.LayersModel): Promise<boolean> {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Modelo inválido ou sem camadas');
      return false;
    }

    if (!model.optimizer) {
      systemLogger.warn('model', 'Modelo não compilado, compilando agora...');
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    }

    const inputShape = model.inputs[0].shape[1];
    const testTensor = tf.zeros([1, inputShape]);
    
    try {
      const testPred = model.predict(testTensor) as tf.Tensor;
      const testResult = await testPred.data();
      
      if (!testResult || testResult.length === 0) {
        throw new Error('Predição de teste falhou');
      }
      
      testPred.dispose();
      testTensor.dispose();
      
      systemLogger.log('model', 'Validação do modelo bem sucedida', {
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape,
        testResult: Array.from(testResult).slice(0, 5)
      });
      
      return true;
    } catch (error) {
      systemLogger.error('model', 'Teste de predição falhou', { error });
      return false;
    }
  } catch (error) {
    systemLogger.error('model', 'Validação do modelo falhou', { error });
    return false;
  }
}

export async function handlePlayerPredictions(
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: { phase: string; patterns: Record<string, number[]> }
) {
  systemLogger.log('game', 'Iniciando predições', {
    totalPlayers: players.length,
    modelLoaded: !!trainedModel,
    lunarPhase: lunarData.phase
  });

  if (!trainedModel) {
    throw new Error('Modelo não carregado');
  }

  const isModelValid = await validateModelForPrediction(trainedModel);
  if (!isModelValid) {
    throw new Error('Validação do modelo falhou');
  }

  const inputShape = trainedModel.inputs[0].shape[1];

  return Promise.all(
    players.map(async player => {
      try {
        // Validação rigorosa dos pesos do jogador
        if (!player.weights || player.weights.length === 0) {
          throw new Error(`Jogador ${player.id} com pesos inválidos`);
        }

        // Log dos pesos do jogador para debug
        systemLogger.log('weights', `Pesos do Jogador #${player.id}`, {
          weightsLength: player.weights.length,
          weightsSample: player.weights.slice(0, 5),
          weightsSum: player.weights.reduce((a, b) => a + b, 0)
        });

        const currentDate = new Date();
        const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [currentDate]);
        
        if (!enrichedData || !enrichedData[0]) {
          throw new Error('Falha ao enriquecer dados de entrada');
        }

        // Ajustar o tamanho dos dados para corresponder ao shape do modelo
        const paddedData = new Array(inputShape).fill(0);
        for (let i = 0; i < enrichedData[0].length && i < inputShape; i++) {
          paddedData[i] = enrichedData[0][i] * (player.weights[i] / 1000); // Aplicando pesos normalizados
        }
        
        const inputTensor = tf.tensor2d([paddedData]);
        
        // Aplicar os pesos do jogador na camada de entrada
        const weightedInput = tf.mul(inputTensor, tf.tensor2d([player.weights.slice(0, inputShape)]));
        
        const prediction = trainedModel.predict(weightedInput) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());
        
        // Cleanup
        inputTensor.dispose();
        weightedInput.dispose();
        prediction.dispose();

        // Sistema de pontuação ponderada para cada número
        const weightedScores = new Array(25).fill(0).map((_, index) => {
          const baseProb = probabilities[index % probabilities.length];
          const weight = player.weights[index % player.weights.length];
          const historicalFreq = currentBoardNumbers.filter(n => n === index + 1).length;
          
          return {
            number: index + 1,
            score: (baseProb * weight * (1 + historicalFreq)) / 1000
          };
        });

        // Ordenar por pontuação e selecionar os 15 números mais promissores
        weightedScores.sort((a, b) => b.score - a.score);
        const selectedNumbers = weightedScores.slice(0, 15).map(ws => ws.number);

        // Log detalhado das previsões
        systemLogger.log('prediction', `Previsões geradas para Jogador #${player.id}`, {
          predictions: selectedNumbers,
          scores: weightedScores.slice(0, 15).map(ws => ws.score),
          weightsUsed: true,
          timestamp: new Date().toISOString()
        });

        return selectedNumbers.sort((a, b) => a - b);
      } catch (error) {
        systemLogger.error('prediction', `Erro na predição para Jogador #${player.id}:`, { error });
        throw error;
      }
    })
  );
}