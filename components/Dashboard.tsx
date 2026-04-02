'use client';

import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Config, GastoFixo, GastoVariavel, LancamentoPix, LancamentoCaixinha } from '@/types';
import { formatCurrency, formatMesAno } from '@/utils/formatters';
import {
  calcularTotalGasto,
  calcularSaldoDisponivel,
  calcularGastosPorCategoria,
  calcularGastosPorFormaPagamento,
  calcularSaldoCaixinha,
  calcularTotalPixEntradas,
  calcularTotalPixSaidas,
  calcularTotalFixos,
  calcularTotalVariaveis,
  getLimiteValor,
} from '@/utils/calculos';

interface DashboardProps {
  config: Config;
  fixos: GastoFixo[];
  variaveis: GastoVariavel[];
  pix: LancamentoPix[];
  caixinhaLancamentos: LancamentoCaixinha[];
  historicoMeses?: { mes: string; total: number }[];
}

const COLORS = [
  '#84cc16', '#22d3ee', '#f59e0b', '#ef4444', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#64748b',
];

export default function Dashboard({ config, fixos, variaveis, pix, caixinhaLancamentos, historicoMeses }: DashboardProps) {
  const totalGasto = calcularTotalGasto(fixos, variaveis, pix);
  const saldoDisponivel = calcularSaldoDisponivel(config.salario, fixos, variaveis, pix);
  const saldoCaixinha = calcularSaldoCaixinha(0, caixinhaLancamentos);
  const saldoReal = saldoDisponivel + saldoCaixinha;
  const percentualGasto = config.salario > 0 ? (totalGasto / config.salario) * 100 : 0;
  const entradasPix = calcularTotalPixEntradas(pix);
  const saidasPix = calcularTotalPixSaidas(pix);
  const totalFixos = calcularTotalFixos(fixos);
  const totalVariaveis = calcularTotalVariaveis(variaveis);

  const gastosPorCategoria = useMemo(
    () => calcularGastosPorCategoria(fixos, variaveis, pix),
    [fixos, variaveis, pix]
  );

  const gastosPorForma = useMemo(
    () => calcularGastosPorFormaPagamento(fixos, variaveis, pix),
    [fixos, variaveis, pix]
  );

  const pieData = useMemo(() => {
    return Object.entries(gastosPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [gastosPorCategoria]);

  const formaPagamentoData = useMemo(() => {
    return Object.entries(gastosPorForma)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [gastosPorForma]);

  const FORMA_COLORS: Record<string, string> = {
    'Credito': '#a855f7',
    'Debito': '#22d3ee',
    'PIX': '#84cc16',
    'Dinheiro': '#f59e0b',
  };

  const barData = useMemo(() => {
    return (historicoMeses || []).map(h => ({
      name: formatMesAno(h.mes).split(' ')[0].substring(0, 3),
      total: h.total,
    }));
  }, [historicoMeses]);

  const getBarraColor = () => {
    if (percentualGasto >= 100) return 'bg-red-500';
    if (percentualGasto >= 80) return 'bg-yellow-500';
    return 'bg-accent';
  };

  const categoriasComLimite = useMemo(() => {
    return Object.entries(config.limites).map(([cat, limite]) => {
      const gasto = gastosPorCategoria[cat] || 0;
      const limiteVal = getLimiteValor(limite, config.salario);
      const pct = limiteVal > 0 ? (gasto / limiteVal) * 100 : 0;
      return { categoria: cat, gasto, limite: limiteVal, percentual: pct };
    });
  }, [config.limites, config.salario, gastosPorCategoria]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="text-accent" size={24} />
        <h2 className="text-xl font-bold text-white">Dashboard — {formatMesAno(config.mesAtual)}</h2>
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Wallet size={18} /> Salario
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(config.salario)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <TrendingDown size={18} /> Total Gasto
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalGasto)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp size={18} /> Saldo Disponivel
          </div>
          <p className={`text-2xl font-bold ${saldoDisponivel >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(saldoDisponivel)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Wallet size={18} /> Fixos (Total)
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalFixos)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-zinc-400">Progresso do salario</span>
          <span className={`font-bold text-lg ${percentualGasto >= 100 ? 'text-red-400' : percentualGasto >= 80 ? 'text-yellow-400' : 'text-accent'}`}>
            {percentualGasto.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-4 bg-surface-lighter rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarraColor()}`}
            style={{ width: `${Math.min(percentualGasto, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-zinc-500 mt-2">
          <span>Gasto: {formatCurrency(totalGasto)}</span>
          <span>Limite: {formatCurrency(config.salario)}</span>
        </div>
      </div>

      {/* Detalhes do gasto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface rounded-lg border border-border/50 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Fixos</p>
          <p className="text-white font-semibold">{formatCurrency(totalFixos)}</p>
        </div>
        <div className="bg-surface rounded-lg border border-border/50 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Variaveis</p>
          <p className="text-white font-semibold">{formatCurrency(totalVariaveis)}</p>
        </div>
        <div className="bg-surface rounded-lg border border-border/50 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">PIX Saidas</p>
          <p className="text-white font-semibold">{formatCurrency(saidasPix)}</p>
        </div>
        <div className="bg-surface rounded-lg border border-border/50 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">PIX Entradas</p>
          <p className="text-green-400 font-semibold">+{formatCurrency(entradasPix)}</p>
        </div>
      </div>

      {/* Alertas de limite */}
      {categoriasComLimite.filter(c => c.percentual >= 80).length > 0 && (
        <div className="space-y-2">
          {categoriasComLimite.filter(c => c.percentual >= 100).map(c => (
            <div key={c.categoria} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <XCircle size={18} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-sm">
                <strong>{c.categoria}</strong>: Limite atingido! {formatCurrency(c.gasto)} de {formatCurrency(c.limite)}
              </span>
            </div>
          ))}
          {categoriasComLimite.filter(c => c.percentual >= 80 && c.percentual < 100).map(c => (
            <div key={c.categoria} className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
              <span className="text-yellow-300 text-sm">
                <strong>{c.categoria}</strong>: Atencao! {formatCurrency(c.gasto)} de {formatCurrency(c.limite)} ({c.percentual.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mini cards por categoria com barra */}
      {categoriasComLimite.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoriasComLimite.map(c => (
            <div key={c.categoria} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{c.categoria}</span>
                <span className="text-sm text-zinc-400">
                  {formatCurrency(c.gasto)} / {formatCurrency(c.limite)}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.percentual >= 100 ? 'bg-red-500' : c.percentual >= 80 ? 'bg-yellow-500' : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min(c.percentual, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        {pieData.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold text-white mb-4">Distribuicao dos Gastos</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-56 w-56 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: '#2a2a3e', border: '1px solid #3a3a5c', borderRadius: '8px', color: '#e4e4e7' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-zinc-500">Total</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(totalGasto)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {pieData.map((entry, i) => {
                  const pct = totalGasto > 0 ? (entry.value / totalGasto) * 100 : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-300 truncate">{entry.name}</span>
                          <span className="text-sm font-semibold text-white ml-2">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-lighter rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">{formatCurrency(entry.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bar chart */}
        {barData.length > 1 && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold text-white mb-4">Comparativo Mensal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: '#2a2a3e', border: '1px solid #3a3a5c', borderRadius: '8px', color: '#e4e4e7' }}
                  />
                  <Bar dataKey="total" fill="#84cc16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Donut chart - Forma de Pagamento */}
        {formaPagamentoData.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold text-white mb-4">Forma de Pagamento</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-48 w-48 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formaPagamentoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={4}
                    >
                      {formaPagamentoData.map((entry) => (
                        <Cell key={entry.name} fill={FORMA_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: '#2a2a3e', border: '1px solid #3a3a5c', borderRadius: '8px', color: '#e4e4e7' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-zinc-500">Total</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(totalGasto)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                {formaPagamentoData.map((entry) => {
                  const pct = totalGasto > 0 ? (entry.value / totalGasto) * 100 : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: FORMA_COLORS[entry.name] || '#64748b' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-300">{entry.name}</span>
                          <span className="text-sm font-semibold text-white ml-2">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-lighter rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: FORMA_COLORS[entry.name] || '#64748b' }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">{formatCurrency(entry.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
