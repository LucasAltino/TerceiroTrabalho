import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReturnRequestEntity, ReturnTypeValue } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import {
  ApproveRule,
  RejectRule,
  StartInspectionRule,
  TRANSITION_RULES,
} from '../../domain/transition/return-transition-rules';
import { TransitionRule } from '../../domain/transition/transition-rule';
import {
  CreateReturnRequestDto,
  InspectReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
  UpdateReturnStatusDto,
} from '../dto/return-request.dto';
import {
  CreateReturnRequestUseCase,
  DeleteReturnRequestUseCase,
  GetReturnRequestUseCase,
  InspectReturnRequestUseCase,
  ListReturnRequestsUseCase,
  UpdateReturnRequestUseCase,
  UpdateReturnStatusUseCase,
} from '../use-case/return-request.usecases';

@Injectable()
export class ReturnRequestService
  implements
    CreateReturnRequestUseCase,
    GetReturnRequestUseCase,
    ListReturnRequestsUseCase,
    UpdateReturnRequestUseCase,
    UpdateReturnStatusUseCase,
    InspectReturnRequestUseCase,
    DeleteReturnRequestUseCase
{
  constructor(@Inject('RETURN_REQUEST_REPOSITORY') private readonly repositorio: ReturnRequestRepository) {}

  async criar(dto: CreateReturnRequestDto): Promise<ReturnRequestResponse> {
    if (dto.type !== 'DEVOLUTION' && dto.type !== 'EXCHANGE') {
      throw new Error('Invalid return type');
    }
    const dataAtual = new Date();
    const solicitacao = new ReturnRequestEntity({
      id: randomUUID(),
      orderId: dto.orderId,
      customerId: dto.customerId,
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
    return this.paraResposta(await this.repositorio.create(solicitacao));
  }

  async buscarPorId(id: string): Promise<ReturnRequestResponse> {
    const solicitacao = await this.buscarObrigatoria(id);
    return this.paraResposta(solicitacao);
  }

  async listarTodos(): Promise<ReturnRequestResponse[]> {
    const solicitacoes = await this.repositorio.findAll();
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

  async atualizarStatus(id: string, dto: UpdateReturnStatusDto): Promise<ReturnRequestResponse> {
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    const entidade = this.paraEntidade(solicitacaoAtual);
    const regra = Object.values(TRANSITION_RULES).find((candidate) => candidate.to === dto.status);
    if (!regra) throw new Error(`Unsupported return status transition: ${dto.status}`);
    const payload = {
      trackingCode: entidade.props.trackingCode ?? '',
      inspectionResult: entidade.props.inspectionResult ?? '',
      rejectionReason: entidade.props.rejectionReason ?? '',
      adjustmentReason: entidade.props.adjustmentReason ?? '',
      justification: '',
    };
    return this.transicionarEntidade(entidade, regra, payload);
  }

  async transicionar(
    id: string,
    acao: keyof typeof TRANSITION_RULES,
    payload: unknown,
  ): Promise<ReturnRequestResponse> {
    const entidade = this.paraEntidade(await this.buscarObrigatoria(id));
    return this.transicionarEntidade(entidade, TRANSITION_RULES[acao], payload);
  }

  async registrarInspecao(id: string, dto: InspectReturnRequestDto): Promise<ReturnRequestResponse> {
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    const emInspecao = this.paraEntidade(solicitacaoAtual).transition(StartInspectionRule, {});
    const solicitacaoInspecionada = dto.approved
      ? emInspecao.transition(ApproveRule, { inspectionResult: dto.result })
      : emInspecao.transition(RejectRule, { rejectionReason: dto.rejectionReason ?? dto.result });
    return this.paraResposta(await this.repositorio.update(solicitacaoInspecionada));
  }

  async excluir(id: string): Promise<void> {
    await this.buscarObrigatoria(id);
    await this.repositorio.delete(id);
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
    regra: TransitionRule<any>,
    payload: unknown,
  ): Promise<ReturnRequestResponse> {
    const transicionada = entidade.transition(regra, payload);
    const atualizada = await this.repositorio.updateWithVersion(
      transicionada,
      entidade.props.version,
      regra.from,
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
