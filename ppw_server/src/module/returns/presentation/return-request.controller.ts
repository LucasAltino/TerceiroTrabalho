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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateReturnRequestDto,
  PostReturnRequestDto,
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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../../auth/auth.types';
import { RequireReturnAction, ReturnPermissionsGuard } from './return-permissions.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
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
  @RequireReturnAction('list')
  @UseGuards(ReturnPermissionsGuard)
  listar(@Req() request: AuthenticatedRequest): Promise<ReturnRequestResponse[]> {
    const customerId = request.user.role === Role.CUSTOMER ? request.user.id : undefined;
    return this.listReturns.listarTodos(customerId);
  }

  @Post()
  @RequireReturnAction('create')
  @UseGuards(ReturnPermissionsGuard)
  criar(
    @Body() dados: CreateReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.createReturn.criar(dados, request.user.id);
  }

  @Get(':id')
  @RequireReturnAction('read')
  @UseGuards(ReturnPermissionsGuard)
  buscar(@Param('id') id: string): Promise<ReturnRequestResponse> {
    return this.getReturn.buscarPorId(id);
  }

  @Put(':id')
  @RequireReturnAction('update')
  @UseGuards(ReturnPermissionsGuard)
  atualizar(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.updateReturn.atualizar(id, dados);
  }

  @Patch(':id')
  @RequireReturnAction('update')
  @UseGuards(ReturnPermissionsGuard)
  atualizarPatch(
    @Param('id') id: string,
    @Body() dados: UpdateReturnRequestDto,
  ): Promise<ReturnRequestResponse> {
    return this.updateReturn.atualizar(id, dados);
  }

  @Post(':id/post')
  @RequireReturnAction('post')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  postar(
    @Param('id') id: string,
    @Body() payload: PostReturnRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'post', payload, request.user.id);
  }

  @Post(':id/receive')
  @RequireReturnAction('receive')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'receive', {}, request.user.id);
  }

  @Post(':id/start-inspection')
  @RequireReturnAction('startInspection')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  iniciarInspecao(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'startInspection', {}, request.user.id);
  }

  @Post(':id/approve')
  @RequireReturnAction('approve')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  aprovar(
    @Param('id') id: string,
    @Body() payload: { inspectionResult: string },
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'approve', payload, request.user.id);
  }

  @Post(':id/reject')
  @RequireReturnAction('reject')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  rejeitar(
    @Param('id') id: string,
    @Body() payload: { rejectionReason: string },
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'reject', payload, request.user.id);
  }

  @Post(':id/request-adjustment')
  @RequireReturnAction('requestAdjustment')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  solicitarAjuste(
    @Param('id') id: string,
    @Body() payload: { adjustmentReason: string },
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'requestAdjustment', payload, request.user.id);
  }

  @Post(':id/complete')
  @RequireReturnAction('complete')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  concluir(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'complete', {}, request.user.id);
  }

  @Post(':id/cancel')
  @RequireReturnAction('cancel')
  @UseGuards(ReturnPermissionsGuard)
  @HttpCode(HttpStatus.OK)
  cancelar(
    @Param('id') id: string,
    @Body() payload: { justification: string },
    @Req() request: AuthenticatedRequest,
  ): Promise<ReturnRequestResponse> {
    return this.transitionReturn.transicionar(id, 'cancel', payload, request.user.id);
  }
}
