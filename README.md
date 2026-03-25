# Gastos do Nathan

Painel de controle financeiro pessoal. Todos os dados ficam salvos no localStorage do navegador.

## Requisitos

- Node.js 18+
- npm

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Deploy no Vercel

1. Suba este repositorio para sua conta no GitHub
2. Acesse [vercel.com](https://vercel.com) e faca login com sua conta GitHub
3. Clique em "New Project" e selecione este repositorio
4. Clique em "Deploy" (configuracoes padrao do Next.js ja funcionam)
5. Pronto! O app estara disponivel em uma URL tipo: `https://gastos-nathan.vercel.app`
6. Acesse de qualquer dispositivo com a URL gerada

## Importante

- Os dados ficam salvos **no navegador** (localStorage)
- Se voce limpar o cache do navegador, os dados serao perdidos
- Use a funcao **Exportar Dados (JSON)** nas Configuracoes para fazer backup
- Voce pode importar o backup a qualquer momento
