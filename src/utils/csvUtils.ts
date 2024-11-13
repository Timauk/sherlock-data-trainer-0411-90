export function processCSV(text: string): number[][] {
  const lines = text.trim().split('\n');
  // Skip the header row
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const values = line.split(',');
    // Extract only the ball numbers (indexes 2 to 16)
    const ballNumbers = values.slice(2, 17).map(Number);
    if (ballNumbers.length !== 15 || ballNumbers.some(isNaN)) {
      console.error('Invalid line in CSV:', line);
      return [];
    }
    return ballNumbers;
  }).filter(numbers => numbers.length === 15);
}

export function extractDateFromCSV(text: string): Date[] {
  const lines = text.trim().split('\n');
  // Skip the header row
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const values = line.split(',');
    // Extract the date (index 1) and parse it
    const [day, month, year] = values[1].split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
  });
}