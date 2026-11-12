import { TicketManagement } from '@/components/modules/tickets/TicketManagement';

export const metadata = {
  title: 'Chamados & Suporte | PPW Portal',
  description: 'Gerenciamento de chamados técnicos de suporte e solicitações.',
};

export default function TicketsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <TicketManagement />
    </div>
  );
}
