# ong_db — estrutura atual (v2)

Base: o rascunho `Banco_ONG`, com os ajustes combinados na revisão (listados no final, em **Ajustes aplicados**).

## Visão geral do fluxo

1. **Cadastro de conta:** qualquer pessoa se cadastra no site. A conta é **sempre** criada com `tipo: "COMUM"`. Quem doa ou se voluntaria é um usuário comum; "ser voluntário" é um fato derivado (existe uma inscrição `APROVADA` em `voluntarios`), não um tipo de conta.
2. **Admin:** um adm é um usuário promovido por outro adm (só muda `tipo`/`cargo`). O primeiro adm é criado por seed, fora da API pública.
3. **Solicitação de beneficiário:** a pessoa preenche o formulário no site (com consentimento). Cria uma `solicitacoes` com `status: "PENDENTE"`.
4. **Análise:** um adm aprova ou recusa. Recusa exige `justificativaRecusa`.
5. **Aprovação:** só quando um adm aprova é criado o documento em `beneficiarios` (copiando os dados da solicitação). Não existe cadastro direto de beneficiário.
6. **Projetos:** cadastrados, atualizados e desativados apenas por adm.
7. **Voluntariado:** o usuário comum se inscreve num projeto (`voluntarios`, `PENDENTE`); um adm aprova ou recusa (recusa com justificativa).
8. **Doações:** só usuários `COMUM` doam, de forma **única** ou por **plano mensal** (`planos`). Cada cobrança vira um documento em `doacoes`.

---

## Perfis e permissões

| Recurso | Sem login | Usuário comum | Admin |
|---|---|---|---|
| Conta (`usuarios`) | Cadastrar (sempre `COMUM`) | Ver/editar o próprio perfil | Listar (sem `cpfCnpj`/`senhaHash`); promover/rebaixar (`tipo`, `cargo`) |
| `projetos` | Listar ativos | Listar ativos | Criar, atualizar, desativar |
| `solicitacoes` | Criar (formulário) | — | Criar, listar, aprovar, recusar, excluir* |
| `beneficiarios` | — | — | Listar, atualizar campos não pessoais, desativar. Criação **só** via aprovação |
| `doacoes` | — | Criar e ver as próprias | Somente leitura (sem dados sensíveis do doador) |
| `planos` | — | Criar, pausar, cancelar e ver os próprios | Somente leitura |
| `voluntarios` | — | Inscrever-se, ver e encerrar a própria inscrição | Criar, listar, aprovar, recusar, atualizar, encerrar, excluir* |

\* Exclusão física limitada, ver **Regras de exclusão**.

**Dados pessoais** (adm nunca altera depois de criados): `nome`, `email`, `telefone`, `cpfCnpj`, `dataNascimento`, `genero`, `senhaHash` e os subdocumentos `solicitante`, `beneficiario` e `responsavel`. O adm pode atualizar apenas campos de gestão (status, justificativa, projetos, datas de saída, observações, etc.).

---

## Enums

| Campo | Valores |
|---|---|
| `usuarios.tipo` | `COMUM`, `ADMIN` |
| `solicitacoes.status` | `PENDENTE`, `APROVADA`, `RECUSADA` |
| `voluntarios.status` | `PENDENTE`, `APROVADA`, `RECUSADA`, `ENCERRADA` |
| `planos.status` | `ATIVO`, `PAUSADO`, `CANCELADO` |
| `doacoes.tipo` | `UNICA`, `MENSAL` |
| `doacoes.status` | `PENDENTE`, `CONFIRMADA`, `FALHOU`, `ESTORNADA` |
| `doacoes.formaPagamento` | `PIX`, `CARTAO`, `BOLETO` |

---

## Coleções

### `usuarios`

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `nome` | String | |
| `email` | String | único, usado no login |
| `telefone` | String | |
| `cpfCnpj` | String | opcional (útil para quem doa); único quando preenchido |
| `senhaHash` | String | BCrypt, nunca texto puro, nunca exposto na API |
| `tipo` | String enum | `COMUM` \| `ADMIN` |
| `cargo` | String | opcional, só para `ADMIN` |
| `ativo` | Boolean | |
| `dataCadastro` | Date | |

---

### `solicitacoes`

Formulário de pedido de cadastro de beneficiário. Os dados da pessoa indicada ficam **embutidos** até a aprovação.

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `status` | String enum | `PENDENTE` \| `APROVADA` \| `RECUSADA` |
| `dataSolicitacao` | Date | |
| `motivo` | String | descrição da necessidade |
| `justificativaRecusa` | String | **obrigatória** se `RECUSADA` (validar no service) |
| `solicitante` | Object | `{ nome, telefone }` — quem preencheu o formulário |
| `beneficiario` | Object | `{ nome, dataNascimento, genero }` |
| `responsavel` | Object | `{ nome, email, telefone, parentesco }` |
| `consentimento` | Object | `{ aceito: Boolean, data: Date }` — consentimento do responsável (LGPD) |
| `analise` | Object | `{ usuarioId: ObjectId, data: Date }` — ausente enquanto `PENDENTE` |

