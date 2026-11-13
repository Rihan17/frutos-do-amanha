package br.org.ong.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;
import org.springframework.data.mongodb.core.index.Indexed;
import br.org.ong.model.enums.*;
import br.org.ong.model.embedded.*;
import java.time.*; import java.math.BigDecimal; import java.util.*; import org.bson.types.ObjectId;

@Document("usuarios")
public class Usuario {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String nome;
    @Indexed(unique = true) private String email;
    private String telefone;
    private String cpfCnpj;
    private String senhaHash;
    private TipoUsuario tipo;
    private String cargo;
    private boolean ativo;
    private Instant dataCadastro;

    public Usuario() {
        this.ativo = true;
        this.dataCadastro = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getCpfCnpj() { return cpfCnpj; }
    public void setCpfCnpj(String cpfCnpj) { this.cpfCnpj = cpfCnpj; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public TipoUsuario getTipo() { return tipo; }
    public void setTipo(TipoUsuario tipo) { this.tipo = tipo; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public Instant getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(Instant dataCadastro) { this.dataCadastro = dataCadastro; }
}
