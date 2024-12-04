import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';

export interface GameValidationResult {
  isValid: boolean;
  errors: string[];
  details: {
    csvData: boolean;
    champion: boolean;
    model: boolean;
    numbers: boolean;
  };
}

export const validateGameState = (
  csvData: number[][],
  champion: Player | undefined,
  trainedModel: any | null,
  numbers: number[][]
): GameValidationResult => {
  const errors: string[] = [];
  const details = {
    csvData: false,
    champion: false,
    model: false,
    numbers: false
  };

  // Validação do CSV
  if (!csvData || csvData.length === 0) {
    errors.push('CSV não carregado ou vazio');
  } else {
    details.csvData = true;
    // Valida estrutura do CSV
    const isValidStructure = csvData.every(row => 
      Array.isArray(row) && 
      row.length === 15 && 
      row.every(num => typeof num === 'number' && num >= 1 && num <= 25)
    );
    
    if (!isValidStructure) {
      errors.push('Estrutura do CSV inválida. Esperado: 15 números entre 1 e 25');
      details.csvData = false;
    }
  }

  // Validação do Campeão
  if (!champion) {
    errors.push('Campeão não selecionado');
  } else {
    if (!champion.id || !Array.isArray(champion.weights)) {
      errors.push('Estrutura do campeão inválida');
    } else {
      details.champion = true;
    }
  }

  // Validação do Modelo
  if (!trainedModel) {
    errors.push('Modelo não carregado');
  } else {
    details.model = true;
  }

  // Validação dos Números
  if (!numbers || numbers.length === 0) {
    errors.push('Números não inicializados');
  } else {
    details.numbers = true;
  }

  const isValid = errors.length === 0;

  // Log detalhado do estado
  systemLogger.log('validation', 'Estado do jogo validado', {
    isValid,
    details,
    errors
  });

  return {
    isValid,
    errors,
    details
  };
};

export const validateCsvStructure = (data: string): boolean => {
  const lines = data.trim().split('\n');
  if (lines.length < 2) return false; // Precisa ter pelo menos cabeçalho e uma linha

  const header = lines[0].split(',');
  if (header.length !== 17) return false; // Concurso,Data,15 bolas

  // Valida primeira linha de dados
  const firstDataLine = lines[1].split(',');
  if (firstDataLine.length !== 17) return false;

  // Valida formato das colunas
  const isValidConcurso = !isNaN(Number(firstDataLine[0]));
  const isValidDate = !isNaN(Date.parse(firstDataLine[1].split('/').reverse().join('-')));
  const isValidBolas = firstDataLine.slice(2).every(num => {
    const n = Number(num);
    return !isNaN(n) && n >= 1 && n <= 25;
  });

  return isValidConcurso && isValidDate && isValidBolas;
};