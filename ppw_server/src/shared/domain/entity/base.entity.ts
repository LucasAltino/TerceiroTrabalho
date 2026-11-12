export type DefaultTimeStampProps = {
  createdAt?: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
};

export abstract class BaseEntity<Props extends DefaultTimeStampProps> {
  public readonly props: Props;

  constructor(props: Props) {
    this.props = props;
  }
}
