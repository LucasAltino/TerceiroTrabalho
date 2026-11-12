'use client';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import React from 'react';

export function LeadForm() {
  const [email, setEmail] = React.useState<string>('');
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error' | 'idle'>('idle');

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('http://localhost:8000/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Erro ao enviar email');
      {
        setStatus('success');
        setEmail('');
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setStatus('error');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex">
      <Input type="email" placeholder="Seu email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <Button type="submit" className="ml-2" disabled={status === 'loading'}>
        {status === 'loading'
          ? 'Enviando...'
          : status === 'success'
            ? 'Enviado!'
            : status === 'error'
              ? 'Erro!'
              : 'Enviar'}
      </Button>
      {status === 'success' && <p className="text-sm text-green-600">Email enviado com sucesso!</p>}
      {status === 'error' && (
        <p className="text-sm text-red-600">Ocorreu um erro ao enviar o email. Tente novamente.</p>
      )}
    </form>
  );
}
