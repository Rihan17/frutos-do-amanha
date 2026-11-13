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

@Document("beneficiarios")
public class Beneficiario {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String nome;
    private LocalDate dataNascimento;
    private String genero;
    private LocalDate dataEntrada;
    private LocalDate dataSaida;
    private String motivoSaida;
    private boolean ativo;
    @Indexed(unique = true) @Field(targetType = FieldType.OBJECT_ID) private String solicitacaoOrigemId;
    private List<ObjectId> projetoIds;
    private DadosResponsavel responsavel;

    public Beneficiario() {
        this.ativo = true;
        this.projetoIds = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }
    public LocalDate getDataSaida() { return dataSaida; }
    public void setDataSaida(LocalDate dataSaida) { this.dataSaida = dataSaida; }
    public String getMotivoSaida() { return motivoSaida; }
    public void setMotivoSaida(String motivoSaida) { this.motivoSaida = motivoSaida; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public String getSolicitacaoOrigemId() { return solicitacaoOrigemId; }
    public void setSolicitacaoOrigemId(String solicitacaoOrigemId) { this.solicitacaoOrigemId = solicitacaoOrigemId; }
    public List<ObjectId> getProjetoIds() { return projetoIds; }
    public void setProjetoIds(List<ObjectId> projetoIds) { this.projetoIds = projetoIds; }
    public DadosResponsavel getResponsavel() { return responsavel; }
    public void setResponsavel(DadosResponsavel responsavel) { this.responsavel = responsavel; }
}
