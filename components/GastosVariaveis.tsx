'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ShoppingCart, Filter } from 'lucide-react';
import { GastoVariavel, CATEGORIAS, FORMAS_PAGAMENTO, BANCOS_COMUNS } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/formatters';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'sonner';

interface GastosVariaveisProps {
  variaveis: GastoVariavel[];
  setVariaveis: (v: GastoVariavel[] | ((prev: GastoVariavel[]) => GastoVariavel[])) => void;
  allDescricoes: string[];
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

export default function GastosVariaveis({ variaveis, setVariaveis, allDescricoes }: GastosVariaveisProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGasto);
  const [valorInput, setValorInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyGasto, data: new Date().toISOString().split('T')[0] });
    setValorInput('');
    setModalOpen(true);
  };

  const openEdit = (g: GastoVariavel) => {
    setEditId(g.id);
    setForm(g);
    setValorInput(g.valor.toString());
    setModalOpen(true);
  };

  const handleSave = () => {
    const valor = parseFloat(valorInput.replace(',', '.'));
    if (!form.descricao.trim()) { toast.error('Informe a descricao'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }

    if (editId) {
      setVariaveis(prev => prev.map(g => g.id === editId ? { ...form, id: editId, valor } : g));
      toast.success('Gasto atualizado!');
    } else {
      setVariaveis(prev => [...prev, { ...form, id: generateId(), valor }]);
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
              <div key={g.id} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">{g.descricao}</p>
                    <p className="text-sm text-zinc-400">{formatDate(g.data)}</p>
                  </div>
                  <p className="text-white font-semibold">{formatCurrency(g.valor)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-light text-xs text-zinc-400">{g.categoria}</span>
                    <span className="text-xs text-zinc-500 capitalize">{g.formaPagamento}</span>
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
                  <tr key={g.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-zinc-400 text-sm">{formatDate(g.data)}</td>
                    <td className="py-3 pr-4">
                      <p className="text-white font-medium">{g.descricao}</p>
                      {g.observacao && <p className="text-xs text-zinc-500">{g.observacao}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-md bg-surface-light text-sm text-zinc-300">{g.categoria}</span>
                    </td>
                    <td className="py-3 pr-4 text-white">{formatCurrency(g.valor)}</td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm capitalize">{g.formaPagamento}</td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm">{g.banco}</td>
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
            <div className="bg-surface-light rounded-lg px-4 py-2 inline-block">
              Total: <span className="text-white font-semibold">{formatCurrency(totalFiltrado)}</span>
              {(filtroCategoria || filtroBanco || busca) && (
                <span className="text-zinc-500 ml-2">(filtrado)</span>
              )}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Forma de Pagamento</label>
              <select
                value={form.formaPagamento}
                onChange={(e) => setForm(prev => ({ ...prev, formaPagamento: e.target.value as GastoVariavel['formaPagamento'] }))}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {FORMAS_PAGAMENTO.map(fp => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Banco/Cartao</label>
              <input
                type="text"
                value={form.banco}
                onChange={(e) => setForm(prev => ({ ...prev, banco: e.target.value }))}
                list="bancos-var"
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="Nubank"
              />
              <datalist id="bancos-var">
                {BANCOS_COMUNS.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>
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
