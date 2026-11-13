import {
  Body,
  Controller,
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
  ReturnRequestResponse,
  UpdateReturnRequestDto,
} from '../application/dto/return-request.dto';
import {
  CreateReturnRequestUseCase,
  GetReturnRequestUseCase,
  ListReturnRequestsUseCase,
  TransitionReturnRequestUseCase,
  UpdateReturnRequestUseCase,
} from '../application/use-case/return-request.usecases';

@Controller('returns')
export class ReturnRequestController {
  constructor(
    @Inject('CREATE_RETURN_REQUEST_USECASE')
    private readonly createReturn: CreateReturnRequestUseCase,
    @Inject('GET_RETURN_REQUEST_USECASE')
    private readonly getReturn: GetReturnRequestUseCase,
    @Inject('LIST_RETURN_REQUESTS_USECASE')
    private readonly listReturns: ListReturnRequestsUseCase,
    @Inject('UPDATE_RETURN_REQUEST_USECASE')
    private readonly updateReturn: UpdateReturnRequestUseCase,
    @Inject('TRANSITION_RETURN_REQUEST_USECASE')
    private readonly transitionReturn: TransitionReturnRequestUseCase,
  ) {}

  @Get()
  listar(): Promise<ReturnRequestResponse[]> {
    return this.listReturns.listarTodos();
  }

  @Post()
  criar(@Body() dados: CreateReturnRequestDto): Promise<ReturnRequestResponse> {
    return this.createReturn.criar(dados);
  }

  @Get(':id')
  buscar(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.getReturn.buscarPorId(id);
  }

  @Put(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.updateReturn.atualizar(id, dados);
  }

  @Patch(':id')
  atualizarPatch(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.updateReturn.atualizar(id, dados);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  postar(@Param('id') id: string, @Body() payload: { trackingCode: string }): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'post', payload);
  }

  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'receive', {});
  }

  @Post(':id/start-inspection')
  @HttpCode(HttpStatus.OK)
  iniciarInspecao(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'startInspection', {});
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  aprovar(
    @Param('id') id: string,
    @Body() payload: { inspectionResult: string },
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'approve', payload);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  rejeitar(
    @Param('id') id: string,
    @Body() payload: { rejectionReason: string },
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'reject', payload);
  }

  @Post(':id/request-adjustment')
  @HttpCode(HttpStatus.OK)
  solicitarAjuste(
    @Param('id') id: string,
    @Body() payload: { adjustmentReason: string },
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'requestAdjustment', payload);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  concluir(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'complete', {});
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelar(@Param('id') id: string, @Body() payload: { justification: string }): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'cancel', payload);
  }
}
