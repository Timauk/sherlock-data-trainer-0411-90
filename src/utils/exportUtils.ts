export const exportPredictionsToCSV = (
  predictions: Array<{ concurso: number, numbers: number[] }>,
  players: Array<{ id: number, predictions: number[] }>
) => {
  // Cabeçalho do CSV com informações mais detalhadas
  let csvContent = "Concurso,Data,Jogador,Bola1,Bola2,Bola3,Bola4,Bola5,Bola6,Bola7,Bola8,Bola9,Bola10,Bola11,Bola12,Bola13,Bola14,Bola15,Acertos\n";

  // Adiciona cada predição com informações do jogador
  predictions.forEach(pred => {
    const date = new Date().toLocaleDateString('pt-BR');
    
    // Para cada jogador que fez previsões neste concurso
    players.forEach(player => {
      if (player.predictions && player.predictions.length === 15) {
        const numbers = player.predictions.map(n => n.toString().padStart(2, '0')).join(',');
        const matches = player.predictions.filter(n => pred.numbers.includes(n)).length;
        csvContent += `${pred.concurso},${date},Jogador ${player.id},${numbers},${matches}\n`;
      }
    });
  });

  // Cria e baixa o arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `historico_jogos_ia_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};