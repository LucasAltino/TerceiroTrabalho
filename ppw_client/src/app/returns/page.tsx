import { ReturnManagement } from '@/components/modules/returns/ReturnManagement';

export const metadata = {
  title: 'Devoluções & Trocas | PPW Portal',
  description: 'Gerenciamento de solicitações de devoluções e trocas de mercadorias no e-commerce.',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <ReturnManagement />
    </div>
  );
}
