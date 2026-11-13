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

@Document("doacoes")
public class Doacao {
    @MongoId(FieldType.OBJECT_ID) private String id;
    @Field(targetType = FieldType.OBJECT_ID) private String doadorId;
    @Field(targetType = FieldType.OBJECT_ID) private String projetoId;
    @Field(targetType = FieldType.OBJECT_ID) private String planoId;
    private String competencia;
    @Field(targetType = FieldType.DECIMAL128) private BigDecimal valor;
    private Instant data;
    private TipoDoacao tipo;
    private FormaPagamento formaPagamento;
    private StatusDoacao status;
    private String mercadoPagoPreferenceId;
    private String mercadoPagoPaymentId;
    private String mercadoPagoPaymentStatus;
    private String doadorNomeManual;
    private String doadorEmailManual;
    private String origem;
    private String observacao;

    public Doacao() {
        this.data = Instant.now();
        this.status = StatusDoacao.PENDENTE;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDoadorId() { return doadorId; }
    public void setDoadorId(String doadorId) { this.doadorId = doadorId; }
    public String getProjetoId() { return projetoId; }
    public void setProjetoId(String projetoId) { this.projetoId = projetoId; }
    public String getPlanoId() { return planoId; }
    public void setPlanoId(String planoId) { this.planoId = planoId; }
    public String getCompetencia() { return competencia; }
    public void setCompetencia(String competencia) { this.competencia = competencia; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public Instant getData() { return data; }
    public void setData(Instant data) { this.data = data; }
    public TipoDoacao getTipo() { return tipo; }
    public void setTipo(TipoDoacao tipo) { this.tipo = tipo; }
    public FormaPagamento getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(FormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public StatusDoacao getStatus() { return status; }
    public void setStatus(StatusDoacao status) { this.status = status; }
    public String getMercadoPagoPreferenceId() { return mercadoPagoPreferenceId; }
    public void setMercadoPagoPreferenceId(String id) { this.mercadoPagoPreferenceId = id; }
    public String getMercadoPagoPaymentId() { return mercadoPagoPaymentId; }
    public void setMercadoPagoPaymentId(String id) { this.mercadoPagoPaymentId = id; }
    public String getMercadoPagoPaymentStatus() { return mercadoPagoPaymentStatus; }
    public void setMercadoPagoPaymentStatus(String status) { this.mercadoPagoPaymentStatus = status; }
    public String getDoadorNomeManual() { return doadorNomeManual; }
    public void setDoadorNomeManual(String nome) { this.doadorNomeManual = nome; }
    public String getDoadorEmailManual() { return doadorEmailManual; }
    public void setDoadorEmailManual(String email) { this.doadorEmailManual = email; }
    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
