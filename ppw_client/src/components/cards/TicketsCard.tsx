import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ticketCardProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'closed';
  };
  onUpdateStatus?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export function TicketsCard({ ticket, onUpdateStatus, onDelete }: ticketCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-base font-bold">{ticket.title}</CardTitle>
        <Badge variant={ticket.priority === 'high' ? 'destructive' : 'secondary'}>{ticket.priority}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{ticket.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span
            className={
              ticket.status === 'open'
                ? 'text-green-600'
                : ticket.status === 'in_progress'
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }
          >
            {ticket.status}
          </span>
          <div className="flex gap-2">
            {ticket.status === 'open' && (
              <Button onClick={() => onUpdateStatus?.(ticket.id, 'closed')}>Concluir</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDelete?.(ticket.id)}>
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
