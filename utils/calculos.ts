import { Config, GastoFixo, GastoVariavel, LancamentoPix, LancamentoCaixinha } from '@/types';

export function calcularTotalFixosPagos(fixos: GastoFixo[]): number {
  return fixos.filter(f => f.pago && f.ativo).reduce((sum, f) => sum + f.valor, 0);
}

export function calcularTotalFixos(fixos: GastoFixo[]): number {
  return fixos.filter(f => f.ativo).reduce((sum, f) => sum + f.valor, 0);
}

export function calcularTotalVariaveis(variaveis: GastoVariavel[]): number {
  return variaveis.reduce((sum, g) => sum + g.valor, 0);
}

export function calcularTotalPixEntradas(pix: LancamentoPix[]): number {
  return pix.filter(p => p.tipo === 'entrada').reduce((sum, p) => sum + p.valor, 0);
}

export function calcularTotalPixSaidas(pix: LancamentoPix[]): number {
  return pix.filter(p => p.tipo === 'saida').reduce((sum, p) => sum + p.valor, 0);
}

export function calcularSaldoCaixinha(base: number, lancamentos: LancamentoCaixinha[]): number {
  return lancamentos.reduce((saldo, l) => {
    return l.tipo === 'entrada' ? saldo + l.valor : saldo - l.valor;
  }, base);
}

export function calcularTotalGasto(
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  pix: LancamentoPix[]
): number {
  return calcularTotalFixos(fixos) + calcularTotalVariaveis(variaveis) + calcularTotalPixSaidas(pix);
}

export function calcularSaldoDisponivel(
  salario: number,
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  pix: LancamentoPix[]
): number {
  const totalGasto = calcularTotalGasto(fixos, variaveis, pix);
  const entradasPix = calcularTotalPixEntradas(pix);
  return salario - totalGasto + entradasPix;
}

export function calcularGastosPorCategoria(
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  pix: LancamentoPix[]
): Record<string, number> {
  const porCategoria: Record<string, number> = {};

  fixos.filter(f => f.ativo).forEach(f => {
    porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + f.valor;
  });

  variaveis.forEach(g => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.valor;
  });

  pix.filter(p => p.tipo === 'saida' && p.categoria).forEach(p => {
    porCategoria[p.categoria!] = (porCategoria[p.categoria!] || 0) + p.valor;
  });

  return porCategoria;
}

export function calcularGastosPorFormaPagamento(
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  pix: LancamentoPix[]
): Record<string, number> {
  const porForma: Record<string, number> = {};

  fixos.filter(f => f.ativo).forEach(f => {
    const label = f.formaPagamento === 'credito' ? 'Credito' : f.formaPagamento === 'debito' ? 'Debito' : f.formaPagamento === 'pix' ? 'PIX' : 'Dinheiro';
    porForma[label] = (porForma[label] || 0) + f.valor;
  });

  variaveis.forEach(g => {
    const label = g.formaPagamento === 'credito' ? 'Credito' : g.formaPagamento === 'debito' ? 'Debito' : g.formaPagamento === 'pix' ? 'PIX' : 'Dinheiro';
    porForma[label] = (porForma[label] || 0) + g.valor;
  });

  pix.filter(p => p.tipo === 'saida').forEach(p => {
    porForma['PIX'] = (porForma['PIX'] || 0) + p.valor;
  });

  return porForma;
}

export function calcularPercentualLimite(
  gasto: number,
  limite: { tipo: 'fixo' | 'percentual'; valor: number },
  salario: number
): number {
  const limiteValor = limite.tipo === 'fixo' ? limite.valor : (salario * limite.valor) / 100;
  if (limiteValor === 0) return 0;
  return (gasto / limiteValor) * 100;
}

export function getLimiteValor(
  limite: { tipo: 'fixo' | 'percentual'; valor: number } | undefined,
  salario: number
): number {
  if (!limite) return 0;
  return limite.tipo === 'fixo' ? limite.valor : (salario * limite.valor) / 100;
}
