import { Player } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  console.log('Starting prediction with input:', {
    inputData,
    weights: weights.slice(0, 5), // Log first 5 weights for visibility
    weightsLength: weights.length,
    lunarPhase: config.lunarPhase
  });

  try {
    // Enrich input data with features
    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    console.log('Data enrichment complete:', {
      originalLength: inputData.length,
      enrichedLength: enrichedData[0].length,
      sampleEnrichedData: enrichedData[0].slice(0, 5)
    });

    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Create padded data array
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    console.log('Tensor preparation:', {
      paddedLength: paddedData.length,
      nonZeroCount: paddedData.filter(x => x !== 0).length,
      firstFewValues: paddedData.slice(0, 5)
    });

    // Create tensor and make prediction
    const inputTensor = tf.tensor2d([paddedData]);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawResult = Array.from(await predictions.data());

    console.log('Raw model output:', {
      resultLength: rawResult.length,
      sampleOutput: rawResult.slice(0, 5),
      min: Math.min(...rawResult),
      max: Math.max(...rawResult)
    });

    // Cleanup tensors
    inputTensor.dispose();
    predictions.dispose();

    // Apply weights and convert to valid numbers
    const weightedResult = rawResult.map((value, index) => {
      const weight = weights[index % weights.length];
      const weightedValue = value * weight;
      // Scale to 1-25 range
      const scaledValue = Math.max(1, Math.min(25, Math.round(weightedValue * 25)));
      
      console.log(`Processing prediction ${index}:`, {
        originalValue: value,
        weight,
        weightedValue,
        finalValue: scaledValue
      });

      return scaledValue;
    });

    // Ensure we have exactly 15 unique numbers
    const uniqueNumbers = Array.from(new Set(weightedResult))
      .slice(0, 15)
      .sort((a, b) => a - b);

    // If we don't have enough unique numbers, add more
    while (uniqueNumbers.length < 15) {
      const newNum = Math.floor(Math.random() * 25) + 1;
      if (!uniqueNumbers.includes(newNum)) {
        uniqueNumbers.push(newNum);
      }
    }

    console.log('Final prediction:', {
      numbers: uniqueNumbers,
      originalWeightedLength: weightedResult.length,
      uniqueCount: uniqueNumbers.length
    });

    return uniqueNumbers;
  } catch (error) {
    console.error('Prediction error:', error);
    systemLogger.error('prediction', 'Error in prediction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputDataState: inputData.length,
      weightsState: weights.length,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: LunarData
) => {
  console.log('Starting predictions for players:', {
    playerCount: players.length,
    samplePlayer: {
      id: players[0]?.id,
      weights: players[0]?.weights.slice(0, 5)
    },
    currentBoardNumbers
  });

  return Promise.all(
    players.map(async player => {
      console.log(`Processing player #${player.id}:`, {
        weights: player.weights.slice(0, 5),
        fitness: player.fitness,
        previousPredictions: player.predictions
      });

      try {
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights,
          { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
        );

        // Additional analysis
        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        
        // Record prediction for monitoring
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        console.log(`Prediction complete for Player #${player.id}:`, {
          prediction,
          matches: prediction.filter(num => currentBoardNumbers.includes(num)).length
        });

        return prediction;
      } catch (error) {
        console.error(`Error predicting for player #${player.id}:`, error);
        throw error;
      }
    })
  );
};