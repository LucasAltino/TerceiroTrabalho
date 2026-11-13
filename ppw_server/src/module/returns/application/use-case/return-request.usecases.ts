import {
  CreateReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
} from '../dto/return-request.dto';
import {
  TRANSITION_RULES,
  TransitionPayload,
} from '../../domain/transition/return-transition-rules';

export type TransitionAction = keyof typeof TRANSITION_RULES;
export type ReturnAction = TransitionAction | 'create' | 'list' | 'read' | 'update';

export interface CreateReturnRequestUseCase {
  criar(dto: CreateReturnRequestDto, customerId: string): Promise<ReturnRequestResponse>;
}

export interface GetReturnRequestUseCase {
  buscarPorId(id: string): Promise<ReturnRequestResponse>;
}

export interface ListReturnRequestsUseCase {
  listarTodos(customerId?: string): Promise<ReturnRequestResponse[]>;
}

export interface UpdateReturnRequestUseCase {
  atualizar(id: string, dto: UpdateReturnRequestDto): Promise<ReturnRequestResponse>;
}

export interface TransitionReturnRequestUseCase {
  transicionar(
    id: string,
    action: TransitionAction,
    payload: TransitionPayload,
    actorId: string,
  ): Promise<ReturnRequestResponse>;
}
