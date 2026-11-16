package br.org.ong.model;

import java.time.Instant;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

/* Responsável cadastrado direto pela equipe, no painel.

   Até aqui o responsável não existia sozinho: ele nascia dentro do
   beneficiário, quando uma solicitação de vaga era aprovada, e a tela de
   Responsáveis era só um agrupamento dos beneficiários por nome. Isso cobre o
   caminho normal, mas não a pessoa que aparece na sede sem ter pedido vaga.

   Esta coleção é para esse caso. Os responsáveis que vieram de solicitação
   continuam onde estão, dentro do beneficiário: a tela mostra as duas origens
   na mesma lista. Não há migração, e por isso nada do que já funciona muda.

   O CPF não tem índice único. Ele é opcional, e índice único em campo que
   aceita nulo exigiria índice parcial — que a criação automática de índices
   do projeto não monta. A conferência de CPF repetido fica no service. */
@Document("responsaveis")
public class Responsavel {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String nome;
    @Indexed private String cpf;
    private String email;
    private String telefone;
    private String parentesco;
    private String cep;
    private String endereco;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String uf;
    private String observacao;
    @Indexed private boolean ativo;
    private Instant dataCadastro;
    @Field(targetType = FieldType.OBJECT_ID) private String adminId;

    public Responsavel() { this.ativo = true; this.dataCadastro = Instant.now(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getParentesco() { return parentesco; }
    public void setParentesco(String parentesco) { this.parentesco = parentesco; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getComplemento() { return complemento; }
    public void setComplemento(String complemento) { this.complemento = complemento; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public Instant getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(Instant dataCadastro) { this.dataCadastro = dataCadastro; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
}
