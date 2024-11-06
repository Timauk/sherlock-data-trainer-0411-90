import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';

export interface DataQualityResult {
  completeness: number;
  consistency: number;
  uniqueness: number;
  patternQuality: number;
}

export const getDataQualityDiagnostics = (data: number[][]): DataQualityResult => {
  const totalFields = data.length * (data[0]?.length || 0);
  const nonEmptyFields = data.flat().filter(n => n !== null && n !== undefined).length;
  
  const patterns = deepPatternAnalyzer.analyzePatterns(data);
  const patternStrength = patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length;
  
  const result = {
    completeness: totalFields > 0 ? nonEmptyFields / totalFields : 0,
    consistency: patternStrength,
    uniqueness: new Set(data.flat()).size / data.flat().length,
    patternQuality: patternStrength * (patterns.length / data.length)
  };

  systemLogger.log('diagnostic', 'Data Quality Diagnostic completed', result);
  return result;
};