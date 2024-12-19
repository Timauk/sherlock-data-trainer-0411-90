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
  accuracy?: number;
  val_accuracy?: number;
}

interface TrainingChartProps {
  logs: TrainingLog[];
}

const TrainingChart: React.FC<TrainingChartProps> = ({ logs }) => {
  const data = {
    labels: logs.map(log => log.epoch),
    datasets: [
      {
        label: 'Perda',
        data: logs.map(log => log.loss),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Perda na Validação',
        data: logs.map(log => log.val_loss),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      ...(logs[0].accuracy ? [{
        label: 'Precisão',
        data: logs.map(log => log.accuracy),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }] : []),
      ...(logs[0].val_accuracy ? [{
        label: 'Precisão na Validação',
        data: logs.map(log => log.val_accuracy),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      }] : [])
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
        text: 'Métricas de Treinamento',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={data} options={options} />;
};

export default TrainingChart;