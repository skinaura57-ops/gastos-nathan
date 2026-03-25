'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, BarChart3, CalendarDays, ShoppingCart, Repeat, PiggyBank, Settings, Menu, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Config, GastoFixo, GastoVariavel, LancamentoPix, LancamentoCaixinha } from '@/types';
import { getMesAtual, formatMesAno } from '@/utils/formatters';
import { calcularTotalGasto } from '@/utils/calculos';
import Dashboard from '@/components/Dashboard';
import GastosFixos from '@/components/GastosFixos';
import GastosVariaveis from '@/components/GastosVariaveis';
import SecaoPix from '@/components/SecaoPix';
import Caixinha from '@/components/Caixinha';
import Configuracoes from '@/components/Configuracoes';
import Modal from '@/components/Modal';
import BancoSelector from '@/components/BancoSelector';
import { CATEGORIAS, FORMAS_PAGAMENTO } from '@/types';
import { generateId } from '@/utils/formatters';
import { toast } from 'sonner';

type Tab = 'dashboard' | 'fixos' | 'variaveis' | 'pix' | 'caixinha' | 'config';

const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'fixos', label: 'Fixos', icon: CalendarDays },
  { id: 'variaveis', label: 'Variaveis', icon: ShoppingCart },
  { id: 'pix', label: 'PIX', icon: Repeat },
  { id: 'caixinha', label: 'Caixinha', icon: PiggyBank },
  { id: 'config', label: 'Config', icon: Settings },
];

