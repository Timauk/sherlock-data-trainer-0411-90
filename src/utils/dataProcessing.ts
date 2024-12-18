export function processarCSV(text: string): number[][] {
  const linhas = text.trim().split("\n").slice(1); // Ignorar cabeçalho
  const dados: number[][] = [];

  for (const linha of linhas) {
    const valores = linha.split(",");
    const bolas = valores.slice(2, 17).map(Number);  // Pegando apenas os números das bolas

    if (bolas.length === 15 && bolas.every(num => !isNaN(num))) {
      dados.push(bolas);
    }
  }

  if (dados.length === 0) {
    throw new Error("Nenhum dado válido encontrado!");
  }

  return dados;
}

// Função mantida para outros usos que precisem dos dados normalizados
export function normalizarDados(dados: number[][]) {
  return dados.map(bolas => 
    bolas.map(bola => bola / 25) // Normaliza as bolas para valores entre 0 e 1
  );
}