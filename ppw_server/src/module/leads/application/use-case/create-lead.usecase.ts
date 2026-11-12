import { CreateLeadDto } from '../../dto/leads.dto';

export const CREATE_LEAD_USECASE = 'CREATE_LEAD_USECASE';

export interface CreateLeadUseCase {
  execute(dto: CreateLeadDto): Promise<{ message: string; email: string }>;
}
