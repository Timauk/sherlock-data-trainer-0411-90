import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';
import { DataServices } from '@/services/dataServices';

interface PredictionConfig {
  lunarPhase: string;
  patterns: any;
  lunarPatterns: any;
}

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

export async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: PredictionConfig
): Promise<number[]> {
  try {
    const inputTensor = tf.tensor2d([inputData]);
    const rawPredictions = await model.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await rawPredictions.data());
    
    const weightedProbs = probabilities.map((prob, i) => ({
      number: i + 1,
      probability: prob * weights[i % weights.length]
    }));

    weightedProbs.sort((a, b) => b.probability - a.probability);

    const selectedNumbers = new Set<number>();
    let index = 0;
    
    while (selectedNumbers.size < 15 && index < weightedProbs.length) {
      const num = weightedProbs[index].number;
      if (num >= 1 && num <= 25) {
        selectedNumbers.add(num);
      }
      index++;
    }

    const result = Array.from(selectedNumbers).sort((a, b) => a - b);

    inputTensor.dispose();
    rawPredictions.dispose();

    return result;
  } catch (error) {
    systemLogger.error('prediction', 'Error making prediction', { error });
    throw error;
  }
}

export async function handlePlayerPredictions(
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  setNeuralNetworkVisualization: (viz: any) => void,
  config: PredictionConfig
) {
  systemLogger.log('game', 'Iniciando predições', {
    totalPlayers: players.length,
    modelLoaded: !!trainedModel,
    lunarPhase: config.lunarPhase
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
        const enrichedData = DataServices.enrichLotteryData([[...currentBoardNumbers]], [currentDate]);
        
        if (!enrichedData || !enrichedData[0]) {
          throw new Error('Falha ao enriquecer dados de entrada');
        }

        const paddedData = new Array(inputShape).fill(0);
        for (let i = 0; i < enrichedData[0].length && i < inputShape; i++) {
          paddedData[i] = enrichedData[0][i] * (player.weights[i] / 1000);
        }
        
        const inputTensor = tf.tensor2d([paddedData]);
        const weightedInput = tf.mul(inputTensor, tf.tensor2d([player.weights.slice(0, inputShape)]));
        const prediction = trainedModel.predict(weightedInput) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());
        
        inputTensor.dispose();
        weightedInput.dispose();
        prediction.dispose();

        const weightedScores = new Array(25).fill(0).map((_, index) => {
          const baseProb = probabilities[index % probabilities.length];
          const weight = player.weights[index % player.weights.length];
          const historicalFreq = currentBoardNumbers.filter(n => n === index + 1).length;
          
          return {
            number: index + 1,
            score: (baseProb * weight * (1 + historicalFreq)) / 1000
          };
        });

        weightedScores.sort((a, b) => b.score - a.score);
        const selectedNumbers = weightedScores.slice(0, 15).map(ws => ws.number);

        return selectedNumbers.sort((a, b) => a - b);
      } catch (error) {
        systemLogger.error('prediction', `Erro na predição para Jogador #${player.id}:`, { error });
        throw error;
      }
    })
  );
}