---

### `beneficiarios`

Criado **somente** quando um adm aprova uma solicitação.

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `nome` | String | |
| `dataNascimento` | Date | |
| `genero` | String | |
| `dataEntrada` | Date | data da aprovação |
| `dataSaida` | Date | opcional |
| `motivoSaida` | String | opcional |
| `ativo` | Boolean | atualizar **junto** com `dataSaida` na mesma operação |
| `solicitacaoOrigemId` | ObjectId | ref `solicitacoes`; **único** |
| `projetoIds` | [ObjectId] | refs `projetos`; começa vazio |
| `responsavel` | Object | `{ nome, email, telefone, parentesco }` — cópia da solicitação |

---

### `projetos`

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `nome` | String | |
| `descricao` | String | |
| `dataCadastro` | Date | |
| `ativo` | Boolean | "excluir" = `ativo: false` |
| `adminId` | ObjectId | ref `usuarios` (adm que cadastrou); vem do token, nunca do body |

---

### `planos` (novo)

Doação mensal recorrente. Cada cobrança gera um documento em `doacoes`.

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `doadorId` | ObjectId | ref `usuarios` (tipo `COMUM`) |
| `projetoId` | ObjectId | opcional (vazio = doação geral para a ONG) |
| `valorMensal` | Decimal128 | |
| `diaCobranca` | Int | 1 a 28 (evita problema com meses curtos) |
| `status` | String enum | `ATIVO` \| `PAUSADO` \| `CANCELADO` |
| `dataInicio` | Date | |
| `dataCancelamento` | Date | opcional |
| `formaPagamento` | String enum | `PIX`, `CARTAO` ou `BOLETO`; usado pelo job de cobranças mensais |

---

### `doacoes`

Registro financeiro: **nunca é excluído**, e o `valor` nunca é alterado.

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `doadorId` | ObjectId | ref `usuarios` (tipo `COMUM`); vem do token |
| `projetoId` | ObjectId | opcional |
| `planoId` | ObjectId | opcional, preenchido quando `tipo: MENSAL` |
| `competencia` | String | opcional, `"AAAA-MM"`, só para `MENSAL` (impede cobrança duplicada no mês) |
| `valor` | Decimal128 | `BigDecimal` no Java; deve ser > 0 |
| `data` | Date | |
| `tipo` | String enum | `UNICA` \| `MENSAL` |
| `formaPagamento` | String enum | `PIX` \| `CARTAO` \| `BOLETO` |
| `status` | String enum | `PENDENTE` \| `CONFIRMADA` \| `FALHOU` \| `ESTORNADA` |

---

### `voluntarios`

Inscrição de um usuário comum em um projeto.

| Campo | Tipo | Observações |
|---|---|---|
| `_id` | ObjectId | |
| `usuarioId` | ObjectId | ref `usuarios`; vem do token |
| `projetoId` | ObjectId | ref `projetos`; **obrigatório** |
| `status` | String enum | `PENDENTE` \| `APROVADA` \| `RECUSADA` \| `ENCERRADA` |
| `dataInscricao` | Date | |
| `dataSaida` | Date | opcional; atualizar junto com `status: ENCERRADA` |
| `observacao` | String | opcional |
| `justificativaRecusa` | String | **obrigatória** se `RECUSADA` |
| `analise` | Object | `{ usuarioId: ObjectId, data: Date }` — ausente enquanto `PENDENTE` |

---

## Relacionamentos

As referências são **manuais** (guardam o `ObjectId`). O MongoDB não as impõe: a integridade é responsabilidade dos services.

| De | Para | Tipo | Campo |
|---|---|---|---|
| `usuarios` (comum) | `doacoes` | 1:N | `doacoes.doadorId` |
| `usuarios` (comum) | `planos` | 1:N | `planos.doadorId` |
| `planos` | `doacoes` | 1:N | `doacoes.planoId` |
| `usuarios` (comum) | `voluntarios` | 1:N | `voluntarios.usuarioId` |
| `projetos` | `voluntarios` | 1:N | `voluntarios.projetoId` |
| `projetos` | `doacoes` / `planos` | 1:N (opcional) | `projetoId` |
| `projetos` | `beneficiarios` | N:N | `beneficiarios.projetoIds` |
| `solicitacoes` | `beneficiarios` | 1:1 (após aprovação) | `beneficiarios.solicitacaoOrigemId` |
| `usuarios` (adm) | `solicitacoes` / `voluntarios` | 1:N | `analise.usuarioId` |
| `usuarios` (adm) | `projetos` | 1:N | `projetos.adminId` |

