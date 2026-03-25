import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gastos do Nathan',
  description: 'Painel de controle financeiro pessoal',
  manifest: '/manifest.json',
  themeColor: '#0f0f1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: '#2a2a3e',
              border: '1px solid #3a3a5c',
              color: '#e4e4e7',
            },
          }}
        />
      </body>
    </html>
  );
}
