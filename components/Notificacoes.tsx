'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, XCircle, TrendingDown, Users, Clock } from 'lucide-react';
import { Config, GastoFixo, GastoVariavel, LancamentoPix, ValorAReceber } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { calcularTotalGasto, calcularGastosPorCategoria, getLimiteValor, calcularSaldoDisponivel } from '@/utils/calculos';

interface Alerta {
  id: string;
  tipo: 'perigo' | 'atencao' | 'info';
  icone: React.ReactNode;
  titulo: string;
  mensagem: string;
}

interface NotificacoesProps {
  config: Config;
  fixos: GastoFixo[];
  variaveis: GastoVariavel[];
  pix: LancamentoPix[];
  valoresReceber: ValorAReceber[];
}

export default function Notificacoes({ config, fixos, variaveis, pix, valoresReceber }: NotificacoesProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [show, setShow] = useState(false);

  useEffect(() => {
    const novosAlertas: Alerta[] = [];
    const totalGasto = calcularTotalGasto(fixos, variaveis, pix);
    const saldo = calcularSaldoDisponivel(config.salario, fixos, variaveis, pix);
    const percentualTotal = config.salario > 0 ? (totalGasto / config.salario) * 100 : 0;
    const gastosPorCat = calcularGastosPorCategoria(fixos, variaveis, pix);

    // Alerta de salario quase esgotado
    if (percentualTotal >= 95) {
      novosAlertas.push({
        id: 'salario-95',
        tipo: 'perigo',
        icone: <XCircle size={20} />,
        titulo: 'Salario quase esgotado!',
        mensagem: `Voce ja gastou ${percentualTotal.toFixed(1)}% do salario. Restam apenas ${formatCurrency(saldo)}.`,
      });
    } else if (percentualTotal >= 80) {
      novosAlertas.push({
        id: 'salario-80',
        tipo: 'atencao',
        icone: <AlertTriangle size={20} />,
        titulo: 'Atencao com o salario',
        mensagem: `Voce ja gastou ${percentualTotal.toFixed(1)}% do salario (${formatCurrency(totalGasto)}). Restam ${formatCurrency(saldo)}.`,
      });
    }

    // Saldo negativo
    if (saldo < 0) {
      novosAlertas.push({
        id: 'saldo-negativo',
        tipo: 'perigo',
        icone: <TrendingDown size={20} />,
        titulo: 'Saldo negativo!',
        mensagem: `Seus gastos ultrapassaram o salario em ${formatCurrency(Math.abs(saldo))}.`,
      });
    }

    // Limites por categoria
    Object.entries(config.limites).forEach(([cat, limite]) => {
      const gasto = gastosPorCat[cat] || 0;
      const limiteVal = getLimiteValor(limite, config.salario);
      if (limiteVal <= 0) return;
      const pct = (gasto / limiteVal) * 100;

      if (pct >= 100) {
        novosAlertas.push({
          id: `limite-100-${cat}`,
          tipo: 'perigo',
          icone: <XCircle size={20} />,
          titulo: `${cat}: limite estourado!`,
          mensagem: `Gasto de ${formatCurrency(gasto)} ultrapassou o limite de ${formatCurrency(limiteVal)}.`,
        });
      } else if (pct >= 80) {
        novosAlertas.push({
          id: `limite-80-${cat}`,
          tipo: 'atencao',
          icone: <AlertTriangle size={20} />,
          titulo: `${cat}: perto do limite`,
          mensagem: `${formatCurrency(gasto)} de ${formatCurrency(limiteVal)} (${pct.toFixed(0)}%). Restam ${formatCurrency(limiteVal - gasto)}.`,
        });
      }
    });

    // Gastos fixos pendentes
    const fixosPendentes = fixos.filter(f => f.ativo && !f.pago);
    if (fixosPendentes.length > 0) {
      const totalPendente = fixosPendentes.reduce((s, f) => s + f.valor, 0);
      novosAlertas.push({
        id: 'fixos-pendentes',
        tipo: 'info',
        icone: <Clock size={20} />,
        titulo: `${fixosPendentes.length} gasto${fixosPendentes.length > 1 ? 's' : ''} fixo${fixosPendentes.length > 1 ? 's' : ''} pendente${fixosPendentes.length > 1 ? 's' : ''}`,
        mensagem: `Total de ${formatCurrency(totalPendente)} em contas a pagar este mes.`,
      });
    }

    // Valores a receber
    const pendentesReceber = valoresReceber.filter(v => !v.recebido);
    if (pendentesReceber.length > 0) {
      const totalReceber = pendentesReceber.reduce((s, v) => s + v.valor, 0);
      novosAlertas.push({
        id: 'valores-receber',
        tipo: 'info',
        icone: <Users size={20} />,
        titulo: `${formatCurrency(totalReceber)} a receber`,
        mensagem: `${pendentesReceber.length} pessoa${pendentesReceber.length > 1 ? 's' : ''} te deve${pendentesReceber.length > 1 ? 'm' : ''} dinheiro.`,
      });
    }

    setAlertas(novosAlertas);
    if (novosAlertas.length > 0) {
      setShow(true);
    }
  }, [config, fixos, variaveis, pix, valoresReceber]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const dismissAll = () => {
    setShow(false);
  };

  const alertasVisiveis = alertas.filter(a => !dismissed.has(a.id));

  if (!show || alertasVisiveis.length === 0) return null;

  const getBgColor = (tipo: string) => {
    switch (tipo) {
      case 'perigo': return 'bg-red-500/10 border-red-500/30';
      case 'atencao': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTextColor = (tipo: string) => {
    switch (tipo) {
      case 'perigo': return 'text-red-400';
      case 'atencao': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-4 px-4 pointer-events-none">
      <div className="w-full max-w-md space-y-2 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-surface rounded-xl border border-border px-4 py-3 shadow-2xl">
          <span className="text-white font-semibold text-sm">
            {alertasVisiveis.length} notificacao{alertasVisiveis.length > 1 ? 'es' : ''}
          </span>
          <button
            onClick={dismissAll}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg hover:bg-surface-light transition-colors"
          >
            Fechar tudo
          </button>
        </div>

        {/* Alertas */}
        {alertasVisiveis.map((alerta, index) => (
          <div
            key={alerta.id}
            className={`${getBgColor(alerta.tipo)} border rounded-xl p-4 shadow-2xl animate-slide-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={`${getTextColor(alerta.tipo)} mt-0.5 shrink-0`}>
                {alerta.icone}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${getTextColor(alerta.tipo)}`}>
                  {alerta.titulo}
                </p>
                <p className="text-zinc-300 text-sm mt-0.5">{alerta.mensagem}</p>
              </div>
              <button
                onClick={() => dismiss(alerta.id)}
                className="text-zinc-500 hover:text-white shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
