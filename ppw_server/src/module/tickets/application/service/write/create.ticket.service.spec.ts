import { CreateTicketService } from './create.ticket.service';

describe('CreateTicketService', () => {
  it('should normalize ticket payload to Prisma-safe values and create a ticket', async () => {
    const repository = {
      createTicket: jest.fn().mockResolvedValue({
        id: 'tk-020',
        title: 'Erro de impressora',
        description: 'Impressora prendendo papel',
        prioridade: 'BAIXA',
        status: 'ABERTO',
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      }),
    };

    const service = new CreateTicketService(repository as any);

    const result = await service.execute({
      id: 'tk-020',
      title: 'Erro de impressora',
      description: 'Impressora prendendo papel',
      priority: 'LOW',
    } as any);

    const createdEntity = repository.createTicket.mock.calls[0][0];

    expect(createdEntity.props).toEqual(
      expect.objectContaining({
        id: 'tk-020',
        title: 'Erro de impressora',
        description: 'Impressora prendendo papel',
      }),
    );

    expect(createdEntity.props.priority.getValue()).toBe('LOW');
    expect(createdEntity.props.status.getValue()).toBe('open');
    expect(result.priority).toBe('LOW');
    expect(result.status).toBe('open');
  });
});
