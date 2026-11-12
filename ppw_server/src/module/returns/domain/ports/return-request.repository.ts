import { ReturnRequest } from '@prisma/client';
import { ReturnRequestEntity } from '../entity/return-request.entity';

export interface ReturnRequestRepository {
  create(request: ReturnRequestEntity): Promise<ReturnRequest>;
  findById(id: string): Promise<ReturnRequest | null>;
  findAll(): Promise<ReturnRequest[]>;
  update(request: ReturnRequestEntity): Promise<ReturnRequest>;
  delete(id: string): Promise<void>;
}
