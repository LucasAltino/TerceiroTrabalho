import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'PPW Portal • Gestão de Chamados, Devoluções & Trocas',
  description: 'Sistema empresarial desenvolvido em Clean Architecture com NestJS e Next.js 15.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-muted/10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>PPW Portal • Tecnologia em Sistemas para Internet</span>
            <span>NestJS (Clean Architecture) & Next.js 15 (Tailwind + Shadcn)</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
