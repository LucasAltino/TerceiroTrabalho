'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ticketsApi, Ticket, CreateTicketPayload, UpdateTicketPayload } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // Form state for Create
  const [createForm, setCreateForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'open',
    justify: '',
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState<UpdateTicketPayload>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'open',
    justify: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.list();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao buscar tickets:', err);
      setError(err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'open'
            ? t.status === 'open' || t.status === 'in_progress'
            : t.status === 'closed';

      const matchesPriority = priorityFilter === 'all' ? true : t.priority.toUpperCase() === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const closed = tickets.filter((t) => t.status === 'closed').length;
    const high = tickets.filter((t) => t.priority.toUpperCase() === 'HIGH').length;
    return { total, open, closed, high };
  }, [tickets]);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      alert('Por favor, preencha o título e a descrição.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ticketsApi.create({
        ...createForm,
        id: createForm.id?.trim() || undefined,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        justify: createForm.justify?.trim() || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'open',
        justify: '',
      });
      await fetchTickets();
    } catch (err: any) {
      alert(`Erro ao criar chamado: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      justify: ticket.justify || '',
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    setIsSubmitting(true);
    try {
      await ticketsApi.update(editingTicket.id, {
        title: editForm.title?.trim(),
        description: editForm.description?.trim(),
        priority: editForm.priority,
        status: editForm.status,
        justify: editForm.justify?.trim() || null,
      });
      setEditingTicket(null);
      await fetchTickets();
    } catch (err: any) {
      alert(`Erro ao atualizar chamado: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (ticket: Ticket) => {
    const nextStatus = ticket.status === 'closed' ? 'open' : 'closed';
    try {
      await ticketsApi.updateStatus(ticket.id, nextStatus);
      await fetchTickets();
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingTicket) return;
    setIsSubmitting(true);
    try {
      await ticketsApi.delete(deletingTicket.id);
      setDeletingTicket(null);
      await fetchTickets();
    } catch (err: any) {
      alert(`Erro ao excluir chamado: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <TicketIcon className="h-4 w-4" />
            <span>Módulo de Atendimento</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Gestão de Chamados (Tickets)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Abra, liste, atualize e gerencie chamados técnicos de suporte e solicitações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Chamado</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total de Chamados</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TicketIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Em Aberto</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.open}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Concluídos</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats.closed}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Alta Prioridade</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{stats.high}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-background/80 text-xs">
            <span className="px-2 text-muted-foreground font-medium">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'open'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Abertos
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Concluídos
            </button>
          </div>

          {/* Priority selector */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-background/80 text-xs">
            <span className="px-2 text-muted-foreground font-medium">Prioridade:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="all">Todas</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* List / Cards of Tickets */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            Tentar Novamente
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-border/50 bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
            <TicketIcon className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Nenhum chamado encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Tente ajustar os filtros ou o termo de pesquisa.'
              : 'Nenhum chamado foi aberto ainda. Crie o primeiro agora mesmo.'}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            <span>Criar Chamado</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const isClosed = ticket.status === 'closed';
            const priorityBadge = {
              HIGH: { bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Alta' },
              MEDIUM: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Média' },
              LOW: { bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: 'Baixa' },
            }[ticket.priority.toUpperCase()] || {
              bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
              label: ticket.priority,
            };

            return (
              <Card
                key={ticket.id}
                className="group border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground font-medium">
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityBadge.bg}`}
                      >
                        {priorityBadge.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          isClosed
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isClosed ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'
                          }`}
                        />
                        {isClosed ? 'Concluído' : 'Aberto'}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground leading-snug pt-1">
                      {ticket.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{ticket.description}</p>

                  {ticket.justify && (
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50 text-[11px] text-muted-foreground">
                      <strong className="text-foreground font-medium">Justificativa:</strong> {ticket.justify}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Hoje'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={isClosed ? 'outline' : 'secondary'}
                        onClick={() => handleToggleStatus(ticket)}
                        className="h-8 text-xs font-medium"
                      >
                        {isClosed ? 'Reabrir' : 'Concluir'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(ticket)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Alterar Chamado"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingTicket(ticket)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                        title="Excluir Chamado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: INCLUIR (CRIAR) NOVO CHAMADO */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Abrir Novo Chamado"
        description="Preencha as informações para registrar uma nova solicitação no sistema."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Título do Chamado <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="Ex: Erro ao emitir comprovante de pagamento"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descrição Detalhada <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva o problema ou solicitação com o máximo de detalhes..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prioridade</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Status Inicial</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="open">Aberto</option>
                <option value="closed">Concluído</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Justificativa (Opcional)</label>
            <Input
              placeholder="Ex: Cliente prioritário / impacto na operação"
              value={createForm.justify || ''}
              onChange={(e) => setCreateForm({ ...createForm, justify: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Identificador Personalizado (Opcional)
            </label>
            <Input
              placeholder="Deixe em branco para gerar UUID automático"
              value={createForm.id || ''}
              onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Chamado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ALTERAR (EDITAR) CHAMADO */}
      <Modal
        isOpen={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title="Alterar Chamado"
        description={`Editando chamado #${editingTicket?.id.slice(0, 8)}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Título do Chamado <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descrição Detalhada <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prioridade</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="open">Aberto</option>
                <option value="closed">Concluído</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Justificativa</label>
            <Input
              value={editForm.justify || ''}
              onChange={(e) => setEditForm({ ...editForm, justify: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingTicket(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EXCLUIR (CONFIRMAÇÃO) */}
      <Modal
        isOpen={!!deletingTicket}
        onClose={() => setDeletingTicket(null)}
        title="Confirmar Exclusão"
        description="Esta ação removerá o chamado permanentemente da base de dados."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Tem certeza que deseja excluir?</p>
              <p className="mt-0.5 text-muted-foreground">
                Chamado: &ldquo;{deletingTicket?.title}&rdquo; (#{deletingTicket?.id.slice(0, 8)})
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeletingTicket(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir Definitivamente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
