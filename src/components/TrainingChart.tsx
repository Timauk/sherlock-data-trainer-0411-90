import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { systemLogger } from '@/utils/logging/systemLogger';

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
  if (!logs || logs.length === 0) {
    systemLogger.warn('training', 'Tentativa de renderizar gráfico sem dados');
    return null;
  }

  // Log para debug
  systemLogger.log('training', 'Dados recebidos para o gráfico', {
    numberOfLogs: logs.length,
    firstLog: logs[0],
    lastLog: logs[logs.length - 1]
  });

  const datasets = [
    {
      label: 'Perda',
      data: logs.map(log => log.loss),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      tension: 0.1
    },
    {
      label: 'Perda na Validação',
      data: logs.map(log => log.val_loss),
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      tension: 0.1
    }
  ];

  // Adiciona métricas de precisão se disponíveis
  if (logs[0].accuracy !== undefined) {
    datasets.push({
      label: 'Precisão',
      data: logs.map(log => log.accuracy),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
    });
  }

  if (logs[0].val_accuracy !== undefined) {
    datasets.push({
      label: 'Precisão na Validação',
      data: logs.map(log => log.val_accuracy),
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      tension: 0.1
    });
  }

  const data = {
    labels: logs.map(log => `Época ${log.epoch}`),
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Métricas de Treinamento',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          display: true,
          borderDash: [] as number[],
          drawOnChartArea: true,
          drawTicks: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        type: 'category' as const,
        display: true,
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="w-full h-[400px] p-4">
      <Line data={data} options={options} />
    </div>
  );
};

export default TrainingChart;