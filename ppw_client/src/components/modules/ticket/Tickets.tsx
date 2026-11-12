'use client';

import React from 'react';
import { TicketsCard } from '../../cards/TicketsCard';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

type TicketForm = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
};

export default function TicketsPages() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [form, setForm] = React.useState<TicketForm>({
    id: '',
    title: '',
    description: '',
    priority: '',
    status: '',
  });

  const fetchTickets = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/tickets');
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
    }
  }, []);

  React.useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      id: form.id || crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority.trim() || 'medium',
      status: form.status.trim() || 'open',
    };

    if (!payload.title || !payload.description) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar ticket');
      }

      setForm({ id: '', title: '', description: '', priority: '', status: '' });
      await fetchTickets();
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    const nextStatus = status === 'open' || status === 'in_progress' || status === 'closed' ? status : 'open';

    try {
      const response = await fetch(`http://localhost:8000/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await fetchTickets();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  }

  async function handleDeleteTicket(id: string) {
    try {
      const response = await fetch(`http://localhost:8000/tickets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir ticket');
      }

      await fetchTickets();
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
    }
  }

  return (
    <main className="container max-w-4xl mx-auto py-12 px-4 text-center space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">Sistema de Registro de Chamadas</h1>
        <p className="text-muted-foreground">Abra chamados para obter suporte.</p>
      </section>

      <form
        onSubmit={handleCreateTicket}
        className="p-6 border rounded-lg bg-card max-w-lg mx-auto space-y-4 text-left shadow-md mt-6"
      >
        <Input
          type="text"
          placeholder="Digite o identificador do chamado"
          value={form.id}
          onChange={(e) => setForm((current) => ({ ...current, id: e.target.value }))}
        />
        <Input
          type="text"
          placeholder="Digite o titulo do chamado"
          value={form.title}
          onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
        />
        <Input
          type="text"
          placeholder="Digite a descrição do chamado"
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
        />
        <Input
          type="text"
          placeholder="Digite a prioridade do chamado"
          value={form.priority}
          onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value }))}
        />
        <Input
          type="text"
          placeholder="Digite o status do chamado"
          value={form.status}
          onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
        />

        <Button type="submit" className="w-full">
          Abrir Chamado
        </Button>
      </form>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
        ) : (
          tickets.map((ticket: any) => (
            <TicketsCard
              key={ticket.id}
              ticket={ticket}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTicket}
            />
          ))
        )}
      </div>
    </main>
  );
}
