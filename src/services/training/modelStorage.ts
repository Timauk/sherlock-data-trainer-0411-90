import { supabase } from '@/lib/supabase';
import * as tf from '@tensorflow/tfjs';
import type { Database } from '@/lib/database.types';

type Model = Database['public']['Tables']['models']['Row'];

export const saveModel = async (model: tf.LayersModel, name: string, metrics: any) => {
  try {
    const modelData = await model.save('localstorage://temp-model');
    const { error } = await supabase.from('models').insert({
      name,
      data: modelData,
      metrics,
      created_at: new Date().toISOString()
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving model:', error);
    return { success: false, error };
  }
};

export const loadModel = async (modelId: string) => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select()
      .eq('id', modelId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Model not found');

    const model = await tf.loadLayersModel('localstorage://temp-model');
    return { model, data };
  } catch (error) {
    console.error('Error loading model:', error);
    return { error };
  }
};