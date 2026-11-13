// Execute manualmente com mongosh após selecionar o banco ong.
db.createCollection("usuarios", {
  validator: { $jsonSchema: { bsonType: "object", required: ["nome", "email", "telefone", "senhaHash", "tipo", "ativo", "dataCadastro"], properties: {
    nome: { bsonType: "string" }, email: { bsonType: "string", pattern: "^.+@.+\\..+$" }, telefone: { bsonType: "string" },
    cpfCnpj: { bsonType: "string" }, senhaHash: { bsonType: "string" }, tipo: { enum: ["COMUM", "ADMIN"] },
    cargo: { bsonType: "string" }, ativo: { bsonType: "bool" }, dataCadastro: { bsonType: "date" }
  } } }
});
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ cpfCnpj: 1 }, { unique: true, partialFilterExpression: { cpfCnpj: { $type: "string" } } });

db.createCollection("solicitacoes", {
  validator: { $jsonSchema: { bsonType: "object", required: ["status", "dataSolicitacao", "motivo", "solicitante", "beneficiario", "responsavel", "consentimento"], properties: {
    status: { enum: ["PENDENTE", "APROVADA", "RECUSADA"] }, dataSolicitacao: { bsonType: "date" }, motivo: { bsonType: "string" },
    justificativaRecusa: { bsonType: "string" }, solicitante: { bsonType: "object", required: ["nome", "telefone"], properties: { nome: { bsonType: "string" }, telefone: { bsonType: "string" } } },
    beneficiario: { bsonType: "object", required: ["nome", "dataNascimento", "genero"], properties: { nome: { bsonType: "string" }, dataNascimento: { bsonType: "date" }, genero: { bsonType: "string" } } },
    responsavel: { bsonType: "object", required: ["nome", "telefone", "parentesco"], properties: { nome: { bsonType: "string" }, email: { bsonType: "string" }, telefone: { bsonType: "string" }, parentesco: { bsonType: "string" } } },
    consentimento: { bsonType: "object", required: ["aceito", "data"], properties: { aceito: { bsonType: "bool" }, data: { bsonType: "date" } } },
    analise: { bsonType: "object", properties: { usuarioId: { bsonType: "objectId" }, data: { bsonType: "date" } } }
  } } }
});
db.solicitacoes.createIndex({ status: 1 });

db.createCollection("beneficiarios");
db.beneficiarios.createIndex({ solicitacaoOrigemId: 1 }, { unique: true });
db.beneficiarios.createIndex({ projetoIds: 1 });

db.createCollection("projetos");
db.projetos.createIndex({ ativo: 1 });

db.createCollection("planos");
db.planos.createIndex({ doadorId: 1 });
db.planos.createIndex({ status: 1, diaCobranca: 1 });

db.createCollection("doacoes");
db.doacoes.createIndex({ doadorId: 1 });
db.doacoes.createIndex({ projetoId: 1 });
db.doacoes.createIndex({ planoId: 1, competencia: 1 }, { unique: true, partialFilterExpression: { planoId: { $type: "objectId" } } });

db.createCollection("voluntarios");
// Inscrições públicas não têm usuarioId; a unicidade aplica-se apenas às contas cadastradas.
db.voluntarios.createIndex({ usuarioId: 1, projetoId: 1 }, { unique: true, partialFilterExpression: { usuarioId: { $type: "objectId" } } });
db.voluntarios.createIndex({ status: 1 });
