import { BaseEntity, DefaultTimeStampProps } from '../../../../shared/domain/entity/base.entity';
import { ReturnStatus, ReturnStatusValue } from '../value-object/return-status.value.object';

export type ReturnTypeValue = 'DEVOLUTION' | 'EXCHANGE';
export type ReturnRequestProps = {
  id: string; orderId: string; customerId: string; productId: string;
  type: ReturnTypeValue; reason: string; description: string; status: ReturnStatus;
  trackingCode?: string | null; inspectionResult?: string | null; rejectionReason?: string | null;
} & DefaultTimeStampProps;

export class ReturnRequestEntity extends BaseEntity<ReturnRequestProps> {
  constructor(props: ReturnRequestProps) { super(props); }

  mudarStatusPara(novoStatus: ReturnStatusValue): ReturnRequestEntity {
    const statusAtual = this.props.status.getValue();
    const proximosStatusPermitidos: Record<ReturnStatusValue, ReturnStatusValue[]> = {
      REQUESTED: [ReturnStatusValue.POSTED], POSTED: [ReturnStatusValue.RECEIVED],
      RECEIVED: [ReturnStatusValue.INSPECTING], INSPECTING: [ReturnStatusValue.APPROVED, ReturnStatusValue.REJECTED],
      APPROVED: [ReturnStatusValue.COMPLETED], REJECTED: [], COMPLETED: [],
    };
    if (!proximosStatusPermitidos[statusAtual].includes(novoStatus)) {
      throw new Error(`Invalid return transition: ${statusAtual} -> ${novoStatus}`);
    }
    return new ReturnRequestEntity({ ...this.props, status: ReturnStatus.from(novoStatus), updatedAt: new Date() });
  }

  updateDetails(dados: { reason?: string; description?: string; trackingCode?: string | null }): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      reason: dados.reason !== undefined ? dados.reason.trim() : this.props.reason,
      description: dados.description !== undefined ? dados.description.trim() : this.props.description,
      trackingCode: dados.trackingCode !== undefined ? dados.trackingCode : this.props.trackingCode,
      updatedAt: new Date(),
    });
  }
}
