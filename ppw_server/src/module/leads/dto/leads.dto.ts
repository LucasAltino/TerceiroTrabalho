// ? - essa variável não é obrigatória, caso não seja informada, o NestJS retornará um erro de validação
// ! - essa variável é obrigatória, caso não seja informada, o NestJS retornará um erro de validação

export class CreateLeadDto {
  email!: string;
}
