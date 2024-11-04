import * as tf from '@tensorflow/tfjs';

type ToastFunction = {
  toast: {
    (props: { title: string; description: string; variant?: "default" | "destructive" }): void;
  };
};

export const saveCheckpoint = async (data: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/checkpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        modelState: data.trainedModel ? await data.trainedModel.save('indexeddb://checkpoint-model') : null,
        players: data.players || [],
        evolutionData: data.evolutionData || [],
        generation: data.generation || 0,
        trainingHistory: data.trainingHistory || [],
        frequencyAnalysis: data.frequencyAnalysis || {},
        lunarAnalysis: data.lunarAnalysis || {},
        predictions: data.predictions || [],
        scores: data.scores || [],
        championData: data.championData || null
      })
    });
    
    const result = await response.json();
    return result.filename;
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadLastCheckpoint = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/checkpoint/latest');
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erro ao carregar checkpoint');
    }
    
    const checkpoint = await response.json();
    
    // Carregar o modelo do IndexedDB se existir
    if (checkpoint.modelState) {
      try {
        const model = await tf.loadLayersModel('indexeddb://checkpoint-model');
        checkpoint.trainedModel = model;
      } catch (error) {
        console.error('Erro ao carregar modelo do IndexedDB:', error);
      }
    }
    
    return checkpoint;
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};

export const createSelectDirectory = (toastFn: ToastFunction) => {
  return async (): Promise<string> => {
    try {
      const defaultPath = './checkpoints';
      toastFn.toast({
        title: "Servidor Local Configurado",
        description: "Os checkpoints serão salvos na pasta 'checkpoints' do servidor",
      });
      return defaultPath;
    } catch (error) {
      console.error('Erro ao configurar armazenamento:', error);
      if (error instanceof Error) {
        toastFn.toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
    }
  };
};