import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReturnRequestEntity, ReturnTypeValue } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { TRANSITION_RULES } from '../../domain/transition/return-transition-rules';
import { TransitionRule } from '../../domain/transition/transition-rule';
import { ReturnAction } from '../use-case/return-request.usecases';
import { PayloadValidationError } from '../../domain/errors';
import {
  CreateReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
} from '../dto/return-request.dto';
import {
  CreateReturnRequestUseCase,
  GetReturnRequestUseCase,
  ListReturnRequestsUseCase,
  TransitionReturnRequestUseCase,
  UpdateReturnRequestUseCase,
} from '../use-case/return-request.usecases';

@Injectable()
export class ReturnRequestService
  implements
    CreateReturnRequestUseCase,
    GetReturnRequestUseCase,
    ListReturnRequestsUseCase,
    UpdateReturnRequestUseCase,
    TransitionReturnRequestUseCase
{
  constructor(@Inject('RETURN_REQUEST_REPOSITORY') private readonly repositorio: ReturnRequestRepository) {}

  async criar(dto: CreateReturnRequestDto, customerId: string): Promise<ReturnRequestResponse> {
    if (dto.type !== 'DEVOLUTION' && dto.type !== 'EXCHANGE') {
      throw new PayloadValidationError('Invalid return type');
    }
    if (
      !Array.isArray(dto.items) ||
      dto.items.length === 0 ||
      dto.items.some(
        (item) =>
          typeof item.orderItemId !== 'string' ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      throw new PayloadValidationError('At least one valid return item is required');
    }
    const dataAtual = new Date();
    const solicitacao = new ReturnRequestEntity({
      id: randomUUID(),
      orderId: dto.orderId,
      customerId,
      productId: dto.productId,
      type: dto.type as ReturnTypeValue,
      reason: dto.reason.trim(),
      description: dto.description.trim(),
      status: ReturnStatus.from(ReturnStatusValue.REQUESTED),
      trackingCode: dto.trackingCode ?? null,
      inspectionResult: null,
      rejectionReason: null,
      adjustmentRequestedAt: null,
      adjustmentReason: null,
      version: 0,
      createdAt: dataAtual,
      updatedAt: dataAtual,
      deletedAt: null,
    });
    return this.paraResposta(await this.repositorio.create(solicitacao, dto.items));
  }

  async buscarPorId(id: string): Promise<ReturnRequestResponse> {
    const solicitacao = await this.buscarObrigatoria(id);
    return this.paraResposta(solicitacao);
  }

  async listarTodos(customerId?: string): Promise<ReturnRequestResponse[]> {
    const solicitacoes = await this.repositorio.findAll(customerId);
    return solicitacoes.map((s) => this.paraResposta(s));
  }

  async atualizar(id: string, dto: UpdateReturnRequestDto): Promise<ReturnRequestResponse> {
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    let entidade = this.paraEntidade(solicitacaoAtual);

    if (dto.reason !== undefined || dto.description !== undefined || dto.trackingCode !== undefined) {
      entidade = entidade.updateDetails({
        reason: dto.reason,
        description: dto.description,
        trackingCode: dto.trackingCode,
      });
    }

    const atualizada = await this.repositorio.update(entidade);
    return this.paraResposta(atualizada);
  }

  async transicionar(
    id: string,
    acao: ReturnAction,
    payload: unknown,
    actorId: string,
  ): Promise<ReturnRequestResponse> {
    const entidade = this.paraEntidade(await this.buscarObrigatoria(id));
    if (acao === 'create' || acao === 'list' || acao === 'read' || acao === 'update') {
      throw new Error(`Unsupported return transition action: ${acao}`);
    }
    return this.transicionarEntidade(entidade, acao, TRANSITION_RULES[acao], payload, actorId);
  }

  private async buscarObrigatoria(id: string) {
    const solicitacao = await this.repositorio.findById(id);
    if (!solicitacao) throw new NotFoundException('Return request not found');
    return solicitacao;
  }

  private paraEntidade(solicitacao: any): ReturnRequestEntity {
    return new ReturnRequestEntity({ ...solicitacao, status: ReturnStatus.from(solicitacao.status) });
  }

  private async transicionarEntidade(
    entidade: ReturnRequestEntity,
    acao: keyof typeof TRANSITION_RULES,
    regra: TransitionRule<any>,
    payload: unknown,
    actorId: string,
  ): Promise<ReturnRequestResponse> {
    const transicionada = entidade.transition(regra, payload);
    const auditFields: Partial<Record<keyof typeof TRANSITION_RULES, string>> = {
      reject: 'rejectionReason',
      requestAdjustment: 'adjustmentReason',
      cancel: 'justification',
    };
    const field = auditFields[acao];
    const payloadObject =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const suppliedJustification = field ? payloadObject[field] : undefined;
    const justification =
      typeof suppliedJustification === 'string'
        ? suppliedJustification.trim()
        : `Action: ${regra.name}`;
    const atualizada = await this.repositorio.updateWithVersion(
      transicionada,
      entidade.props.version,
      regra.from,
      entidade.props.status.getValue(),
      actorId,
      justification,
    );
    return this.paraResposta(atualizada);
  }

  private paraResposta(solicitacao: any): ReturnRequestResponse {
    return {
      ...solicitacao,
      type: solicitacao.type as ReturnTypeValue,
      status: solicitacao.status instanceof ReturnStatus ? solicitacao.status.getValue() : solicitacao.status,
    };
  }
}
