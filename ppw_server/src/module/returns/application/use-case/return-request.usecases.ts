import {
  CreateReturnRequestDto,
  InspectReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
  UpdateReturnStatusDto,
} from '../dto/return-request.dto';

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

export interface UpdateReturnStatusUseCase {
  atualizarStatus(id: string, dto: UpdateReturnStatusDto): Promise<ReturnRequestResponse>;
}

export interface InspectReturnRequestUseCase {
  registrarInspecao(id: string, dto: InspectReturnRequestDto): Promise<ReturnRequestResponse>;
}

export interface DeleteReturnRequestUseCase {
  excluir(id: string): Promise<void>;
}
