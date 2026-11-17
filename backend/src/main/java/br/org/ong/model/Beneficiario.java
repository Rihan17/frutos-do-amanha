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
    /* As turmas em que a criança está: dia, hora e vaga moram na Atividade.
       projetoIds continua aqui e guarda outra coisa — a ligação com o que o
       site mostra ao público. Documentos gravados antes desta mudança não
       têm o campo, e o driver o lê como null; por isso o getter nunca
       devolve null, para quem chama não precisar conferir. */
    private List<ObjectId> atividadeIds;
    private DadosResponsavel responsavel;

    public Beneficiario() {
        this.ativo = true;
        this.projetoIds = new ArrayList<>();
        this.atividadeIds = new ArrayList<>();
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
    public List<ObjectId> getAtividadeIds() { return atividadeIds == null ? new ArrayList<>() : atividadeIds; }
    public void setAtividadeIds(List<ObjectId> atividadeIds) { this.atividadeIds = atividadeIds; }
    public DadosResponsavel getResponsavel() { return responsavel; }
    public void setResponsavel(DadosResponsavel responsavel) { this.responsavel = responsavel; }
}
