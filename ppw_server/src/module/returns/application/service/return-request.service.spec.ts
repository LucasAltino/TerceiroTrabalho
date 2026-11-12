import { ReturnRequestService } from './return-request.service';

const criarRegistro = (status = 'REQUESTED', substituicoes: any = {}) => ({
  id: 'rr-1', orderId: 'o-1', customerId: 'c-1', productId: 'p-1', type: 'DEVOLUTION',
  reason: 'Damaged', description: 'Box opened', status, trackingCode: null,
  inspectionResult: null, rejectionReason: null, createdAt: new Date(), updatedAt: new Date(), ...substituicoes,
});

describe('ReturnRequestService', () => {
  let repositorio: any;
  let servico: ReturnRequestService;
  beforeEach(() => {
    repositorio = { create: jest.fn(async (solicitacao) => criarRegistro('REQUESTED', { id: solicitacao.props.id })),
      findById: jest.fn(), update: jest.fn(async (solicitacao) => criarRegistro(solicitacao.props.status.getValue(), solicitacao.props)) };
    servico = new ReturnRequestService(repositorio);
  });

  it('creates a request as REQUESTED', async () => {
    const resposta = await servico.criar({ orderId: 'o-1', customerId: 'c-1', productId: 'p-1', type: 'EXCHANGE', reason: 'Size', description: 'Too small' });
    expect(resposta.status).toBe('REQUESTED');
    expect(repositorio.create).toHaveBeenCalledTimes(1);
  });

  it('finds an existing request', async () => {
    repositorio.findById.mockResolvedValue(criarRegistro());
    expect(await servico.buscarPorId('rr-1')).toMatchObject({ id: 'rr-1', status: 'REQUESTED' });
  });

  it('rejects invalid status transitions', async () => {
    repositorio.findById.mockResolvedValue(criarRegistro());
    await expect(servico.atualizarStatus('rr-1', { status: 'RECEIVED' })).rejects.toThrow('Invalid return transition');
    expect(repositorio.update).not.toHaveBeenCalled();
  });

  it('registers an approved inspection', async () => {
    repositorio.findById.mockResolvedValue(criarRegistro('RECEIVED'));
    const resposta = await servico.registrarInspecao('rr-1', { approved: true, result: 'Product intact' });
    expect(resposta.status).toBe('APPROVED');
    expect(resposta.inspectionResult).toBe('Product intact');
  });

  it('registers a rejected inspection', async () => {
    repositorio.findById.mockResolvedValue(criarRegistro('RECEIVED'));
    const resposta = await servico.registrarInspecao('rr-1', { approved: false, result: 'Seal broken', rejectionReason: 'Seal broken' });
    expect(resposta.status).toBe('REJECTED');
    expect(resposta.rejectionReason).toBe('Seal broken');
  });

  it('prevents changes after completion or rejection', async () => {
    repositorio.findById.mockResolvedValue(criarRegistro('COMPLETED'));
    await expect(servico.atualizarStatus('rr-1', { status: 'POSTED' })).rejects.toThrow('Invalid return transition');
    repositorio.findById.mockResolvedValue(criarRegistro('REJECTED'));
    await expect(servico.atualizarStatus('rr-1', { status: 'COMPLETED' })).rejects.toThrow('Invalid return transition');
  });
});
