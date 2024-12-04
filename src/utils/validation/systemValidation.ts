import { Player, Champion } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';

export interface SystemValidationResult {
  isValid: boolean;
  missingItems: string[];
  details: {
    csvLoaded: boolean;
    championValid: boolean;
    numbersValid: boolean;
    modelLoaded: boolean;
  };
}

export function validateSystemState(
  csvData: number[][],
  champion: Champion | null,
  trainedModel: any | null,
  numbers: number[][]
): SystemValidationResult {
  const missingItems: string[] = [];
  const details = {
    csvLoaded: false,
    championValid: false,
    numbersValid: false,
    modelLoaded: false
  };

  // CSV Validation
  if (!csvData || csvData.length === 0) {
    missingItems.push('CSV não carregado');
  } else {
    const isValidStructure = csvData.every(row => 
      Array.isArray(row) && 
      row.length === 15 && 
      row.every(num => typeof num === 'number' && num >= 1 && num <= 25)
    );
    
    if (!isValidStructure) {
      missingItems.push('Estrutura do CSV inválida');
    } else {
      details.csvLoaded = true;
    }
  }

  // Champion Validation
  if (!champion || !champion.player) {
    missingItems.push('Campeão não selecionado');
  } else if (!champion.player.id || !Array.isArray(champion.player.weights)) {
    missingItems.push('Estrutura do campeão inválida');
  } else {
    details.championValid = true;
  }

  // Numbers Validation
  if (!numbers || numbers.length === 0) {
    missingItems.push('Números não inicializados');
  } else {
    details.numbersValid = true;
  }

  // Model Validation
  if (!trainedModel) {
    missingItems.push('Modelo não carregado');
  } else {
    details.modelLoaded = true;
  }

  const isValid = missingItems.length === 0;

  logSystemStatus({
    champion,
    numbers,
    trainedModel,
    csvData,
    details,
    missingItems
  });

  return {
    isValid,
    missingItems,
    details
  };
}

function logSystemStatus(status: {
  champion: Champion | null;
  numbers: number[][];
  trainedModel: any;
  csvData: number[][];
  details: Record<string, boolean>;
  missingItems: string[];
}) {
  systemLogger.log('system', '=== STATUS DO SISTEMA ===', {
    championStatus: {
      available: !!status.champion,
      id: status.champion?.player?.id ?? 'N/A',
      weightsLength: status.champion?.player?.weights?.length ?? 0
    },
    numbersStatus: {
      available: status.numbers.length > 0,
      count: status.numbers.length
    },
    modelStatus: {
      loaded: !!status.trainedModel
    },
    csvStatus: {
      loaded: status.csvData.length > 0,
      recordCount: status.csvData.length
    },
    validationDetails: status.details,
    missingItems: status.missingItems
  });
}