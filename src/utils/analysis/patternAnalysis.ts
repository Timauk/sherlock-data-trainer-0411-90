/**
 * @fileoverview Análise de padrões com sistema de cache
 * 
 * Este módulo implementa diferentes tipos de análise de padrões,
 * incluindo consistência, variabilidade e scores gerais.
 */

import NodeCache from 'node-cache';

/**
 * Cache para armazenar resultados de análises de padrões
 * TTL de 1 hora e verificação a cada 2 minutos
 */
const patternCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

/**
 * Calcula o score de padrão para um número específico
 * @param number Número para análise
 * @param patterns Objeto contendo padrões identificados
 * @returns Score calculado para o número
 */
export const calculatePatternScore = (number: number, patterns: any): number => {
  const cacheKey = `pattern-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  if (!patterns) return 0;
  
  // Análise de padrões consecutivos e paridade
  const { consecutive, evenOdd } = patterns;
  const isEven = number % 2 === 0;
  
  const score = (consecutive * 0.5) + (isEven ? evenOdd : (1 - evenOdd)) * 0.5;
  patternCache.set(cacheKey, score);
  return score;
};

/**
 * Calcula o score de consistência para um número
 * @param number Número para análise
 * @param patterns Objeto contendo padrões identificados
 * @returns Score de consistência
 */
export const calculateConsistencyScore = (number: number, patterns: any): number => {
  const cacheKey = `consistency-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  const score = 0.5; // Implementação base de consistência
  patternCache.set(cacheKey, score);
  return score;
};

/**
 * Calcula o score de variabilidade para um número
 * @param number Número para análise
 * @param patterns Objeto contendo padrões identificados
 * @returns Score de variabilidade
 */
export const calculateVariabilityScore = (number: number, patterns: any): number => {
  const cacheKey = `variability-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  const score = 0.5; // Implementação base de variabilidade
  patternCache.set(cacheKey, score);
  return score;
};