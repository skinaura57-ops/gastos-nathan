export interface Config {
  salario: number;
  mesAtual: string;
  caixinhaBase: number;
  limites: {
    [categoria: string]: {
      tipo: 'fixo' | 'percentual';
      valor: number;
    };
  };
}

export interface GastoFixo {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro';
  banco: string;
  diaVencimento: number;
  ativo: boolean;
  pago: boolean;
}

export interface GastoVariavel {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro';
  banco: string;
  data: string;
  observacao?: string;
}

export interface LancamentoPix {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  contraparte: string;
  categoria?: string;
}

export interface LancamentoCaixinha {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  observacao?: string;
}

export const CATEGORIAS = [
  'Alimentacao',
  'Delivery',
  'Transporte',
  'Moradia',
  'Saude',
  'Lazer',
  'Assinatura',
  'Educacao',
  'Compras',
  'Roupas',
  'Outros',
] as const;

export const FORMAS_PAGAMENTO = [
  { value: 'credito', label: 'Credito' },
  { value: 'debito', label: 'Debito' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
] as const;

export const BANCOS_COMUNS = [
  'Nubank',
  'Inter',
  'Bradesco',
  'Itau',
  'Santander',
  'Caixa',
  'Banco do Brasil',
  'C6 Bank',
  'PicPay',
  'Mercado Pago',
] as const;
