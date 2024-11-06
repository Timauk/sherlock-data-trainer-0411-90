import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';

export interface DataQualityResult {
  completeness: number;
  consistency: number;
  uniqueness: number;
  patternQuality: number;
}

export const getDataQualityDiagnostics = async (data: number[][]): Promise<DataQualityResult> => {
  const totalFields = data.length * (data[0]?.length || 0);
  const nonEmptyFields = data.flat().filter(n => n !== null && n !== undefined).length;
  
  const patterns = await deepPatternAnalyzer.analyzePatterns(data);
  const patternStrength = patterns.reduce((acc, p) => acc + p.confidence, 0) / Math.max(patterns.length, 1);
  
  const result = {
    completeness: totalFields > 0 ? nonEmptyFields / totalFields : 0,
    consistency: patternStrength,
    uniqueness: new Set(data.flat()).size / Math.max(data.flat().length, 1),
    patternQuality: patternStrength * (patterns.length / Math.max(data.length, 1))
  };

  systemLogger.log('system', 'Data Quality Diagnostic completed', result);
  return result;
};