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
      systemLogger.error('model', 'Modelo não compilado');
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    }

    // Teste com shape correto
    const testTensor = tf.zeros([1, 13072]);
    try {
      const testPred = model.predict(testTensor) as tf.Tensor;
      testPred.dispose();
      testTensor.dispose();
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

  return Promise.all(
    players.map(async player => {
      try {
        const currentDate = new Date();
        const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [currentDate]);
        
        if (!enrichedData || !enrichedData[0]) {
          throw new Error('Falha ao enriquecer dados de entrada');
        }

        // Garantir padding correto para 13072 features
        const paddedData = new Array(13072).fill(0);
        for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
          paddedData[i] = enrichedData[0][i];
        }
        
        const inputTensor = tf.tensor2d([paddedData]);
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();

        return result.map(n => Math.round(n * 24) + 1);
      } catch (error) {
        systemLogger.error('prediction', `Erro na predição para Jogador #${player.id}:`, { error });
        throw error;
      }
    })
  );
}