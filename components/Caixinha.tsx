'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { LancamentoCaixinha } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/formatters';
import { calcularSaldoCaixinha } from '@/utils/calculos';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import BancoSelector, { BancoBadge } from './BancoSelector';
import { toast } from 'sonner';

interface CaixinhaProps {
  lancamentos: LancamentoCaixinha[];
  setLancamentos: (l: LancamentoCaixinha[] | ((prev: LancamentoCaixinha[]) => LancamentoCaixinha[])) => void;
  caixinhaBase: number;
}

export default function Caixinha({ lancamentos, setLancamentos, caixinhaBase }: CaixinhaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    banco: '',
    observacao: '',
  });
  const [valorInput, setValorInput] = useState('');

  const saldoAtual = calcularSaldoCaixinha(caixinhaBase, lancamentos);
  const totalEntradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
  const totalSaidas = lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);

  const openNew = () => {
    setEditId(null);
    setForm({ tipo: 'entrada', descricao: '', valor: 0, data: new Date().toISOString().split('T')[0], banco: '', observacao: '' });
    setValorInput('');
    setModalOpen(true);
  };

  const openEdit = (l: LancamentoCaixinha) => {
    setEditId(l.id);
    setForm({ tipo: l.tipo, descricao: l.descricao, valor: l.valor, data: l.data, banco: l.banco || '', observacao: l.observacao || '' });
    setValorInput(l.valor.toString());
    setModalOpen(true);
  };

  const handleSave = () => {
    const valor = parseFloat(valorInput.replace(',', '.'));
    if (!form.descricao.trim()) { toast.error('Informe a descricao'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }

    const entry: LancamentoCaixinha = {
      id: editId || generateId(),
      tipo: form.tipo,
      descricao: form.descricao,
      valor,
      data: form.data,
      banco: form.banco || undefined,
      observacao: form.observacao || undefined,
    };

    if (editId) {
      setLancamentos(prev => prev.map(l => l.id === editId ? entry : l));
      toast.success('Lancamento atualizado!');
    } else {
      setLancamentos(prev => [...prev, entry]);
      toast.success('Lancamento registrado!');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setLancamentos(prev => prev.filter(l => l.id !== deleteId));
    setDeleteId(null);
    toast.success('Lancamento excluido!');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <PiggyBank className="text-accent" size={24} />
        <h2 className="text-xl font-bold text-white">Caixinha do Nathan</h2>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
          <p className="text-sm text-accent mb-1">Saldo Atual</p>
          <p className="text-3xl font-bold text-accent">{formatCurrency(saldoAtual)}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <TrendingUp size={16} /> Entradas
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <TrendingDown size={16} /> Saidas
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalSaidas)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Historico</h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={18} /> Novo Lancamento
        </button>
      </div>

      {lancamentos.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <PiggyBank size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum lancamento na caixinha</p>
          <p className="text-sm">Registre entradas e saidas da sua reserva</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lancamentos.sort((a, b) => b.data.localeCompare(a.data)).map(l => (
            <div key={l.id} className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {l.tipo === 'entrada' ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400" />
                  )}
                  <span className="text-white font-medium">{l.descricao}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span>{formatDate(l.data)}</span>
                  {l.banco && (
                    <>
                      <span>•</span>
                      <BancoBadge bancoNome={l.banco} size="sm" />
                    </>
                  )}
                  {l.observacao && <><span>•</span><span>{l.observacao}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${l.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                  {l.tipo === 'entrada' ? '+' : '-'} {formatCurrency(l.valor)}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(l)} className="p-1.5 text-zinc-400 hover:text-white"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(l.id)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Lancamento' : 'Novo Lancamento'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm(prev => ({ ...prev, tipo: 'entrada' }))}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  form.tipo === 'entrada' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-surface-light text-zinc-400 border border-border'
                }`}
              >
                Entrada (Deposito)
              </button>
              <button
                onClick={() => setForm(prev => ({ ...prev, tipo: 'saida' }))}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  form.tipo === 'saida' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-surface-light text-zinc-400 border border-border'
                }`}
              >
                Saida (Retirada)
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Descricao</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Sobra do salario de marco"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Valor (R$)</label>
              <input
                type="text"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="400.00"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <BancoSelector
            label="Banco"
            value={form.banco}
            onChange={(banco) => setForm(prev => ({ ...prev, banco }))}
          />
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Observacao (opcional)</label>
            <input
              type="text"
              value={form.observacao}
              onChange={(e) => setForm(prev => ({ ...prev, observacao: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: guardei o que sobrou"
            />
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
        title="Excluir Lancamento"
        message="Tem certeza que deseja excluir este lancamento da caixinha?"
      />
    </div>
  );
}
