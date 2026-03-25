'use client';

import { useState } from 'react';
import { Settings, Save, Trash2, Plus } from 'lucide-react';
import { Config, CATEGORIAS } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface ConfiguracoesProps {
  config: Config;
  setConfig: (config: Config | ((prev: Config) => Config)) => void;
}

export default function Configuracoes({ config, setConfig }: ConfiguracoesProps) {
  const [salarioInput, setSalarioInput] = useState(config.salario.toString());
  const [caixinhaInput, setCaixinhaInput] = useState(config.caixinhaBase.toString());
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoLimiteTipo, setNovoLimiteTipo] = useState<'fixo' | 'percentual'>('fixo');
  const [novoLimiteValor, setNovoLimiteValor] = useState('');

  const handleSalvarSalario = () => {
    const valor = parseFloat(salarioInput.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor invalido');
      return;
    }
    setConfig(prev => ({ ...prev, salario: valor }));
    toast.success('Salario atualizado!');
  };

  const handleSalvarCaixinha = () => {
    const valor = parseFloat(caixinhaInput.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      toast.error('Valor invalido');
      return;
    }
    setConfig(prev => ({ ...prev, caixinhaBase: valor }));
    toast.success('Saldo da caixinha atualizado!');
  };

  const handleMesChange = (mes: string) => {
    setConfig(prev => ({ ...prev, mesAtual: mes }));
    toast.success('Mes alterado!');
  };

  const handleAdicionarLimite = () => {
    if (!novaCategoria || !novoLimiteValor) return;
    const valor = parseFloat(novoLimiteValor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor invalido');
      return;
    }
    setConfig(prev => ({
      ...prev,
      limites: {
        ...prev.limites,
        [novaCategoria]: { tipo: novoLimiteTipo, valor },
      },
    }));
    setNovaCategoria('');
    setNovoLimiteValor('');
    toast.success('Limite adicionado!');
  };

  const handleRemoverLimite = (cat: string) => {
    setConfig(prev => {
      const novosLimites = { ...prev.limites };
      delete novosLimites[cat];
      return { ...prev, limites: novosLimites };
    });
    toast.success('Limite removido!');
  };

  const handleExportarDados = () => {
    const allData: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gastos_nathan_')) {
        allData[key] = JSON.parse(localStorage.getItem(key) || '');
      }
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-nathan-backup-${config.mesAtual}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados!');
  };

  const handleImportarDados = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        toast.success('Dados importados! Recarregando...');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error('Arquivo invalido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-accent" size={24} />
        <h2 className="text-xl font-bold text-white">Configuracoes</h2>
      </div>

      {/* Mes de referencia */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold text-white mb-3">Mes de Referencia</h3>
        <input
          type="month"
          value={config.mesAtual}
          onChange={(e) => handleMesChange(e.target.value)}
          className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full max-w-xs focus:outline-none focus:border-accent"
        />
      </div>

      {/* Salario */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold text-white mb-3">Salario Mensal</h3>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">R$</span>
            <input
              type="text"
              value={salarioInput}
              onChange={(e) => setSalarioInput(e.target.value)}
              className="bg-surface-light border border-border rounded-lg pl-10 pr-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="3100.00"
            />
          </div>
          <button
            onClick={handleSalvarSalario}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-2">Atual: {formatCurrency(config.salario)}</p>
      </div>

      {/* Saldo base caixinha */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold text-white mb-3">Saldo Base da Caixinha</h3>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">R$</span>
            <input
              type="text"
              value={caixinhaInput}
              onChange={(e) => setCaixinhaInput(e.target.value)}
              className="bg-surface-light border border-border rounded-lg pl-10 pr-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="0.00"
            />
          </div>
          <button
            onClick={handleSalvarCaixinha}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-2">Atual: {formatCurrency(config.caixinhaBase)}</p>
      </div>

      {/* Limites por categoria */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold text-white mb-4">Limites por Categoria</h3>

        {Object.entries(config.limites).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(config.limites).map(([cat, lim]) => (
              <div key={cat} className="flex items-center justify-between bg-surface-light rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-medium">{cat}</span>
                  <span className="text-zinc-400 ml-2">
                    {lim.tipo === 'fixo' ? formatCurrency(lim.valor) : `${lim.valor}% do salario`}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoverLimite(cat)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Categoria</label>
            <select
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent"
            >
              <option value="">Selecione</option>
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Tipo</label>
            <select
              value={novoLimiteTipo}
              onChange={(e) => setNovoLimiteTipo(e.target.value as 'fixo' | 'percentual')}
              className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent"
            >
              <option value="fixo">Valor fixo (R$)</option>
              <option value="percentual">Porcentagem (%)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Valor</label>
            <input
              type="text"
              value={novoLimiteValor}
              onChange={(e) => setNovoLimiteValor(e.target.value)}
              placeholder={novoLimiteTipo === 'fixo' ? '600.00' : '20'}
              className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-28 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleAdicionarLimite}
            className="flex items-center gap-1 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      {/* Backup */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold text-white mb-3">Backup dos Dados</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Os dados ficam salvos no navegador. Se limpar o cache, perde tudo. Faca backup regularmente!
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportarDados}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Exportar Dados (JSON)
          </button>
          <label className="px-4 py-2.5 bg-surface-light hover:bg-surface-lighter border border-border text-zinc-300 font-medium rounded-lg transition-colors cursor-pointer">
            Importar Dados
            <input type="file" accept=".json" onChange={handleImportarDados} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
