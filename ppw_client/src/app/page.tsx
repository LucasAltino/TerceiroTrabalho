'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Headphones, RotateCcw, Sparkles, ArrowRight, CheckCircle2, Send, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { leadsApi } from '@/lib/api';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [leadMessage, setLeadMessage] = useState('');

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLeadStatus('loading');
    try {
      const res = await leadsApi.create(email.trim());
      setLeadStatus('success');
      setLeadMessage(res.message || 'Cadastro realizado com sucesso!');
      setEmail('');
    } catch (err: any) {
      setLeadStatus('error');
      setLeadMessage(err.message || 'Não foi possível cadastrar no momento.');
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-12 animate-in fade-in duration-300">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-card via-card/90 to-background p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Arquitetura Limpa • NestJS + Next.js 15</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
            Plataforma Integrada de Gestão de Atendimento & Logística Reversa
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Sistema corporativo moderno implementado com os princípios de <strong>Clean Architecture</strong>, separando
            regras de negócio em camadas desacopladas (Domain, Application, Infrastructure e Presentation), com
            interface interativa completa para operações de <strong>Listar</strong>, <strong>Incluir</strong>,{' '}
            <strong>Alterar</strong> e <strong>Excluir</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/tickets">
              <Button
                size="lg"
                className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                <Headphones className="h-4 w-4" />
                <span>Gerenciar Chamados</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>

            <Link href="/returns">
              <Button size="lg" variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>Devoluções & Trocas</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MODULE CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Tickets */}
        <Card className="group relative overflow-hidden border-border/70 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Headphones className="h-6 w-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Módulo 1 • Suporte</span>
              <h2 className="text-2xl font-bold text-foreground mt-0.5">Chamados (Tickets)</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Gestão completa de chamados técnicos e suporte com priorização (Alta, Média, Baixa), status de resolução
                (Aberto, Concluído), filtros por pesquisa e justificativas de atendimento.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Formulário de inclusão com validação imediata</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Alteração completa de dados e ação rápida de conclusão</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Exclusão segura com diálogo de confirmação</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-border/50">
              <Link href="/tickets">
                <Button className="w-full gap-2">
                  <span>Acessar Painel de Chamados</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Returns */}
        <Card className="group relative overflow-hidden border-border/70 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 to-emerald-500" />
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <RotateCcw className="h-6 w-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Módulo 2 • E-commerce</span>
              <h2 className="text-2xl font-bold text-foreground mt-0.5">Devoluções & Trocas</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Logística reversa corporativa com esteira de estados (Solicitado → Postado → Recebido → Em Inspeção →
                Aprovado / Rejeitado → Concluído), laudo técnico e código de rastreamento.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Máquina de estados estrita validada no Domain Entity</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Inspeção técnica com parecer, aprovação ou recusa fundamentada</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Atualização de rastreio e remoção de registros</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-border/50">
              <Link href="/returns">
                <Button variant="secondary" className="w-full gap-2 font-semibold">
                  <span>Acessar Devoluções & Trocas</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ARCHITECTURE HIGHLIGHT */}
      <section className="p-8 sm:p-10 rounded-3xl border border-border/60 bg-muted/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <Code2 className="h-4 w-4" />
              <span>Padrões de Engenharia</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              Camadas da Arquitetura Limpa (Clean Architecture)
            </h3>
          </div>
          <div className="text-xs text-muted-foreground max-w-sm">
            Estrutura implementada no backend NestJS sem acoplamento entre regras de negócio e infraestrutura.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Camada 1</span>
            <h4 className="font-bold text-foreground text-sm">Domain</h4>
            <p className="text-xs text-muted-foreground">
              Entidades de negócio puras (<code>TicketEntity</code>, <code>ReturnRequestEntity</code>), Value Objects de
              validação e interfaces de portas (<code>Ports</code>).
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Camada 2</span>
            <h4 className="font-bold text-foreground text-sm">Application</h4>
            <p className="text-xs text-muted-foreground">
              Casos de Uso (<code>UseCases</code>), DTOs de entrada/saída e serviços de orquestração do fluxo sem
              dependência do framework HTTP.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Camada 3</span>
            <h4 className="font-bold text-foreground text-sm">Infrastructure</h4>
            <p className="text-xs text-muted-foreground">
              Adaptadores (<code>Adapters</code>) com Prisma ORM conectando ao PostgreSQL, implementando as interfaces
              definidas pelo Domain.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Camada 4</span>
            <h4 className="font-bold text-foreground text-sm">Presentation</h4>
            <p className="text-xs text-muted-foreground">
              Controllers REST desacoplados que injetam estritamente Use Cases por injeção de dependência (
              <code>@Inject</code>) e tokens.
            </p>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE SECTION */}
      <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-card via-card to-primary/5 p-8 sm:p-10">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Send className="h-5 w-5" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Receba Atualizações & Novidades</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Cadastre seu e-mail para acompanhar as novidades dos módulos e novos lançamentos do curso.
          </p>

          <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <Input
              type="email"
              required
              placeholder="Digite seu e-mail principal..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/90"
              disabled={leadStatus === 'loading'}
            />
            <Button type="submit" disabled={leadStatus === 'loading'} className="gap-2 shrink-0">
              <Send className="h-4 w-4" />
              <span>{leadStatus === 'loading' ? 'Cadastrando...' : 'Cadastrar'}</span>
            </Button>
          </form>

          {leadMessage && (
            <p
              className={`text-xs font-medium pt-1 ${leadStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {leadMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
