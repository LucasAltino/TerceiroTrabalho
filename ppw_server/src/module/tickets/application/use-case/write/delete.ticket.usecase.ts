export const DELETE_TICKET_USECASE = 'DELETE_TICKET_USECASE';

export interface DeleteTicketUseCase {
  execute(id: string): Promise<void>;
}
