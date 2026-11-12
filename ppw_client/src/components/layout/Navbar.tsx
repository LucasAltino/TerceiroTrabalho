'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones, RotateCcw, Home as HomeIcon, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Início',
      icon: HomeIcon,
      badge: null,
    },
    {
      href: '/tickets',
      label: 'Chamados',
      icon: Headphones,
      badge: 'Suporte',
    },
    {
      href: '/returns',
      label: 'Devoluções & Trocas',
      icon: RotateCcw,
      badge: 'E-commerce',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-foreground font-black text-base leading-none">
                PPW Portal
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">
                Clean Arch • Nest & Next
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md border',
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/60 bg-muted text-muted-foreground',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>API Online (:8000)</span>
          </div>

          <Link
            href="/tickets"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gerenciar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
