import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReturnRequestEntity, ReturnTypeValue } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
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

    if (dto.status) {
      entidade = entidade.mudarStatusPara(dto.status as ReturnStatusValue);
    }

    const atualizada = await this.repositorio.update(entidade);
    return this.paraResposta(atualizada);
  }

  async atualizarStatus(id: string, dto: UpdateReturnStatusDto): Promise<ReturnRequestResponse> {
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    const solicitacaoAtualizada = this.paraEntidade(solicitacaoAtual).mudarStatusPara(dto.status as ReturnStatusValue);
    return this.paraResposta(await this.repositorio.update(solicitacaoAtualizada));
  }

  async registrarInspecao(id: string, dto: InspectReturnRequestDto): Promise<ReturnRequestResponse> {
    const solicitacaoAtual = await this.buscarObrigatoria(id);
    const emInspecao = this.paraEntidade(solicitacaoAtual).mudarStatusPara(ReturnStatusValue.INSPECTING);
    const statusFinal = dto.approved ? ReturnStatusValue.APPROVED : ReturnStatusValue.REJECTED;
    const solicitacaoInspecionada = new ReturnRequestEntity({
      ...emInspecao.props,
      status: ReturnStatus.from(statusFinal),
      inspectionResult: dto.result.trim(),
      rejectionReason: dto.approved ? null : dto.rejectionReason?.trim() || dto.result.trim(),
      updatedAt: new Date(),
    });
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

  private paraResposta(solicitacao: any): ReturnRequestResponse {
    return {
      ...solicitacao,
      type: solicitacao.type as ReturnTypeValue,
      status: solicitacao.status instanceof ReturnStatus ? solicitacao.status.getValue() : solicitacao.status,
    };
  }
}
