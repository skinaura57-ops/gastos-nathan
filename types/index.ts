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
  valorTotal?: number;
  formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro';
  banco: string;
  data: string;
  parcelas?: number;
  parcelaAtual?: number;
  parcelaGroupId?: string;
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
  banco?: string;
  observacao?: string;
}

export interface ValorAReceber {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
  data: string;
  recebido: boolean;
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

export interface BancoInfo {
  id: string;
  nome: string;
  cor: string;
  corTexto: string;
  sigla: string;
}

export const BANCOS: BancoInfo[] = [
  { id: 'inter', nome: 'Inter', cor: '#FF7A00', corTexto: '#fff', sigla: 'Inter' },
  { id: '99pay', nome: '99pay', cor: '#FFDD00', corTexto: '#000', sigla: '99' },
  { id: 'picpay', nome: 'PicPay', cor: '#21C25E', corTexto: '#fff', sigla: 'Pic' },
  { id: 'sicoob', nome: 'Sicoob', cor: '#003641', corTexto: '#fff', sigla: 'Sic' },
  { id: 'c6bank', nome: 'C6 Bank', cor: '#1A1A1A', corTexto: '#CEFF00', sigla: 'C6' },
];

export const BANCOS_COMUNS = BANCOS.map(b => b.nome);
