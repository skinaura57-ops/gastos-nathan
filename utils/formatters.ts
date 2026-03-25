export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

export function formatMesAno(mesStr: string): string {
  const [year, month] = mesStr.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

export function getMesAtual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
