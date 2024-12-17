import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as tf from '@tensorflow/tfjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const initTensorFlow = async () => {
  try {
    await tf.ready();
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow:', error);
    return false;
  }
};