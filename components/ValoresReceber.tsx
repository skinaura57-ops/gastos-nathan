'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Check, Clock, DollarSign } from 'lucide-react';
import { ValorAReceber } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/formatters';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'sonner';

interface ValoresReceberProps {
  valores: ValorAReceber[];
  setValores: (v: ValorAReceber[] | ((prev: ValorAReceber[]) => ValorAReceber[])) => void;
}

export default function ValoresReceber({ valores, setValores }: ValoresReceberProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  });

  const pendentes = valores.filter(v => !v.recebido);
  const recebidos = valores.filter(v => v.recebido);
  const totalPendente = pendentes.reduce((s, v) => s + v.valor, 0);
  const totalRecebido = recebidos.reduce((s, v) => s + v.valor, 0);

  const openNew = () => {
    setEditId(null);
    setForm({ nome: '', valor: '', descricao: '', data: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (v: ValorAReceber) => {
    setEditId(v.id);
    setForm({ nome: v.nome, valor: v.valor.toString(), descricao: v.descricao, data: v.data });
    setModalOpen(true);
  };

  const handleSave = () => {
    const valor = parseFloat(form.valor.replace(',', '.'));
    if (!form.nome.trim()) { toast.error('Informe o nome da pessoa'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }

    if (editId) {
      setValores(prev => prev.map(v => v.id === editId ? { ...v, nome: form.nome, valor, descricao: form.descricao, data: form.data } : v));
      toast.success('Valor atualizado!');
    } else {
      setValores(prev => [...prev, {
        id: generateId(),
        nome: form.nome,
        valor,
        descricao: form.descricao,
        data: form.data,
        recebido: false,
      }]);
      toast.success('Valor a receber adicionado!');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setValores(prev => prev.filter(v => v.id !== deleteId));
    setDeleteId(null);
    toast.success('Removido!');
  };

  const toggleRecebido = (id: string) => {
    setValores(prev => prev.map(v => {
      if (v.id !== id) return v;
      const novoStatus = !v.recebido;
      if (novoStatus) toast.success(`Valor de ${v.nome} marcado como recebido!`);
      return { ...v, recebido: novoStatus };
    }));
  };

  // Agrupar por pessoa
  const porPessoa = pendentes.reduce((acc, v) => {
    if (!acc[v.nome]) acc[v.nome] = [];
    acc[v.nome].push(v);
    return acc;
  }, {} as Record<string, ValorAReceber[]>);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-accent" size={24} />
          <h2 className="text-xl font-bold text-white">Valores a Receber</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={18} /> Adicionar Devedor
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Clock size={18} /> A Receber
          </div>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalPendente)}</p>
          <p className="text-sm text-zinc-500">{pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Check size={18} /> Ja Recebido
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRecebido)}</p>
          <p className="text-sm text-zinc-500">{recebidos.length} recebido{recebidos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Lista agrupada por pessoa */}
      {Object.keys(porPessoa).length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-white">Pendentes por Pessoa</h3>
          {Object.entries(porPessoa).map(([nome, items]) => {
            const totalPessoa = items.reduce((s, v) => s + v.valor, 0);
            return (
              <div key={nome} className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-light">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-lg">
                      {nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{nome}</p>
                      <p className="text-xs text-zinc-500">{items.length} valor{items.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <p className="text-yellow-400 font-bold text-lg">{formatCurrency(totalPessoa)}</p>
                </div>
                <div className="divide-y divide-border/50">
                  {items.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1">
                        <p className="text-zinc-300 text-sm">{v.descricao || 'Sem descricao'}</p>
                        <p className="text-xs text-zinc-500">{formatDate(v.data)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{formatCurrency(v.valor)}</span>
                        <button
                          onClick={() => toggleRecebido(v.id)}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          title="Marcar como recebido"
                        >
                          <Check size={16} />
                        </button>
                        <button onClick={() => openEdit(v)} className="p-1.5 text-zinc-400 hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(v.id)} className="p-1.5 text-zinc-400 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pendentes.length === 0 && recebidos.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum valor a receber cadastrado</p>
          <p className="text-sm">Adicione pessoas que te devem dinheiro</p>
        </div>
      )}

      {/* Recebidos */}
      {recebidos.length > 0 && (
        <div>
          <h3 className="font-semibold text-zinc-400 mb-3">Ja Recebidos</h3>
          <div className="space-y-2">
            {recebidos.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-surface rounded-lg border border-border/50 px-4 py-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-zinc-300 text-sm"><strong>{v.nome}</strong> — {v.descricao || 'Sem descricao'}</p>
                    <p className="text-xs text-zinc-500">{formatDate(v.data)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-medium line-through">{formatCurrency(v.valor)}</span>
                  <button
                    onClick={() => toggleRecebido(v.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-yellow-400 transition-colors"
                    title="Marcar como pendente"
                  >
                    <Clock size={14} />
                  </button>
                  <button onClick={() => setDeleteId(v.id)} className="p-1.5 text-zinc-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Valor' : 'Novo Valor a Receber'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Nome da Pessoa</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Pedro, Maria..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Valor (R$)</label>
              <input
                type="text"
                value={form.valor}
                onChange={(e) => setForm(prev => ({ ...prev, valor: e.target.value }))}
                className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
                placeholder="150.00"
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
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Descricao / Motivo</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder="Ex: Almoco dividido, emprestimo..."
            />
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
        title="Excluir"
        message="Tem certeza que deseja excluir este valor?"
      />
    </div>
  );
}
