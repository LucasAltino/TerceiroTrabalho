import { ReturnTypeValue } from '../../domain/entity/return-request.entity';

export class CreateReturnRequestDto {
  orderId!: string;
  productId!: string;
  type!: ReturnTypeValue;
  reason!: string;
  description!: string;
  trackingCode?: string | null;
  items!: { orderItemId: string; quantity: number }[];
}

export class UpdateReturnRequestDto {
  reason?: string;
  description?: string;
  trackingCode?: string | null;
}

export class InspectReturnRequestDto {
  approved!: boolean;
  result!: string;
  rejectionReason?: string;
}

export type ReturnRequestResponse = {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  type: ReturnTypeValue;
  reason: string;
  description: string;
  status: string;
  trackingCode: string | null;
  inspectionResult: string | null;
  rejectionReason: string | null;
  adjustmentRequestedAt: Date | null;
  adjustmentReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};
