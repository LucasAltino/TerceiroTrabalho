import { BaseEntity, DefaultTimeStampProps } from '../../../../shared/domain/entity/base.entity';
import { Priority } from '../value-object/priority.value.object';
import { Status } from '../value-object/status.value.object';

export type Ticketprops = {
  id: string;
  title: string;
  description: string;
  justify?: string | null;
  priority: Priority;
  status: Status;
} & DefaultTimeStampProps;

export class TicketEntity extends BaseEntity<Ticketprops> {
  constructor(props: Ticketprops) {
    super(props);
  }

  update(params: { title?: string; description?: string; priority?: Priority; justify?: string | null }): TicketEntity {
    return new TicketEntity({
      ...this.props,
      title: params.title !== undefined ? params.title.trim() : this.props.title,
      description: params.description !== undefined ? params.description.trim() : this.props.description,
      priority: params.priority !== undefined ? params.priority : this.props.priority,
      justify: params.justify !== undefined ? params.justify : this.props.justify,
      updatedAt: new Date(),
    });
  }

  changeStatus(novoStatus: Status): TicketEntity {
    return new TicketEntity({
      ...this.props,
      status: novoStatus,
      updatedAt: new Date(),
    });
  }

  softDelete(): TicketEntity {
    return new TicketEntity({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
