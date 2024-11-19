import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Add a GET route for loading the model
router.get('/', async (req, res) => {
  try {
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    
    // Check if base directory exists
    if (!fs.existsSync(baseModelDir)) {
      logger.error('Base model directory does not exist');
      return res.status(404).json({ error: 'No models directory found' });
    }

    // Get the latest model directory
    const modelDirs = fs.readdirSync(baseModelDir)
      .filter(dir => dir.startsWith('model-'))
      .sort((a, b) => {
        const timeA = parseInt(a.split('-')[1]);
        const timeB = parseInt(b.split('-')[1]);
        return timeB - timeA;
      });

    if (modelDirs.length === 0) {
      logger.error('No model directories found');
      return res.status(404).json({ error: 'No saved models found' });
    }

    const latestModelDir = path.join(baseModelDir, modelDirs[0]);
    logger.info(`Loading model from directory: ${latestModelDir}`);

    // Verify all required files exist
    const requiredFiles = ['model.json', 'weights.bin', 'weight-specs.json', 'metadata.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(latestModelDir, file);
      if (!fs.existsSync(filePath)) {
        logger.error(`Required file ${file} is missing`);
        return res.status(404).json({ error: `Required file ${file} is missing` });
      }
      if (fs.statSync(filePath).size === 0) {
        logger.error(`Required file ${file} is empty`);
        return res.status(400).json({ error: `Required file ${file} is empty` });
      }
    }

    // Load model files
    const modelJSON = JSON.parse(fs.readFileSync(path.join(latestModelDir, 'model.json'), 'utf8'));
    const weightSpecs = JSON.parse(fs.readFileSync(path.join(latestModelDir, 'weight-specs.json'), 'utf8'));
    const weightsBuffer = fs.readFileSync(path.join(latestModelDir, 'weights.bin'));
    const metadata = JSON.parse(fs.readFileSync(path.join(latestModelDir, 'metadata.json'), 'utf8'));

    // Create model artifacts
    const modelArtifacts = {
      modelTopology: modelJSON,
      weightSpecs: weightSpecs,
      weightData: weightsBuffer,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js',
      convertedBy: null
    };

    try {
      // Load the model from artifacts
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
      logger.info('Model loaded successfully');

      // Return success response with model info
      res.json({
        success: true,
        modelInfo: {
          timestamp: metadata.timestamp,
          layers: model.layers.length,
          totalParams: model.countParams(),
          metadata: metadata
        }
      });
    } catch (modelLoadError) {
      logger.error('Error loading model from artifacts:', modelLoadError);
      res.status(500).json({
        error: 'Failed to load model from artifacts',
        details: modelLoadError.message
      });
    }
  } catch (error) {
    logger.error('Error in load model route:', error);
    res.status(500).json({
      error: 'Failed to load model',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST route for saving model
router.post('/', async (req, res) => {
  try {
    const { playersData, evolutionHistory } = req.body;
    
    if (!playersData || !evolutionHistory) {
      const errorDetails = {
        missingPlayersData: !playersData,
        missingEvolutionHistory: !evolutionHistory
      };
      logger.warn('Missing required data for saving model', errorDetails);
      return res.status(400).json({ 
        error: 'Missing required data',
        details: errorDetails
      });
    }

    const model = await getOrCreateModel();
    if (!model) {
      logger.error('Failed to get or create model - model is null');
      throw new Error('Failed to get or create model');
    }

    // Create timestamped directory for this save
    const timestamp = Date.now();
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const modelDir = path.join(baseModelDir, `model-${timestamp}`);
    
    // Ensure directory exists
    if (!fs.existsSync(baseModelDir)) {
      fs.mkdirSync(baseModelDir, { recursive: true });
      logger.info(`Created base model directory: ${baseModelDir}`);
    }
    fs.mkdirSync(modelDir);
    logger.info(`Created model directory: ${modelDir}`);

    try {
      // Get model artifacts with detailed error handling
      logger.info('Starting model artifacts save process...');
      const artifacts = await model.save(tf.io.withSaveHandler(async (modelArtifacts) => {
        if (!modelArtifacts) {
          throw new Error('Model artifacts are null or undefined');
        }
        logger.info('Model artifacts generated successfully');
        return modelArtifacts;
      }));

      // Save model topology with validation
      logger.info('Saving model topology...');
      if (!artifacts.modelTopology) {
        throw new Error('Model topology is missing from artifacts');
      }
      fs.writeFileSync(
        path.join(modelDir, 'model.json'),
        JSON.stringify(artifacts.modelTopology)
      );

      // Save weights as binary file with validation
      logger.info('Saving weights binary...');
      if (!artifacts.weightData) {
        throw new Error('Weight data is missing from artifacts');
      }
      const weightsData = Buffer.from(artifacts.weightData);
      fs.writeFileSync(
        path.join(modelDir, 'weights.bin'),
        weightsData
      );

      // Save weight specs with validation
      logger.info('Saving weight specs...');
      if (!artifacts.weightSpecs) {
        throw new Error('Weight specs are missing from artifacts');
      }
      fs.writeFileSync(
        path.join(modelDir, 'weight-specs.json'),
        JSON.stringify(artifacts.weightSpecs)
      );

      // Save metadata with validation
      logger.info('Saving metadata...');
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

      // Verify files exist and have content
      const savedFiles = fs.readdirSync(modelDir);
      const filesWithSizes = savedFiles.map(file => ({
        name: file,
        size: fs.statSync(path.join(modelDir, file)).size
      }));
      
      logger.info('Files saved:', filesWithSizes);

      if (savedFiles.length === 0) {
        throw new Error('No files were created in the model directory');
      }

      // Verify each required file exists and has content
      const requiredFiles = ['model.json', 'weights.bin', 'weight-specs.json', 'metadata.json'];
      for (const file of requiredFiles) {
        const filePath = path.join(modelDir, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file ${file} is missing`);
        }
        if (fs.statSync(filePath).size === 0) {
          throw new Error(`Required file ${file} is empty`);
        }
      }

      res.json({
        success: true,
        modelPath: modelDir,
        savedFiles: filesWithSizes,
        timestamp: metadata.timestamp,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        }
      });
    } catch (saveError) {
      logger.error('Error during save operation:', saveError);
      throw new Error(`Failed to save model files: ${saveError.message}`);
    }
  } catch (error) {
    logger.error('Error in save model route:', error);
    res.status(500).json({
      error: 'Failed to save model',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as storageRouter };