---

## Índices

```javascript
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex(
  { cpfCnpj: 1 },
  { unique: true, partialFilterExpression: { cpfCnpj: { $type: "string" } } }
);

db.solicitacoes.createIndex({ status: 1 });

db.beneficiarios.createIndex({ solicitacaoOrigemId: 1 }, { unique: true });
db.beneficiarios.createIndex({ projetoIds: 1 });

db.projetos.createIndex({ ativo: 1 });

db.planos.createIndex({ doadorId: 1 });
db.planos.createIndex({ status: 1, diaCobranca: 1 });

db.doacoes.createIndex({ doadorId: 1 });
db.doacoes.createIndex({ projetoId: 1 });
db.doacoes.createIndex(
  { planoId: 1, competencia: 1 },
  { unique: true, partialFilterExpression: { planoId: { $type: "objectId" } } }
);

db.voluntarios.createIndex({ usuarioId: 1, projetoId: 1 }, { unique: true });
db.voluntarios.createIndex({ status: 1 });
```

No Spring Boot, a criação automática de índices a partir das anotações vem **desligada** por padrão: ligue `spring.data.mongodb.auto-index-creation=true` ou crie os índices num inicializador.

---

## Regras de negócio importantes

### Aprovar solicitação
1. Só age sobre `status == PENDENTE`.
2. Cria o `beneficiarios` copiando `beneficiario` e `responsavel` da solicitação, com `solicitacaoOrigemId`, `dataEntrada`, `ativo: true`, `projetoIds: []`. O índice único impede duplicar; se já existir, trate como "já criado" e siga.
3. Atualiza a solicitação com **update condicional** (`status == PENDENTE` → `APROVADA`) gravando `analise { usuarioId (do token), data }`. Isso protege contra dois adms agindo ao mesmo tempo.
4. Criar primeiro o beneficiário e marcar a solicitação depois torna a repetição segura se algo falhar no meio. Transações do Mongo exigem replica set e configuração extra, então não são necessárias aqui.

### Recusar solicitação ou inscrição de voluntário
`justificativaRecusa` obrigatória e não vazia; update condicional (`PENDENTE` → `RECUSADA`) com `analise`.

### Plano mensal
Um job agendado (`@Scheduled`) percorre os planos `ATIVO` cujo `diaCobranca` é hoje e cria uma `doacoes` (`tipo: MENSAL`, `planoId`, `competencia: "AAAA-MM"`). O índice único `(planoId, competencia)` garante que rodar duas vezes não duplica a cobrança. Se o pagamento real vier de um gateway (Pix recorrente, Mercado Pago, Stripe), ele cuida da recorrência e o sistema guarda só os IDs dele.

### Voluntariado
Uma inscrição por par `(usuarioId, projetoId)`. Se a pessoa foi recusada ou encerrada e quer voltar, o service **reabre o mesmo documento** (`status: PENDENTE`, limpando `justificativaRecusa`, `dataSaida` e `analise`) em vez de criar outro.

### Regras de exclusão
- **`projetos`:** `DELETE` = `ativo: false`. Nunca exclusão física (doações, planos, beneficiários e voluntários apontam para ele).
- **`beneficiarios`:** `DELETE` = desativar (`ativo: false`, `dataSaida`, `motivoSaida`). Remoção física só por procedimento manual (cadastro indevido ou pedido de eliminação de dados).
- **`solicitacoes`:** exclusão física só se `PENDENTE` ou `RECUSADA` (ex.: spam). Uma `APROVADA` nunca é excluída, pois o beneficiário aponta para ela (`409`).
- **`voluntarios`:** exclusão física só se `PENDENTE` ou `RECUSADA`; para quem já foi aprovado, use `ENCERRADA`.
- **`doacoes`:** nunca excluídas. **`usuarios`:** adm não exclui.

### Privacidade do adm
Respostas destinadas ao adm saem em **DTO**: nunca `cpfCnpj` nem `senhaHash`. Na listagem de doações e planos, o adm vê o nome do doador (via `$lookup` projetando só `nome`).

### Segurança do cadastro
O `tipo` nunca vem do corpo da requisição. O cadastro público fixa `COMUM`; promover a `ADMIN` é uma rota protegida que altera só `tipo`/`cargo`, e bloqueia rebaixar o último adm. `doadorId`, `usuarioId` e `adminId` sempre vêm do usuário autenticado.

