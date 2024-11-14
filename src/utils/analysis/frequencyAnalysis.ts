/**
 * @fileoverview Sistema de análise de frequência com cache
 * 
 * Este módulo implementa análise de frequência dos números com sistema de cache
 * para otimizar o desempenho em cálculos repetitivos.
 */

import NodeCache from 'node-cache';

/**
 * Cache para armazenar resultados de análises frequentes
 * TTL (Time To Live) de 1 hora e verificação a cada 2 minutos
 */
const frequencyCache = new NodeCache({ 
  stdTTL: 3600, // 1 hora
  checkperiod: 120 // 2 minutos
});

/**
 * Calcula a análise de frequência dos números com suporte a cache
 * @param numbers Array bidimensional de números para análise
 * @returns Objeto com as frequências normalizadas de cada número
 */
export const calculateFrequencyAnalysis = (numbers: number[][]): Record<number, number> => {
  const cacheKey = JSON.stringify(numbers);
  const cachedResult = frequencyCache.get(cacheKey);
  
  // Retorna resultado em cache se disponível
  if (cachedResult) {
    return cachedResult as Record<number, number>;
  }

  // Calcula frequências se não estiver em cache
  const frequency: Record<number, number> = {};
  const totalGames = numbers.length;
  
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  
  // Normaliza as frequências
  Object.keys(frequency).forEach(key => {
    frequency[Number(key)] = frequency[Number(key)] / totalGames;
  });
  
  // Armazena em cache e retorna
  frequencyCache.set(cacheKey, frequency);
  return frequency;
};