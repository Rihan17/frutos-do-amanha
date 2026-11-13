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

@Document("solicitacoes")
public class Solicitacao {
    @MongoId(FieldType.OBJECT_ID) private String id;
    @Indexed private StatusSolicitacao status;
    private Instant dataSolicitacao;
    private String motivo;
    private String justificativaRecusa;
    private Solicitante solicitante;
    private DadosBeneficiarioSolicitacao beneficiario;
    private DadosResponsavel responsavel;
    private Consentimento consentimento;
    private Analise analise;

    public Solicitacao() {
        this.status = StatusSolicitacao.PENDENTE;
        this.dataSolicitacao = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public StatusSolicitacao getStatus() { return status; }
    public void setStatus(StatusSolicitacao status) { this.status = status; }
    public Instant getDataSolicitacao() { return dataSolicitacao; }
    public void setDataSolicitacao(Instant dataSolicitacao) { this.dataSolicitacao = dataSolicitacao; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getJustificativaRecusa() { return justificativaRecusa; }
    public void setJustificativaRecusa(String justificativaRecusa) { this.justificativaRecusa = justificativaRecusa; }
    public Solicitante getSolicitante() { return solicitante; }
    public void setSolicitante(Solicitante solicitante) { this.solicitante = solicitante; }
    public DadosBeneficiarioSolicitacao getBeneficiario() { return beneficiario; }
    public void setBeneficiario(DadosBeneficiarioSolicitacao beneficiario) { this.beneficiario = beneficiario; }
    public DadosResponsavel getResponsavel() { return responsavel; }
    public void setResponsavel(DadosResponsavel responsavel) { this.responsavel = responsavel; }
    public Consentimento getConsentimento() { return consentimento; }
    public void setConsentimento(Consentimento consentimento) { this.consentimento = consentimento; }
    public Analise getAnalise() { return analise; }
    public void setAnalise(Analise analise) { this.analise = analise; }
}
