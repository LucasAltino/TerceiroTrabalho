import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReturnRequestEntity, ReturnRequestRecord } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { TRANSITION_RULES } from '../../domain/transition/return-transition-rules';
import { TransitionPayload } from '../../domain/transition/return-transition-rules';
import { TransitionAction } from '../use-case/return-request.usecases';
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
    if (!dto || typeof dto !== 'object' || (dto.type !== 'DEVOLUTION' && dto.type !== 'EXCHANGE')) {
      throw new PayloadValidationError('Invalid return type');
    }
    if (
      !Array.isArray(dto.items) ||
      dto.items.length === 0 ||
      dto.items.some(
        (item) =>
          !item ||
          typeof item !== 'object' ||
          typeof item.orderItemId !== 'string' ||
          item.orderItemId.trim().length === 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      throw new PayloadValidationError('At least one valid return item is required');
    }
    if (
      !hasText(dto.orderId) ||
      !hasText(dto.productId) ||
      !hasText(dto.reason) ||
      !hasText(dto.description) ||
      (dto.trackingCode !== undefined &&
        dto.trackingCode !== null &&
        !hasText(dto.trackingCode))
    ) {
      throw new PayloadValidationError('orderId, productId, reason, and description are required');
    }
    const dataAtual = new Date();
    const solicitacao = new ReturnRequestEntity({
      id: randomUUID(),
      orderId: dto.orderId.trim(),
      customerId,
      productId: dto.productId.trim(),
      type: dto.type,
      reason: dto.reason.trim(),
      description: dto.description.trim(),
      status: ReturnStatus.from(ReturnStatusValue.REQUESTED),
      trackingCode: dto.trackingCode?.trim() ?? null,
      inspectionResult: null,
      rejectionReason: null,
      adjustmentRequestedAt: null,
      adjustmentReason: null,
      version: 0,
      createdAt: dataAtual,
      updatedAt: dataAtual,
      deletedAt: null,
    });
    const items = dto.items.map((item) => ({
      orderItemId: item.orderItemId.trim(),
      quantity: item.quantity,
    }));
    const created = await this.repositorio.create(solicitacao, items);
    return { ...this.paraResposta(created.request), reverseCode: created.reverseCode };
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
    if (!dto || typeof dto !== 'object') {
      throw new PayloadValidationError('Request payload must be an object');
    }
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    for (const value of [dto.reason, dto.description]) {
      if (value !== undefined && !hasText(value)) {
        throw new PayloadValidationError('Updated reason and description must not be empty');
      }
    }
    if (dto.trackingCode !== undefined && dto.trackingCode !== null && !hasText(dto.trackingCode)) {
      throw new PayloadValidationError('trackingCode must not be empty');
    }
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
    acao: TransitionAction,
    payload: TransitionPayload,
    actorId: string,
  ): Promise<ReturnRequestResponse> {
    const entidade = this.paraEntidade(await this.buscarObrigatoria(id));
    return this.transicionarEntidade(entidade, acao, TRANSITION_RULES[acao], payload, actorId);
  }

  private async buscarObrigatoria(id: string) {
    const solicitacao = await this.repositorio.findById(id);
    if (!solicitacao) throw new NotFoundException('Return request not found');
    return solicitacao;
  }

  private paraEntidade(solicitacao: ReturnRequestRecord): ReturnRequestEntity {
    return new ReturnRequestEntity({ ...solicitacao, status: ReturnStatus.from(solicitacao.status) });
  }

  private async transicionarEntidade(
    entidade: ReturnRequestEntity,
    acao: TransitionAction,
    regra: (typeof TRANSITION_RULES)[TransitionAction],
    payload: TransitionPayload,
    actorId: string,
  ): Promise<ReturnRequestResponse> {
    const transicionada = entidade.transition(regra, payload);
    const auditJustification: Partial<
      Record<TransitionAction, (payload: TransitionPayload) => string | undefined>
    > = {
      reject: (value) =>
        'rejectionReason' in value && typeof value.rejectionReason === 'string'
          ? value.rejectionReason
          : undefined,
      requestAdjustment: (value) =>
        'adjustmentReason' in value && typeof value.adjustmentReason === 'string'
          ? value.adjustmentReason
          : undefined,
      cancel: (value) =>
        'justification' in value && typeof value.justification === 'string'
          ? value.justification
          : undefined,
    };
    const suppliedJustification = auditJustification[acao]?.(payload);
    const justification =
      typeof suppliedJustification === 'string'
        ? suppliedJustification.trim()
        : `Action: ${regra.name}`;
    const reverseCode =
      acao === 'post' && 'reverseCode' in payload && typeof payload.reverseCode === 'string'
        ? payload.reverseCode.trim()
        : undefined;
    const atualizada = await this.repositorio.updateWithVersion(
      transicionada,
      entidade.props.version,
      regra.from,
      entidade.props.status.getValue(),
      actorId,
      justification,
      reverseCode,
    );
    return this.paraResposta(atualizada);
  }

  private paraResposta(solicitacao: ReturnRequestRecord): ReturnRequestResponse {
    return {
      id: solicitacao.id,
      orderId: solicitacao.orderId,
      customerId: solicitacao.customerId,
      productId: solicitacao.productId,
      type: solicitacao.type,
      reason: solicitacao.reason,
      description: solicitacao.description,
      status: solicitacao.status,
      trackingCode: solicitacao.trackingCode ?? null,
      inspectionResult: solicitacao.inspectionResult ?? null,
      rejectionReason: solicitacao.rejectionReason ?? null,
      adjustmentRequestedAt: solicitacao.adjustmentRequestedAt ?? null,
      adjustmentReason: solicitacao.adjustmentReason ?? null,
      version: solicitacao.version,
      createdAt: solicitacao.createdAt,
      updatedAt: solicitacao.updatedAt,
    };
  }
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
