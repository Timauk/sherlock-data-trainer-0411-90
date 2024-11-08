export const exportPredictionsToCSV = (
  predictions: Array<{ concurso: number, numbers: number[] }>,
  players: Array<{ id: number, predictions: number[] }>
) => {
  // Cabeçalho do CSV
  let csvContent = "Concurso,Data,Bola1,Bola2,Bola3,Bola4,Bola5,Bola6,Bola7,Bola8,Bola9,Bola10,Bola11,Bola12,Bola13,Bola14,Bola15\n";

  // Adiciona cada predição
  predictions.forEach(pred => {
    const date = new Date().toLocaleDateString('pt-BR'); // Data atual para predições
    const numbers = pred.numbers.map(n => n.toString().padStart(2, '0')).join(',');
    csvContent += `${pred.concurso},${date},${numbers}\n`;
  });

  // Cria e baixa o arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `predicoes_ia_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};