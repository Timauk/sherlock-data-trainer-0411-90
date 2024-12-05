import * as tf from '@tensorflow/tfjs';
import path from 'path';
import { FileManager } from './fileManager';
import { logger } from '../../utils/logging/logger.js';
import fs from 'fs';

interface WeightData {
  name: string;
  tensor: tf.Tensor;
}

type OptimizerDType = "string" | "float32" | "int32" | "bool" | "complex64";

interface OptimizerWeightSpecs {
  name: string;
  shape: number[];
  dtype: OptimizerDType;
}

export class ModelManager {
  constructor(private fileManager: FileManager) {}

  async saveModel(model: tf.LayersModel, checkpointDir: string) {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    
    // Save optimizer state
    const optimizerState = await model.optimizer?.getWeights();
    if (optimizerState) {
      const optimizerBuffer = await tf.io.encodeWeights(optimizerState);
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'optimizer_state.bin'),
        optimizerBuffer.data,
        true
      );
    }
    
    logger.debug('Modelo e otimizador salvos com sucesso', {
      modelPath,
      optimizerState: !!optimizerState
    });
  }

  async loadModel(checkpointDir: string): Promise<tf.LayersModel | null> {
    try {
      const modelPath = path.join(checkpointDir, 'model');
      if (!fs.existsSync(`${modelPath}.json`)) {
        logger.error('Arquivo do modelo não encontrado', { modelPath });
        return null;
      }

      // Log model structure before loading
      const modelJSON = JSON.parse(fs.readFileSync(`${modelPath}.json`, 'utf8'));
      logger.debug('Estrutura do modelo a ser carregado:', {
        config: modelJSON.config,
        weightsManifest: modelJSON.weightsManifest
      });

      const model = await tf.loadLayersModel(`file://${modelPath}`);
      
      // Log loaded model structure
      logger.debug('Modelo carregado:', {
        layers: model.layers.length,
        layerConfigs: model.layers.map(l => ({
          className: l.getClassName(),
          config: l.getConfig()
        }))
      });
      
      // Load optimizer state if available
      const optimizerBuffer = await this.fileManager.readFile(
        path.join(checkpointDir, 'optimizer_state.bin'),
        true
      );
      
      if (optimizerBuffer && model.optimizer) {
        const config = model.optimizer.getConfig();
        const weightSpecs = config?.weightSpecs as unknown as OptimizerWeightSpecs[];
        
        if (weightSpecs && weightSpecs.length > 0) {
          try {
            const weights = tf.io.decodeWeights(optimizerBuffer, weightSpecs as tf.io.WeightsManifestEntry[]);
            const weightList: WeightData[] = Object.entries(weights).map(([name, tensor]) => ({
              name,
              tensor: tensor as tf.Tensor
            }));
            await model.optimizer.setWeights(weightList);
            logger.debug('Estado do otimizador carregado com sucesso');
          } catch (error) {
            logger.error('Erro ao carregar estado do otimizador:', { error });
          }
        }
      }
      
      return model;
    } catch (error) {
      logger.error('Erro ao carregar modelo:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        checkpointDir
      });
      return null;
    }
  }
}