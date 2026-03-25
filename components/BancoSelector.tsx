'use client';

import { BANCOS, BancoInfo } from '@/types';

interface BancoSelectorProps {
  value: string;
  onChange: (banco: string) => void;
  label?: string;
}

function BancoLogo({ banco, size = 'md' }: { banco: BancoInfo; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-9 h-9 text-xs';

  if (banco.id === 'inter') {
    return (
      <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-bold shrink-0`} style={{ backgroundColor: banco.cor, color: banco.corTexto }}>
        <svg viewBox="0 0 24 24" fill="none" className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}>
          <rect width="24" height="24" rx="4" fill="#FF7A00"/>
          <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" fill="#fff"/>
        </svg>
      </div>
    );
  }

  if (banco.id === '99pay') {
    return (
      <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-extrabold shrink-0`} style={{ backgroundColor: banco.cor, color: banco.corTexto }}>
        {banco.sigla}
      </div>
    );
  }

  if (banco.id === 'picpay') {
    return (
      <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-bold shrink-0`} style={{ backgroundColor: banco.cor, color: banco.corTexto }}>
        <svg viewBox="0 0 24 24" fill="none" className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2H9v-2h2v-2H9V9h3V7h2v2h1a3 3 0 010 6h-1v2h2v2h-4z" fill="#fff"/>
        </svg>
      </div>
    );
  }

  if (banco.id === 'sicoob') {
    return (
      <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-bold shrink-0`} style={{ backgroundColor: banco.cor, color: '#00A86B' }}>
        {banco.sigla}
      </div>
    );
  }

  if (banco.id === 'c6bank') {
    return (
      <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-extrabold shrink-0 border border-zinc-700`} style={{ backgroundColor: banco.cor, color: banco.corTexto }}>
        {banco.sigla}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-lg flex items-center justify-center font-bold shrink-0`} style={{ backgroundColor: banco.cor, color: banco.corTexto }}>
      {banco.sigla}
    </div>
  );
}

export function BancoBadge({ bancoNome, size = 'sm' }: { bancoNome: string; size?: 'sm' | 'md' }) {
  const banco = BANCOS.find(b => b.nome === bancoNome);
  if (!banco) return <span className="text-zinc-400 text-sm">{bancoNome}</span>;

  return (
    <div className="flex items-center gap-1.5">
      <BancoLogo banco={banco} size={size} />
      <span className="text-sm text-zinc-300">{banco.nome}</span>
    </div>
  );
}

export default function BancoSelector({ value, onChange, label }: BancoSelectorProps) {
  return (
    <div>
      {label && <label className="text-sm text-zinc-400 mb-2 block">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {BANCOS.map(banco => {
          const isSelected = value === banco.nome;
          return (
            <button
              key={banco.id}
              type="button"
              onClick={() => onChange(banco.nome)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-accent bg-accent/10 shadow-md shadow-accent/10 scale-105'
                  : 'border-border bg-surface-light hover:bg-surface-lighter hover:border-zinc-500'
              }`}
            >
              <BancoLogo banco={banco} />
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                {banco.nome}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
