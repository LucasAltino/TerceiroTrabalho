# Devoluções E-commerce

Backend para abertura e acompanhamento de devoluções e trocas, com transições controladas, autorização por papel, histórico de auditoria e cálculo de estorno proporcional.

## Tecnologias

- NestJS e TypeScript
- PostgreSQL e Prisma
- bcryptjs para hashes de senha
- JWT HS256 para autenticação
- Jest para testes unitários e de integração
- Docker Compose para PostgreSQL local

## Arquitetura

O módulo `returns` separa responsabilidades em quatro camadas:

- `domain`: entidade, estados, regras de transição, erros e estratégia pura de cálculo. Não depende de NestJS ou Prisma.
- `application`: serviços, DTOs e casos de uso.
- `infrastructure`: persistência Prisma e transações PostgreSQL.
- `presentation`: rotas HTTP, autenticação e autorização.

As transições são registradas em `return-transition-rules.ts`. O repositório aplica controle otimista por versão e grava a alteração, os efeitos financeiros e o histórico na mesma transação quando necessário.

## Modelo de dados (DER)

```mermaid
erDiagram
    USERS {
        string id PK
        string email UK
        string password_hash
        enum role
    }
    ORDERS {
        string id PK
        decimal items_total
        decimal coupon_discount
        decimal shipping_paid
        decimal amount_paid
        decimal amount_refunded
    }
    ORDER_ITEMS {
        string id PK
        string order_id FK
        string product_id
        decimal unit_price
        int quantity
    }
    RETURN_REQUESTS {
        string id PK
        string order_id FK
        string customer_id FK
        string product_id
        enum type
        enum status
        int version
        datetime adjustment_requested_at
        string adjustment_reason
    }
    RETURN_ITEMS {
        string return_request_id PK, FK
        string order_item_id PK, FK
        int quantity
    }
    REFUNDS {
        string id PK
        string return_request_id FK, UK
        decimal valor
        enum status
    }
    REVERSE_CODES {
        string id PK
        string code UK
        string return_request_id FK, UK
        string order_id FK
        datetime expires_at
        datetime used_at
    }
    RETURN_STATUS_HISTORY {
        string id_registro PK
        string return_request_id FK
        enum estado_anterior
        enum novo_estado
        string autor_id FK
        string justificativa
        datetime timestamp
    }

    USERS ||--o{ RETURN_REQUESTS : owns
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ RETURN_REQUESTS : has
    RETURN_REQUESTS ||--|{ RETURN_ITEMS : contains
    ORDER_ITEMS ||--o{ RETURN_ITEMS : selected
    RETURN_REQUESTS ||--o| REFUNDS : generates
    RETURN_REQUESTS ||--o| REVERSE_CODES : receives
    ORDERS ||--o{ REVERSE_CODES : identifies
    RETURN_REQUESTS ||--o{ RETURN_STATUS_HISTORY : records
    USERS ||--o{ RETURN_STATUS_HISTORY : authors
```

## Máquina de estados

```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> POSTED: post (código reverso válido)
    POSTED --> RECEIVED: receive
    RECEIVED --> INSPECTING: startInspection
    ADJUSTMENT_REQUESTED --> INSPECTING: startInspection
    INSPECTING --> APPROVED: approve (inspectionResult)
    INSPECTING --> REJECTED: reject (rejectionReason)
    INSPECTING --> ADJUSTMENT_REQUESTED: requestAdjustment (adjustmentReason)
    APPROVED --> COMPLETED: complete

    REQUESTED --> CANCELLED: cancel
    POSTED --> CANCELLED: cancel
    RECEIVED --> CANCELLED: cancel
    INSPECTING --> CANCELLED: cancel
    ADJUSTMENT_REQUESTED --> CANCELLED: cancel
    APPROVED --> CANCELLED: cancel (reverte refund pendente)

    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
```

## Regras principais

- O estado só muda pelas ações explícitas da FSM; atualização concorrente exige a versão e o estado de origem esperados.
- `REJECTED` e `COMPLETED` são terminais. Cancelamento só é permitido até `APPROVED`.
- A matriz RBAC está declarada como dados em `RETURN_ACTION_PERMISSIONS`. Clientes só criam e operam as próprias devoluções.
- Códigos reversos são aleatórios, únicos, vinculados à devolução e ao pedido, e expiram em sete dias por padrão. O prazo pode ser configurado por `RETURN_CODE_TTL_DAYS`.
- `post` valida e consome o código na mesma transação da mudança de estado e auditoria. Código inexistente ou expirado retorna 422; código usado/conflito retorna 409.
- Auditoria é obrigatória em cada transição. `reject`, `requestAdjustment` e `cancel` registram a justificativa informada; as outras ações usam uma justificativa padrão.
- O desconto do cupom é distribuído proporcionalmente por item em centavos, com resto pelo método do maior resto. Trocas não geram estorno. O frete pago só entra no estorno quando todas as quantidades do pedido tiverem sido devolvidas. O total estornado nunca excede o valor pago.
- Aprovação de devolução cria refund `PENDING`; conclusão muda para `PAID`. Cancelamento de uma devolução aprovada muda refund pendente para `REVERSED` e libera o valor reservado.

## Execução local

Pré-requisitos: Node.js, npm e PostgreSQL local ou Docker Desktop. O banco de desenvolvimento é PostgreSQL, banco `devolucoes`, na porta `5432`. O projeto lê o `.env` existente na raiz; não versione esse arquivo.

### 1. Subir PostgreSQL (opcional)

Se já houver PostgreSQL local disponível, pule o Docker. Caso use Compose, ajuste `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente para corresponderem ao banco configurado no `.env`; o serviço cria o banco `devolucoes`.

```powershell
docker compose up -d postgres
```

Para parar o container sem apagar os dados:

```powershell
docker compose stop postgres
```

Não use `docker compose down -v` se precisar preservar o banco.

### 2. Instalar dependências e preparar o banco

Na raiz do repositório:

```powershell
npm --prefix ppw_server install
npx --prefix ppw_server prisma migrate dev --schema ppw_server/prisma/schema.prisma
npx --prefix ppw_server prisma db seed --schema ppw_server/prisma/schema.prisma
```

Defina `JWT_SECRET` no ambiente antes de iniciar a API. Exemplo para a sessão atual do PowerShell:

```powershell
$env:JWT_SECRET = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))
$env:RETURN_CODE_TTL_DAYS = '7'
```

### 3. Executar API e testes

```powershell
npm --prefix ppw_server run start:dev
npm --prefix ppw_server run build
npm --prefix ppw_server test -- --runInBand
```

Os testes PostgreSQL ficam desativados por padrão. Com o banco local e as migrations aplicadas, podem ser habilitados assim:

```powershell
$env:RUN_POSTGRES_INTEGRATION_TESTS = '1'
npm --prefix ppw_server test -- --runInBand
Remove-Item Env:RUN_POSTGRES_INTEGRATION_TESTS
```

### Usuários locais de demonstração

O seed cria/atualiza estes usuários de desenvolvimento:

| Papel | E-mail | Senha local |
|---|---|---|
| CUSTOMER | `customer@returns.local` | `Customer123!` |
| INSPECTOR | `inspector@returns.local` | `Inspector123!` |
| FINANCE | `finance@returns.local` | `Finance123!` |
| ADMIN | `admin@returns.local` | `Admin123!` |

Use-os somente em ambiente local. A autenticação é `POST /auth/login`; as ações de devolução exigem o token Bearer retornado.