---

## Exemplo de validação MongoDB (`$jsonSchema`)

Opcional. A regra condicional "recusada exige justificativa" fica no service (Bean Validation), pois o `$jsonSchema` do MongoDB não tem `if/then`.

```javascript
db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "senhaHash", "tipo", "ativo", "dataCadastro"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        telefone: { bsonType: "string" },
        cpfCnpj: { bsonType: "string" },
        senhaHash: { bsonType: "string" },
        tipo: { enum: ["COMUM", "ADMIN"] },
        cargo: { bsonType: "string" },
        ativo: { bsonType: "bool" },
        dataCadastro: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("solicitacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["status", "dataSolicitacao", "motivo", "solicitante",
                 "beneficiario", "responsavel", "consentimento"],
      properties: {
        status: { enum: ["PENDENTE", "APROVADA", "RECUSADA"] },
        dataSolicitacao: { bsonType: "date" },
        motivo: { bsonType: "string" },
        justificativaRecusa: { bsonType: "string" },
        solicitante: {
          bsonType: "object",
          required: ["nome", "telefone"],
          properties: { nome: { bsonType: "string" }, telefone: { bsonType: "string" } }
        },
        beneficiario: {
          bsonType: "object",
          required: ["nome", "dataNascimento"],
          properties: {
            nome: { bsonType: "string" },
            dataNascimento: { bsonType: "date" },
            genero: { bsonType: "string" }
          }
        },
        responsavel: {
          bsonType: "object",
          required: ["nome", "telefone", "parentesco"],
          properties: {
            nome: { bsonType: "string" },
            email: { bsonType: "string" },
            telefone: { bsonType: "string" },
            parentesco: { bsonType: "string" }
          }
        },
        consentimento: {
          bsonType: "object",
          required: ["aceito", "data"],
          properties: { aceito: { bsonType: "bool" }, data: { bsonType: "date" } }
        },
        analise: {
          bsonType: "object",
          properties: { usuarioId: { bsonType: "objectId" }, data: { bsonType: "date" } }
        }
      }
    }
  }
});

db.createCollection("doacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["doadorId", "valor", "data", "tipo", "status"],
      properties: {
        doadorId: { bsonType: "objectId" },
        projetoId: { bsonType: "objectId" },
        planoId: { bsonType: "objectId" },
        competencia: { bsonType: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
        valor: { bsonType: "decimal" },
        data: { bsonType: "date" },
        tipo: { enum: ["UNICA", "MENSAL"] },
        formaPagamento: { enum: ["PIX", "CARTAO", "BOLETO"] },
        status: { enum: ["PENDENTE", "CONFIRMADA", "FALHOU", "ESTORNADA"] }
      }
    }
  }
});
```

Sobre o `Decimal128` no Java: use `BigDecimal` e anote o campo com `@Field(targetType = FieldType.DECIMAL128)`, para não depender do padrão de conversão da versão do Spring Data MongoDB.

---

## Ajustes aplicados sobre o `Banco_ONG` (revisar)

1. **Status padronizados** em maiúsculas e com o mesmo vocabulário (`PENDENTE/APROVADA/RECUSADA`). `reprovada` virou `RECUSADA`; `usuarios.tipo` virou `COMUM | ADMIN`.
2. **`solicitacoes.consentimento`** adicionado (dados de menores).
3. **`voluntarios`:** ganhou `analise` e `justificativaRecusa`; `projetoId` ficou obrigatório; índice único `(usuarioId, projetoId)`.
4. **Coleção `planos`** criada; `doacoes` ganhou `planoId` e `competencia`, e `tipo` virou `UNICA | MENSAL`.
5. **Exclusão lógica** em projetos e beneficiários; solicitações aprovadas e doações nunca são excluídas.
6. **Índice único** em `beneficiarios.solicitacaoOrigemId` e aprovação com update condicional.
7. **Admin por promoção** de usuário existente (adm não define dados pessoais nem senha de ninguém).
8. **`cpfCnpj` opcional**, com índice único parcial.

**Decisões aplicadas nesta implementação:**
- O plano mensal armazena `formaPagamento`, pois a cobrança mensal gera um documento de doação que exige esse campo.
- `POST /adm/voluntarios` vincula a inscrição ao próprio administrador autenticado, conforme a regra de que `usuarioId` vem do token.

**Premissas a confirmar:**
- "Valor fixo" foi interpretado como **doação única**.
- **Admin não doa** (só `COMUM`).
- O formulário de solicitação continua **público** (sem login).
- O adm vê **apenas o nome** do doador.
- "Dados pessoais" seguem a definição da seção de permissões.
