'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays, Check, Clock } from 'lucide-react';
import { GastoFixo, CATEGORIAS, FORMAS_PAGAMENTO } from '@/types';
import { formatCurrency, generateId } from '@/utils/formatters';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import BancoSelector, { BancoBadge } from './BancoSelector';
import { toast } from 'sonner';

interface GastosFixosProps {
  fixos: GastoFixo[];
  setFixos: (fixos: GastoFixo[] | ((prev: GastoFixo[]) => GastoFixo[])) => void;
}

const emptyFixo: Omit<GastoFixo, 'id'> = {
  nome: '',
  categoria: 'Outros',
  valor: 0,
  formaPagamento: 'debito',
  banco: '',
  diaVencimento: 1,
  ativo: true,
  pago: false,
};

export default function GastosFixos({ fixos, setFixos }: GastosFixosProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFixo);
  const [valorInput, setValorInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'categoria' | 'valor'>('categoria');

  const openNew = () => {
    setEditId(null);
    setForm(emptyFixo);
    setValorInput('');
    setModalOpen(true);
  };

  const openEdit = (fixo: GastoFixo) => {
    setEditId(fixo.id);
    setForm(fixo);
    setValorInput(fixo.valor.toString());
    setModalOpen(true);
  };

  const handleSave = () => {
    const valor = parseFloat(valorInput.replace(',', '.'));
    if (!form.nome.trim()) { toast.error('Informe o nome'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }

    if (editId) {
      setFixos(prev => prev.map(f => f.id === editId ? { ...form, id: editId, valor } : f));
      toast.success('Gasto fixo atualizado!');
    } else {
      setFixos(prev => [...prev, { ...form, id: generateId(), valor }]);
      toast.success('Gasto fixo adicionado!');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setFixos(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
    toast.success('Gasto fixo excluido!');
  };

  const togglePago = (id: string) => {
    setFixos(prev => prev.map(f => f.id === id ? { ...f, pago: !f.pago } : f));
  };

  const fixosOrdenados = [...fixos].sort((a, b) => {
    if (ordenacao === 'categoria') return a.categoria.localeCompare(b.categoria);
    return b.valor - a.valor;
  });

  const totalFixos = fixos.filter(f => f.ativo).reduce((s, f) => s + f.valor, 0);
  const totalPagos = fixos.filter(f => f.ativo && f.pago).reduce((s, f) => s + f.valor, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-accent" size={24} />
          <h2 className="text-xl font-bold text-white">Gastos Fixos</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as 'categoria' | 'valor')}
            className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none"
          >
            <option value="categoria">Ordenar por categoria</option>
            <option value="valor">Ordenar por valor</option>
          </select>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
          >
            <Plus size={18} /> Adicionar Gasto Fixo
          </button>
        </div>
      </div>

      {fixos.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum gasto fixo cadastrado</p>
          <p className="text-sm">Adicione seus gastos recorrentes mensais</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-zinc-400 border-b border-border">
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Nome</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Valor</th>
                  <th className="pb-3 pr-4">Pagamento</th>
                  <th className="pb-3 pr-4">Banco</th>
                  <th className="pb-3 pr-4">Vencimento</th>
                  <th className="pb-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {fixosOrdenados.map(fixo => (
                  <tr key={fixo.id} className={`border-b border-border/50 ${!fixo.ativo ? 'opacity-40' : ''}`}>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => togglePago(fixo.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          fixo.pago
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {fixo.pago ? <Check size={16} /> : <Clock size={16} />}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-white font-medium">{fixo.nome}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-md bg-surface-light text-sm text-zinc-300">{fixo.categoria}</span>
                    </td>
                    <td className="py-3 pr-4 text-white">{formatCurrency(fixo.valor)}</td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm capitalize">{fixo.formaPagamento}</td>
                    <td className="py-3 pr-4"><BancoBadge bancoNome={fixo.banco} /></td>
                    <td className="py-3 pr-4 text-zinc-400 text-sm">Dia {fixo.diaVencimento}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(fixo)} className="p-1.5 rounded-lg hover:bg-surface-light text-zinc-400 hover:text-white transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(fixo.id)} className="p-1.5 rounded-lg hover:bg-surface-light text-zinc-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="bg-surface-light rounded-lg px-4 py-2">
              Total fixos: <span className="text-white font-semibold">{formatCurrency(totalFixos)}</span>
            </div>
            <div className="bg-surface-light rounded-lg px-4 py-2">
              Pagos: <span className="text-green-400 font-semibold">{formatCurrency(totalPagos)}</span>
            </div>
            <div className="bg-surface-light rounded-lg px-4 py-2">
              Pendentes: <span className="text-red-400 font-semibold">{formatCurrency(totalFixos - totalPagos)}</span>
            </div>
          </div>
        </>
      )}

      {/* Modal form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Netflix, Aluguel..."
            />
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
                placeholder="55.90"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Forma de Pagamento</label>
              <select
                value={form.formaPagamento}
                onChange={(e) => setForm(prev => ({ ...prev, formaPagamento: e.target.value as GastoFixo['formaPagamento'] }))}
                className="bg-surface-light border border-border rounded-lg px-3 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              >
                {FORMAS_PAGAMENTO.map(fp => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
            </div>
          </div>
          <BancoSelector
            label="Banco/Cartao"
            value={form.banco}
            onChange={(banco) => setForm(prev => ({ ...prev, banco }))}
          />
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Dia de Vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.diaVencimento}
              onChange={(e) => setForm(prev => ({ ...prev, diaVencimento: parseInt(e.target.value) || 1 }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-24 focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-lighter rounded-full peer peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
            <span className="text-zinc-300">Ativo</span>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-accent hover:bg-accent-dark text-black font-semibold rounded-lg transition-colors"
          >
            {editId ? 'Salvar Alteracoes' : 'Adicionar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Gasto Fixo"
        message="Tem certeza que deseja excluir este gasto fixo?"
      />
    </div>
  );
}
