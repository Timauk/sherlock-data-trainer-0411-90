export interface TrainingLog {
  epoch: number;
  loss: number;
  val_loss: number;
  accuracy?: number;
  val_accuracy?: number;
}

export interface ValidationMetrics {
  accuracy: number;
  loss: number;
}