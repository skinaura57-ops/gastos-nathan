'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ShoppingCart, Filter, Check, Clock } from 'lucide-react';
import { GastoVariavel, CATEGORIAS, FORMAS_PAGAMENTO, BANCOS } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/formatters';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import BancoSelector, { BancoBadge } from './BancoSelector';
import { toast } from 'sonner';

interface GastosVariaveisProps {
  variaveis: GastoVariavel[];
  setVariaveis: (v: GastoVariavel[] | ((prev: GastoVariavel[]) => GastoVariavel[])) => void;
  allDescricoes: string[];
  mesAtual: string;
  onSaveParcelado?: (mes: string, gasto: GastoVariavel) => void;
}

const emptyGasto: Omit<GastoVariavel, 'id'> = {
  descricao: '',
  categoria: 'Alimentacao',
  valor: 0,
  formaPagamento: 'debito',
  banco: '',
  data: new Date().toISOString().split('T')[0],
  observacao: '',
};

function getNextMonth(mes: string, offset: number): string {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function GastosVariaveis({ variaveis, setVariaveis, allDescricoes, mesAtual, onSaveParcelado }: GastosVariaveisProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGasto);
  const [valorInput, setValorInput] = useState('');
  const [parcelasInput, setParcelasInput] = useState('1');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyGasto, data: new Date().toISOString().split('T')[0] });
    setValorInput('');
    setParcelasInput('1');
    setModalOpen(true);
  };

  const openEdit = (g: GastoVariavel) => {
    setEditId(g.id);
    setForm(g);
    setValorInput(g.valor.toString());
    setParcelasInput(g.parcelas ? g.parcelas.toString() : '1');
    setModalOpen(true);
  };

  const handleSave = () => {
    const valorDigitado = parseFloat(valorInput.replace(',', '.'));
    if (!form.descricao.trim()) { toast.error('Informe a descricao'); return; }
    if (isNaN(valorDigitado) || valorDigitado <= 0) { toast.error('Valor invalido'); return; }

    const numParcelas = form.formaPagamento === 'credito' ? Math.max(1, parseInt(parcelasInput) || 1) : 1;

    if (editId) {
      setVariaveis(prev => prev.map(g => g.id === editId ? { ...form, id: editId, valor: valorDigitado } : g));
      toast.success('Gasto atualizado!');
    } else if (numParcelas > 1) {
      const valorParcela = Math.round((valorDigitado / numParcelas) * 100) / 100;
      const groupId = generateId();

      // Parcela 1 - mes atual
      const parcela1: GastoVariavel = {
        ...form,
        id: generateId(),
        valor: valorParcela,
        valorTotal: valorDigitado,
        parcelas: numParcelas,
        parcelaAtual: 1,
        parcelaGroupId: groupId,
        observacao: form.observacao ? `${form.observacao} (1/${numParcelas})` : `Parcela 1/${numParcelas}`,
      };
      setVariaveis(prev => [...prev, parcela1]);

      // Parcelas futuras
      for (let i = 2; i <= numParcelas; i++) {
        const mesFuturo = getNextMonth(mesAtual, i - 1);
        const parcelaFutura: GastoVariavel = {
          ...form,
          id: generateId(),
          valor: valorParcela,
          valorTotal: valorDigitado,
          parcelas: numParcelas,
          parcelaAtual: i,
          parcelaGroupId: groupId,
          observacao: form.observacao ? `${form.observacao} (${i}/${numParcelas})` : `Parcela ${i}/${numParcelas}`,
        };
        if (onSaveParcelado) {
          onSaveParcelado(mesFuturo, parcelaFutura);
        }
      }
      toast.success(`Parcelado em ${numParcelas}x de ${formatCurrency(valorParcela)}!`);
    } else {
      setVariaveis(prev => [...prev, { ...form, id: generateId(), valor: valorDigitado }]);
      toast.success('Gasto registrado!');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setVariaveis(prev => prev.filter(g => g.id !== deleteId));
    setDeleteId(null);
    toast.success('Gasto excluido!');
  };

  const togglePago = (id: string) => {
    setVariaveis(prev => prev.map(g => g.id === id ? { ...g, pago: !g.pago } : g));
  };

  const bancosList = useMemo(() => {
    const bancos = new Set(variaveis.map(g => g.banco).filter(Boolean));
    return Array.from(bancos);
  }, [variaveis]);

  const filteredVariaveis = useMemo(() => {
    return variaveis.filter(g => {
      if (busca && !g.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroCategoria && g.categoria !== filtroCategoria) return false;
      if (filtroBanco && g.banco !== filtroBanco) return false;
      return true;
    }).sort((a, b) => b.data.localeCompare(a.data));
  }, [variaveis, busca, filtroCategoria, filtroBanco]);

  const totalPorCategoria = useMemo(() => {
    const result: Record<string, number> = {};
    variaveis.forEach(g => {
      result[g.categoria] = (result[g.categoria] || 0) + g.valor;
    });
    return result;
  }, [variaveis]);

  const totalFiltrado = filteredVariaveis.reduce((s, g) => s + g.valor, 0);
  const totalPagos = variaveis.filter(g => g.pago).reduce((s, g) => s + g.valor, 0);
  const totalPendentes = variaveis.filter(g => !g.pago).reduce((s, g) => s + g.valor, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-accent" size={24} />
          <h2 className="text-xl font-bold text-white">Gastos Variaveis</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent-dark text-black font-bold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      {/* Busca e filtros */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por descricao..."
              className="bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-zinc-400 hover:text-white'
            }`}
          >
            <Filter size={18} /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 bg-surface rounded-lg border border-border p-4">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filtroBanco}
              onChange={(e) => setFiltroBanco(e.target.value)}
              className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none"
            >
              <option value="">Todos os bancos</option>
              {bancosList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {(filtroCategoria || filtroBanco) && (
              <button
                onClick={() => { setFiltroCategoria(''); setFiltroBanco(''); }}
                className="text-sm text-accent hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {variaveis.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum gasto variavel registrado</p>
          <p className="text-sm">Clique em &quot;Registrar Gasto&quot; para comecar</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredVariaveis.map(g => (
              <div key={g.id} className={`bg-surface rounded-xl border border-border p-4 ${g.pago ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePago(g.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        g.pago ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {g.pago ? <Check size={14} /> : <Clock size={14} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${g.pago ? 'text-zinc-400 line-through' : 'text-white'}`}>{g.descricao}</p>
                        {g.parcelas && g.parcelas > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-semibold">{g.parcelaAtual}/{g.parcelas}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">{formatDate(g.data)}</p>
                    </div>
                  </div>
                  <p className="text-white font-semibold">{formatCurrency(g.valor)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-light text-xs text-zinc-400">{g.categoria}</span>
                    <BancoBadge bancoNome={g.banco} size="sm" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 text-zinc-400 hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(g.id)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-zinc-400 border-b border-border">
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Descricao</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Valor</th>
                  <th className="pb-3 pr-4">Pagamento</th>
                  <th className="pb-3 pr-4">Banco</th>
                  <th className="pb-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariaveis.map(g => (
                  <tr key={g.id} className={`border-b border-border/50 ${g.pago ? 'opacity-60' : ''}`}>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => togglePago(g.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          g.pago ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {g.pago ? <Check size={16} /> : <Clock size={16} />}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm">{formatDate(g.data)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{g.descricao}</p>
                        {g.parcelas && g.parcelas > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-semibold shrink-0">{g.parcelaAtual}/{g.parcelas}</span>
                        )}
                      </div>
                      {g.observacao && <p className="text-xs text-zinc-500">{g.observacao}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-md bg-surface-light text-sm text-zinc-300">{g.categoria}</span>
                    </td>
                    <td className="py-3 pr-4 text-white">{formatCurrency(g.valor)}</td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm capitalize">{g.formaPagamento}</td>
                    <td className="py-3 pr-4"><BancoBadge bancoNome={g.banco} /></td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-surface-light text-zinc-400 hover:text-white transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg hover:bg-surface-light text-zinc-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="bg-surface-light rounded-lg px-4 py-2">
                Total: <span className="text-white font-semibold">{formatCurrency(totalFiltrado)}</span>
                {(filtroCategoria || filtroBanco || busca) && (
                  <span className="text-zinc-500 ml-2">(filtrado)</span>
                )}
              </div>
              <div className="bg-surface-light rounded-lg px-4 py-2">
                Pagos: <span className="text-green-400 font-semibold">{formatCurrency(totalPagos)}</span>
              </div>
              <div className="bg-surface-light rounded-lg px-4 py-2">
                Pendentes: <span className="text-red-400 font-semibold">{formatCurrency(totalPendentes)}</span>
              </div>
            </div>
            {Object.keys(totalPorCategoria).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(totalPorCategoria).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                  <div key={cat} className="bg-surface rounded-lg border border-border/50 px-3 py-1.5 text-sm">
                    <span className="text-zinc-400">{cat}:</span>{' '}
                    <span className="text-white font-medium">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Gasto' : 'Registrar Gasto'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Descricao</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              list="descricoes-list"
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Subway - almoco"
            />
            <datalist id="descricoes-list">
              {allDescricoes.map(d => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Valor (R$)</label>
              <input
                type="text"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="43.00"
              />
            </div>
          </div>
          <div className={`grid gap-4 ${form.formaPagamento === 'credito' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Forma de Pagamento</label>
              <select
                value={form.formaPagamento}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, formaPagamento: e.target.value as GastoVariavel['formaPagamento'] }));
                  if (e.target.value !== 'credito') setParcelasInput('1');
                }}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {FORMAS_PAGAMENTO.map(fp => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
            </div>
            {form.formaPagamento === 'credito' && !editId && (
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Parcelas</label>
                <select
                  value={parcelasInput}
                  onChange={(e) => setParcelasInput(e.target.value)}
                  className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}x {parseInt(valorInput.replace(',', '.')) > 0 ? `de ${formatCurrency(parseFloat(valorInput.replace(',', '.')) / n)}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {form.formaPagamento === 'credito' && !editId && parseInt(parcelasInput) > 1 && parseFloat(valorInput.replace(',', '.')) > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
              Total: {formatCurrency(parseFloat(valorInput.replace(',', '.')))} em {parcelasInput}x de {formatCurrency(parseFloat(valorInput.replace(',', '.')) / parseInt(parcelasInput))}
              <br />
              <span className="text-xs text-blue-400/70">As parcelas serao distribuidas nos proximos {parseInt(parcelasInput) - 1} meses automaticamente</span>
            </div>
          )}
          <BancoSelector
            label="Banco/Cartao"
            value={form.banco}
            onChange={(banco) => setForm(prev => ({ ...prev, banco }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Observacao</label>
              <input
                type="text"
                value={form.observacao || ''}
                onChange={(e) => setForm(prev => ({ ...prev, observacao: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="Opcional"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-accent hover:bg-accent-dark text-black font-semibold rounded-lg transition-colors"
          >
            {editId ? 'Salvar Alteracoes' : 'Registrar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Gasto"
        message="Tem certeza que deseja excluir este gasto?"
      />
    </div>
  );
}
