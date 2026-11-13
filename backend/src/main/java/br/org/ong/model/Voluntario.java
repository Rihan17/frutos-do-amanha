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

@Document("voluntarios")
public class Voluntario {
    @MongoId(FieldType.OBJECT_ID) private String id;
    @Field(targetType = FieldType.OBJECT_ID) private String usuarioId;
    @Field(targetType = FieldType.OBJECT_ID) private String projetoId;
    private String nomeContato;
    private String emailContato;
    private String telefoneContato;
    private StatusVoluntario status;
    private Instant dataInscricao;
    private Instant dataSaida;
    private String observacao;
    private String justificativaRecusa;
    private Analise analise;

    public Voluntario() {
        this.status = StatusVoluntario.PENDENTE;
        this.dataInscricao = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsuarioId() { return usuarioId; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public String getProjetoId() { return projetoId; }
    public void setProjetoId(String projetoId) { this.projetoId = projetoId; }
    public String getNomeContato() { return nomeContato; }
    public void setNomeContato(String value) { this.nomeContato = value; }
    public String getEmailContato() { return emailContato; }
    public void setEmailContato(String value) { this.emailContato = value; }
    public String getTelefoneContato() { return telefoneContato; }
    public void setTelefoneContato(String value) { this.telefoneContato = value; }
    public StatusVoluntario getStatus() { return status; }
    public void setStatus(StatusVoluntario status) { this.status = status; }
    public Instant getDataInscricao() { return dataInscricao; }
    public void setDataInscricao(Instant dataInscricao) { this.dataInscricao = dataInscricao; }
    public Instant getDataSaida() { return dataSaida; }
    public void setDataSaida(Instant dataSaida) { this.dataSaida = dataSaida; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public String getJustificativaRecusa() { return justificativaRecusa; }
    public void setJustificativaRecusa(String justificativaRecusa) { this.justificativaRecusa = justificativaRecusa; }
    public Analise getAnalise() { return analise; }
    public void setAnalise(Analise analise) { this.analise = analise; }
}
