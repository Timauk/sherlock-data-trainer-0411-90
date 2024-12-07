import { systemLogger } from '../logging/systemLogger';

export interface SystemValidationResult {
  isValid: boolean;
  missingItems: string[];
  details: {
    csvLoaded: boolean;
    modelLoaded: boolean;
  };
}

export function validateSystemState(
  csvData: number[][],
  trainedModel: any | null
): SystemValidationResult {
  const missingItems: string[] = [];
  const details = {
    csvLoaded: false,
    modelLoaded: false
  };

  // Validação básica do CSV
  if (!csvData || csvData.length === 0) {
    missingItems.push('CSV não carregado');
  } else {
    details.csvLoaded = true;
  }

  // Validação básica do modelo
  if (!trainedModel) {
    missingItems.push('Modelo não carregado');
  } else {
    details.modelLoaded = true;
  }

  const isValid = missingItems.length === 0;

  systemLogger.log('system', 'Status do Sistema', {
    csvStatus: details.csvLoaded ? 'Carregado' : 'Não carregado',
    modelStatus: details.modelLoaded ? 'Carregado' : 'Não carregado',
    missingItems: missingItems
  });

  return {
    isValid,
    missingItems,
    details
  };
}