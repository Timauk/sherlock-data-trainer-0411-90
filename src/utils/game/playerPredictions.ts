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
      testPred.dispose();
      testTensor.dispose();
      
      systemLogger.log('model', 'Validação do modelo bem sucedida', {
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape
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
        if (!player.weights || player.weights.length === 0) {
          throw new Error(`Jogador ${player.id} com pesos inválidos`);
        }

        const currentDate = new Date();
        const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [currentDate]);
        
        if (!enrichedData || !enrichedData[0]) {
          throw new Error('Falha ao enriquecer dados de entrada');
        }

        // Ajustar o tamanho dos dados para corresponder ao shape do modelo
        const paddedData = new Array(inputShape).fill(0);
        for (let i = 0; i < enrichedData[0].length && i < inputShape; i++) {
          paddedData[i] = enrichedData[0][i];
        }
        
        const inputTensor = tf.tensor2d([paddedData]);
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();

        // Gerar números baseados nas probabilidades e pesos do jogador
        const weightedProbs = new Array(25).fill(0).map((_, index) => ({
          number: index + 1,
          probability: probabilities[index % probabilities.length] * player.weights[index % player.weights.length]
        }));

        // Ordenar por probabilidade e selecionar os 15 números mais prováveis
        weightedProbs.sort((a, b) => b.probability - a.probability);
        const selectedNumbers = weightedProbs.slice(0, 15).map(wp => wp.number);

        systemLogger.log('prediction', `Previsões geradas para Jogador #${player.id}`, {
          predictions: selectedNumbers,
          probabilities: weightedProbs.slice(0, 15).map(wp => wp.probability)
        });

        return selectedNumbers.sort((a, b) => a - b);
      } catch (error) {
        systemLogger.error('prediction', `Erro na predição para Jogador #${player.id}:`, { error });
        throw error;
      }
    })
  );
}