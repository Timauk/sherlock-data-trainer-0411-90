export const saveTrainingHistory = async (modelId: string, metrics: any) => {
  try {
    const history = JSON.parse(localStorage.getItem('training-history') || '[]');
    history.push({
      model_id: modelId,
      metrics,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('training-history', JSON.stringify(history));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving training history:', error);
    return { success: false, error };
  }
};

export const getTrainingHistory = async (modelId: string) => {
  try {
    const history = JSON.parse(localStorage.getItem('training-history') || '[]');
    const filteredHistory = history.filter((item: any) => item.model_id === modelId);
    return { data: filteredHistory };
  } catch (error) {
    console.error('Error loading training history:', error);
    return { error };
  }
};