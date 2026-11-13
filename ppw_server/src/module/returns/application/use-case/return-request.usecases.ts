import {
  CreateReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
} from '../dto/return-request.dto';
import { TRANSITION_RULES } from '../../domain/transition/return-transition-rules';

export interface CreateReturnRequestUseCase {
  criar(dto: CreateReturnRequestDto): Promise<ReturnRequestResponse>;
}

export interface GetReturnRequestUseCase {
  buscarPorId(id: string): Promise<ReturnRequestResponse>;
}

export interface ListReturnRequestsUseCase {
  listarTodos(): Promise<ReturnRequestResponse[]>;
}

export interface UpdateReturnRequestUseCase {
  atualizar(id: string, dto: UpdateReturnRequestDto): Promise<ReturnRequestResponse>;
}

export interface TransitionReturnRequestUseCase {
  transicionar(
    id: string,
    action: keyof typeof TRANSITION_RULES,
    payload: unknown,
  ): Promise<ReturnRequestResponse>;
}