const defaultConfig: Config = {
  salario: 3100,
  mesAtual: getMesAtual(),
  caixinhaBase: 0,
  limites: {},
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [config, setConfig] = useLocalStorage<Config>('gastos_nathan_config', defaultConfig);
  const [fixos, setFixos] = useLocalStorage<GastoFixo[]>('gastos_nathan_fixos', []);
  const [variaveis, setVariaveis] = useLocalStorage<GastoVariavel[]>(
    `gastos_nathan_variaveis_${config.mesAtual}`, []
  );
  const [pix, setPix] = useLocalStorage<LancamentoPix[]>(
    `gastos_nathan_pix_${config.mesAtual}`, []
  );
  const [caixinhaLancamentos, setCaixinhaLancamentos] = useLocalStorage<LancamentoCaixinha[]>(
    'gastos_nathan_caixinha', []
  );

  // FAB quick add form
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    descricao: '',
    categoria: 'Alimentacao',
    valor: '',
    formaPagamento: 'debito' as GastoVariavel['formaPagamento'],
    banco: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute historical data for bar chart
  const historicoMeses = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const meses: { mes: string; total: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gastos_nathan_variaveis_')) {
          const mes = key.replace('gastos_nathan_variaveis_', '');
          const data: GastoVariavel[] = JSON.parse(localStorage.getItem(key) || '[]');
          const pixKey = `gastos_nathan_pix_${mes}`;
          const pixData: LancamentoPix[] = JSON.parse(localStorage.getItem(pixKey) || '[]');
          const totalVar = data.reduce((s, g) => s + g.valor, 0);
          const totalPixSaidas = pixData.filter(p => p.tipo === 'saida').reduce((s, p) => s + p.valor, 0);
          // Include fixed expenses for current month
          const totalFixos = mes === config.mesAtual ? fixos.filter(f => f.pago && f.ativo).reduce((s, f) => s + f.valor, 0) : 0;
          meses.push({ mes, total: totalVar + totalPixSaidas + totalFixos });
        }
      }
    } catch {}
    return meses.sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6);
  }, [config.mesAtual, fixos, variaveis, pix]);

  // All descriptions for autocomplete
  const allDescricoes = useMemo(() => {
    const descs = new Set(variaveis.map(g => g.descricao));
    return Array.from(descs);
  }, [variaveis]);

  const handleQuickAdd = () => {
    const valor = parseFloat(quickForm.valor.replace(',', '.'));
    if (!quickForm.descricao.trim()) { toast.error('Informe a descricao'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }

    const novoGasto: GastoVariavel = {
      id: generateId(),
      descricao: quickForm.descricao,
      categoria: quickForm.categoria,
      valor,
      formaPagamento: quickForm.formaPagamento,
      banco: quickForm.banco,
      data: quickForm.data,
      observacao: quickForm.observacao || undefined,
    };

    setVariaveis(prev => [...prev, novoGasto]);
    toast.success('Gasto registrado!');
    setQuickAddOpen(false);
    setQuickForm({
      descricao: '',
      categoria: 'Alimentacao',
      valor: '',
      formaPagamento: 'debito',
      banco: '',
      data: new Date().toISOString().split('T')[0],
      observacao: '',
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="text-accent text-xl font-bold animate-pulse">Gastos do Nathan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-bold text-white">
              <span className="text-accent">$</span> Gastos do Nathan
            </h1>
          </div>
          <span className="text-sm text-zinc-400 hidden sm:block">
            {formatMesAno(config.mesAtual)}
          </span>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden sm:block max-w-7xl mx-auto px-4">
          <div className="flex gap-1 -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-surface text-accent border-b-2 border-accent'
                      : 'text-zinc-400 hover:text-white hover:bg-surface/50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <nav className="sm:hidden bg-surface border-b border-border px-4 py-3 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenu(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-zinc-400 hover:text-white hover:bg-surface-light'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'dashboard' && (
          <Dashboard
            config={config}
            fixos={fixos}
            variaveis={variaveis}
            pix={pix}
            caixinhaLancamentos={caixinhaLancamentos}
            historicoMeses={historicoMeses}
          />
        )}
        {activeTab === 'fixos' && (
          <GastosFixos fixos={fixos} setFixos={setFixos} />
        )}
        {activeTab === 'variaveis' && (
          <GastosVariaveis variaveis={variaveis} setVariaveis={setVariaveis} allDescricoes={allDescricoes} />
        )}
        {activeTab === 'pix' && (
          <SecaoPix pix={pix} setPix={setPix} />
        )}
        {activeTab === 'caixinha' && (
          <Caixinha
            lancamentos={caixinhaLancamentos}
            setLancamentos={setCaixinhaLancamentos}
            caixinhaBase={config.caixinhaBase}
          />
        )}
        {activeTab === 'config' && (
          <Configuracoes config={config} setConfig={setConfig} />
        )}
      </main>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-dark text-black rounded-full shadow-lg shadow-accent/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Registrar gasto rapido"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Quick Add Modal */}
      <Modal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Registrar Gasto Rapido">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Descricao</label>
            <input
              type="text"
              value={quickForm.descricao}
              onChange={(e) => setQuickForm(prev => ({ ...prev, descricao: e.target.value }))}
              list="quick-desc-list"
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Almoco no restaurante"
              autoFocus
            />
            <datalist id="quick-desc-list">
              {allDescricoes.map(d => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Valor (R$)</label>
              <input
                type="text"
                value={quickForm.valor}
                onChange={(e) => setQuickForm(prev => ({ ...prev, valor: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="43.00"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Categoria</label>
              <select
                value={quickForm.categoria}
                onChange={(e) => setQuickForm(prev => ({ ...prev, categoria: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Pagamento</label>
              <select
                value={quickForm.formaPagamento}
                onChange={(e) => setQuickForm(prev => ({ ...prev, formaPagamento: e.target.value as GastoVariavel['formaPagamento'] }))}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {FORMAS_PAGAMENTO.map(fp => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
            </div>
          </div>
          <BancoSelector
            label="Banco"
            value={quickForm.banco}
            onChange={(banco) => setQuickForm(prev => ({ ...prev, banco }))}
          />
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Data</label>
            <input
              type="date"
              value={quickForm.data}
              onChange={(e) => setQuickForm(prev => ({ ...prev, data: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-accent hover:bg-accent-dark text-black font-bold rounded-lg transition-colors text-lg"
          >
            Registrar Gasto
          </button>
        </div>
      </Modal>

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex">
        {tabs.slice(0, 5).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                activeTab === tab.id ? 'text-accent' : 'text-zinc-500'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
