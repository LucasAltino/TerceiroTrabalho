import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  CreateReturnRequestDto,
  InspectReturnRequestDto,
  ReturnRequestResponse,
  UpdateReturnRequestDto,
  UpdateReturnStatusDto,
} from '../application/dto/return-request.dto';
import {
  CreateReturnRequestUseCase,
  DeleteReturnRequestUseCase,
  GetReturnRequestUseCase,
  InspectReturnRequestUseCase,
  ListReturnRequestsUseCase,
  UpdateReturnRequestUseCase,
  UpdateReturnStatusUseCase,
} from '../application/use-case/return-request.usecases';

@Controller('returns')
export class ReturnRequestController {
  constructor(
    @Inject('CREATE_RETURN_REQUEST_USECASE')
    private readonly casoCriar: CreateReturnRequestUseCase,
    @Inject('GET_RETURN_REQUEST_USECASE')
    private readonly casoBuscar: GetReturnRequestUseCase,
    @Inject('LIST_RETURN_REQUESTS_USECASE')
    private readonly casoListar: ListReturnRequestsUseCase,
    @Inject('UPDATE_RETURN_REQUEST_USECASE')
    private readonly casoAtualizar: UpdateReturnRequestUseCase,
    @Inject('UPDATE_RETURN_STATUS_USECASE')
    private readonly casoAtualizarStatus: UpdateReturnStatusUseCase,
    @Inject('INSPECT_RETURN_REQUEST_USECASE')
    private readonly casoInspecionar: InspectReturnRequestUseCase,
    @Inject('DELETE_RETURN_REQUEST_USECASE')
    private readonly casoExcluir: DeleteReturnRequestUseCase,
  ) {}

  @Get()
  async listar(): Promise<ReturnRequestResponse[]> {
    return this.casoListar.listarTodos();
  }

  @Post()
  async criar(@Body() dados: CreateReturnRequestDto): Promise<ReturnRequestResponse> {
    return this.casoCriar.criar(dados);
  }

  @Get(':id')
  async buscar(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.casoBuscar.buscarPorId(id);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.casoAtualizar.atualizar(id, dados);
  }

  @Patch(':id')
  async atualizarPatch(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.casoAtualizar.atualizar(id, dados);
  }

  @Patch(':id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dados: UpdateReturnStatusDto,
  ): Promise<ReturnRequestResponse> {
    return this.casoAtualizarStatus.atualizarStatus(id, dados);
  }

  @Patch(':id/inspection')
  async inspecionar(
    @Param('id') id: string,
    @Body() dados: InspectReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.casoInspecionar.registrarInspecao(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id') id: string): Promise<void> {
    await this.casoExcluir.excluir(id);
  }
}
