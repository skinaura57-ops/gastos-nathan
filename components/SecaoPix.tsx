'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import { LancamentoPix, LancamentoCaixinha, CATEGORIAS } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/formatters';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import BancoSelector, { BancoBadge } from './BancoSelector';
import { toast } from 'sonner';

interface SecaoPixProps {
  pix: LancamentoPix[];
  setPix: (p: LancamentoPix[] | ((prev: LancamentoPix[]) => LancamentoPix[])) => void;
  caixinhaLancamentos: LancamentoCaixinha[];
  setCaixinhaLancamentos: (l: LancamentoCaixinha[] | ((prev: LancamentoCaixinha[]) => LancamentoCaixinha[])) => void;
}

export default function SecaoPix({ pix, setPix, caixinhaLancamentos, setCaixinhaLancamentos }: SecaoPixProps) {
  const [subTab, setSubTab] = useState<'entrada' | 'saida'>('entrada');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    contraparte: '',
    banco: '',
    categoria: 'Outros',
  });
  const [valorInput, setValorInput] = useState('');

  const entradas = pix.filter(p => p.tipo === 'entrada');
  const saidas = pix.filter(p => p.tipo === 'saida');
  const totalEntradas = entradas.reduce((s, p) => s + p.valor, 0);
  const totalSaidas = saidas.reduce((s, p) => s + p.valor, 0);
  const currentList = subTab === 'entrada' ? entradas : saidas;

  const openNew = () => {
    setEditId(null);
    setForm({
      tipo: subTab,
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      contraparte: '',
      banco: '',
      categoria: 'Outros',
    });
    setValorInput('');
    setModalOpen(true);
  };

  const openEdit = (p: LancamentoPix) => {
    setEditId(p.id);
    setForm({
      tipo: p.tipo,
      descricao: p.descricao,
      valor: p.valor,
      data: p.data,
      contraparte: p.contraparte,
      banco: p.banco || '',
      categoria: p.categoria || 'Outros',
    });
    setValorInput(p.valor.toString());
    setModalOpen(true);
  };

  const handleSave = () => {
    const valor = parseFloat(valorInput.replace(',', '.'));
    if (!form.descricao.trim()) { toast.error('Informe a descricao'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Valor invalido'); return; }
    if (!form.contraparte.trim()) { toast.error('Informe a origem/destino'); return; }

    const entry: LancamentoPix = {
      id: editId || generateId(),
      tipo: form.tipo,
      descricao: form.descricao,
      valor,
      data: form.data,
      contraparte: form.contraparte,
      banco: form.banco || undefined,
      categoria: form.tipo === 'saida' ? form.categoria : undefined,
    };

    if (editId) {
      setPix(prev => prev.map(p => p.id === editId ? entry : p));
      toast.success('PIX atualizado!');
    } else {
      setPix(prev => [...prev, entry]);

      // Integrar com caixinha automaticamente
      if (form.tipo === 'entrada') {
        setCaixinhaLancamentos(prev => [...prev, {
          id: generateId(),
          tipo: 'entrada',
          descricao: `PIX recebido: ${form.descricao}`,
          valor,
          data: form.data,
          banco: form.banco || undefined,
          observacao: `De ${form.contraparte}`,
        }]);
        toast.success('PIX recebido e adicionado na caixinha!');
      } else {
        setCaixinhaLancamentos(prev => [...prev, {
          id: generateId(),
          tipo: 'saida',
          descricao: `PIX enviado: ${form.descricao}`,
          valor,
          data: form.data,
          banco: form.banco || undefined,
          observacao: `Para ${form.contraparte}`,
        }]);
        toast.success('PIX enviado e descontado da caixinha!');
      }
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPix(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success('PIX excluido!');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Repeat className="text-accent" size={24} />
        <h2 className="text-xl font-bold text-white">PIX</h2>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <ArrowDownLeft size={18} /> Entradas
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <ArrowUpRight size={18} /> Saidas
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalSaidas)}</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 border border-border">
        <button
          onClick={() => setSubTab('entrada')}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
            subTab === 'entrada' ? 'bg-green-500/20 text-green-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          PIX Credito (Entradas)
        </button>
        <button
          onClick={() => setSubTab('saida')}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
            subTab === 'saida' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          PIX Debito (Saidas)
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={18} /> Registrar PIX
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Repeat size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum PIX {subTab === 'entrada' ? 'recebido' : 'enviado'} neste mes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.sort((a, b) => b.data.localeCompare(a.data)).map(p => (
            <div key={p.id} className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {p.tipo === 'entrada' ? (
                    <ArrowDownLeft size={16} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={16} className="text-red-400" />
                  )}
                  <span className="text-white font-medium">{p.descricao}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                  <span>{formatDate(p.data)}</span>
                  <span>•</span>
                  <span>{p.tipo === 'entrada' ? 'De' : 'Para'}: {p.contraparte}</span>
                  {p.banco && (
                    <>
                      <span>•</span>
                      <BancoBadge bancoNome={p.banco} size="sm" />
                    </>
                  )}
                  {p.categoria && (
                    <>
                      <span>•</span>
                      <span>{p.categoria}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${p.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                  {p.tipo === 'entrada' ? '+' : '-'} {formatCurrency(p.valor)}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-400 hover:text-white"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar PIX' : 'Registrar PIX'}>
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
                Entrada (Recebido)
              </button>
              <button
                onClick={() => setForm(prev => ({ ...prev, tipo: 'saida' }))}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  form.tipo === 'saida' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-surface-light text-zinc-400 border border-border'
                }`}
              >
                Saida (Enviado)
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
              placeholder="Ex: Reembolso do Pedro"
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
                placeholder="80.00"
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
            <label className="text-sm text-zinc-400 mb-1 block">
              {form.tipo === 'entrada' ? 'Origem (quem enviou)' : 'Destino (para quem)'}
            </label>
            <input
              type="text"
              value={form.contraparte}
              onChange={(e) => setForm(prev => ({ ...prev, contraparte: e.target.value }))}
              className="bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white w-full focus:outline-none focus:border-accent"
              placeholder={form.tipo === 'entrada' ? 'Pedro Silva' : 'Imobiliaria XYZ'}
            />
          </div>
          <BancoSelector
            label="Banco"
            value={form.banco}
            onChange={(banco) => setForm(prev => ({ ...prev, banco }))}
          />
          {form.tipo === 'saida' && (
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
          )}
          {!editId && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
              {form.tipo === 'entrada'
                ? 'PIX recebido sera adicionado automaticamente na caixinha'
                : 'PIX enviado sera descontado automaticamente da caixinha'}
            </div>
          )}
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
        title="Excluir PIX"
        message="Tem certeza que deseja excluir esta transacao PIX?"
      />
    </div>
  );
}
