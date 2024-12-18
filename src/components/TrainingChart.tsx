import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrainingLog {
  epoch: number;
  loss: number;
  val_loss: number;
}

interface TrainingChartProps {
  logs: TrainingLog[];
}

const TrainingChart: React.FC<TrainingChartProps> = ({ logs }) => {
  const data = {
    labels: logs.map(log => log.epoch),
    datasets: [
      {
        label: 'Loss',
        data: logs.map(log => log.loss),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Validation Loss',
        data: logs.map(log => log.val_loss),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Perda de Treinamento e Validação',
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default TrainingChart;