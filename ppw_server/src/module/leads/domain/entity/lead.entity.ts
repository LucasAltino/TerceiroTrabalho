export class LeadEntity {
  constructor(
    public readonly email: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
