import * as tf from '@tensorflow/tfjs';
import { logger } from '../../src/utils/logging/logger.js';
import path from 'path';
import fs from 'fs';

export const loadModelFromDirectory = async (modelDir) => {
  try {
    // Verify all required files exist
    const requiredFiles = ['model.json', 'weights.bin', 'weight-specs.json', 'metadata.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(modelDir, file);
      if (!fs.existsSync(filePath)) {
        const error = new Error(`Required file ${file} is missing`);
        logger.error('Model loading error:', error);
        throw error;
      }
      if (fs.statSync(filePath).size === 0) {
        const error = new Error(`Required file ${file} is empty`);
        logger.error('Model loading error:', error);
        throw error;
      }
    }

    // Load and validate model files
    const modelJSON = JSON.parse(fs.readFileSync(path.join(modelDir, 'model.json'), 'utf8'));
    const weightSpecs = JSON.parse(fs.readFileSync(path.join(modelDir, 'weight-specs.json'), 'utf8'));
    const weightsBuffer = fs.readFileSync(path.join(modelDir, 'weights.bin'));
    const metadata = JSON.parse(fs.readFileSync(path.join(modelDir, 'metadata.json'), 'utf8'));

    // Validate weight specs
    if (!Array.isArray(weightSpecs) || weightSpecs.length === 0) {
      const error = new Error('Invalid weight specs format');
      logger.error('Model loading error:', error);
      throw error;
    }

    // Calculate expected total values
    const totalValues = weightSpecs.reduce((sum, spec) => {
      const shapeSize = spec.shape.reduce((a, b) => a * b, 1);
      return sum + shapeSize;
    }, 0);

    // Validate weights buffer size
    const expectedBufferSize = totalValues * 4; // 4 bytes per float32
    if (weightsBuffer.length !== expectedBufferSize) {
      const error = new Error(`Invalid weights buffer size. Expected ${expectedBufferSize} bytes but got ${weightsBuffer.length}`);
      logger.error('Model loading error:', error);
      throw error;
    }

    // Create and validate model artifacts
    const modelArtifacts = {
      modelTopology: modelJSON,
      weightSpecs: weightSpecs,
      weightData: weightsBuffer,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js',
      convertedBy: null
    };

    // Validate model topology
    if (!modelArtifacts.modelTopology || !modelArtifacts.modelTopology.model_config) {
      const error = new Error('Invalid model topology');
      logger.error('Model loading error:', error);
      throw error;
    }

    // Load and validate the model
    const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
    
    if (!model || !model.layers || model.layers.length === 0) {
      const error = new Error('Invalid model structure');
      logger.error('Model loading error:', error);
      throw error;
    }

    // Validate input shape
    const inputShape = model.inputs[0].shape;
    if (!inputShape || inputShape[1] !== 17) {
      const error = new Error(`Invalid input shape: expected [..., 17] but got ${inputShape}`);
      logger.error('Model loading error:', error);
      throw error;
    }

    logger.info('Model loaded successfully');
    return { model, metadata };
  } catch (error) {
    logger.error('Error loading model:', error);
    throw error;
  }
};

export const findLatestModelDir = (baseModelDir) => {
  if (!fs.existsSync(baseModelDir)) {
    const error = new Error('Base model directory does not exist');
    logger.error('Model loading error:', error);
    throw error;
  }

  const modelDirs = fs.readdirSync(baseModelDir)
    .filter(dir => dir.startsWith('model-'))
    .sort((a, b) => {
      const timeA = parseInt(a.split('-')[1]);
      const timeB = parseInt(b.split('-')[1]);
      return timeB - timeA;
    });

  if (modelDirs.length === 0) {
    const error = new Error('No saved models found');
    logger.error('Model loading error:', error);
    throw error;
  }

  return path.join(baseModelDir, modelDirs[0]);
};