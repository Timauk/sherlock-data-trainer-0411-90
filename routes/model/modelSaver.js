import path from 'path';
import fs from 'fs';
import { logger } from '../../src/utils/logging/logger.js';

export const saveModelToDirectory = async (model, modelDir, playersData, evolutionHistory) => {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    // Get model artifacts
    const artifacts = await model.save(tf.io.withSaveHandler(async (modelArtifacts) => {
      if (!modelArtifacts) {
        throw new Error('Model artifacts are null or undefined');
      }
      return modelArtifacts;
    }));

    // Save model files with validation
    if (!artifacts.modelTopology) {
      throw new Error('Model topology is missing from artifacts');
    }
    fs.writeFileSync(
      path.join(modelDir, 'model.json'),
      JSON.stringify(artifacts.modelTopology)
    );

    if (!artifacts.weightData) {
      throw new Error('Weight data is missing from artifacts');
    }
    fs.writeFileSync(
      path.join(modelDir, 'weights.bin'),
      Buffer.from(artifacts.weightData)
    );

    if (!artifacts.weightSpecs) {
      throw new Error('Weight specs are missing from artifacts');
    }
    fs.writeFileSync(
      path.join(modelDir, 'weight-specs.json'),
      JSON.stringify(artifacts.weightSpecs)
    );

    // Save metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      totalSamples: global.totalSamples || 0,
      playersData,
      evolutionHistory,
      modelSummary: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };

    fs.writeFileSync(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return { metadata, filesPath: modelDir };
  } catch (error) {
    logger.error('Error saving model:', error);
    throw error;
  }
};