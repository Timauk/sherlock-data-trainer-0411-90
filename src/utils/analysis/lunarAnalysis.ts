/**
 * @fileoverview Análise de influência lunar com sistema de cache
 * 
 * Este módulo implementa cálculos de peso baseados nas fases lunares,
 * utilizando cache para otimizar consultas frequentes.
 */

import NodeCache from 'node-cache';

/**
 * Cache para armazenar pesos lunares calculados
 * TTL de 1 hora e verificação a cada 2 minutos
 */
const lunarCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

/**
 * Calcula o peso de um número baseado na fase lunar
 * @param number Número para análise
 * @param phase Fase lunar atual
 * @returns Peso calculado para o número
 */
export const getLunarNumberWeight = (number: number, phase: string): number => {
  const cacheKey = `${number}-${phase}`;
  const cachedWeight = lunarCache.get(cacheKey);
  
  // Retorna peso em cache se disponível
  if (cachedWeight) {
    return cachedWeight as number;
  }

  // Pesos definidos para cada fase lunar
  const phaseWeights: Record<string, number> = {
    'Nova': 0.8,      // Lua Nova - influência reduzida
    'Crescente': 1.2, // Lua Crescente - influência aumentada
    'Cheia': 1.0,     // Lua Cheia - influência normal
    'Minguante': 0.9  // Lua Minguante - influência levemente reduzida
  };
  
  // Calcula peso, armazena em cache e retorna
  const weight = phaseWeights[phase] || 1.0;
  lunarCache.set(cacheKey, weight);
  return weight;
};