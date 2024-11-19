import { supabase } from '@/lib/supabase';

export const saveTrainingHistory = async (modelId: string, metrics: any) => {
  try {
    const { error } = await supabase.from('training_history').insert({
      model_id: modelId,
      metrics,
      created_at: new Date().toISOString()
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving training history:', error);
    return { success: false, error };
  }
};

export const getTrainingHistory = async (modelId: string) => {
  try {
    const result = supabase
      .from('training_history')
      .select()
      .eq('model_id', modelId);

    if (result.error) throw result.error;
    return { data: result.data };
  } catch (error) {
    console.error('Error loading training history:', error);
    return { error };
  }
};