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

@Document("planos")
public class Plano {
    @MongoId(FieldType.OBJECT_ID) private String id;
    @Field(targetType = FieldType.OBJECT_ID) private String doadorId;
    @Field(targetType = FieldType.OBJECT_ID) private String projetoId;
    @Field(targetType = FieldType.DECIMAL128) private BigDecimal valorMensal;
    private int diaCobranca;
    private StatusPlano status;
    private LocalDate dataInicio;
    private LocalDate dataCancelamento;
    private FormaPagamento formaPagamento;
    private String mercadoPagoSubscriptionId;

    public Plano() {
        this.status = StatusPlano.ATIVO;
        this.dataInicio = LocalDate.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDoadorId() { return doadorId; }
    public void setDoadorId(String doadorId) { this.doadorId = doadorId; }
    public String getProjetoId() { return projetoId; }
    public void setProjetoId(String projetoId) { this.projetoId = projetoId; }
    public BigDecimal getValorMensal() { return valorMensal; }
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal; }
    public int getDiaCobranca() { return diaCobranca; }
    public void setDiaCobranca(int diaCobranca) { this.diaCobranca = diaCobranca; }
    public StatusPlano getStatus() { return status; }
    public void setStatus(StatusPlano status) { this.status = status; }
    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getDataCancelamento() { return dataCancelamento; }
    public void setDataCancelamento(LocalDate dataCancelamento) { this.dataCancelamento = dataCancelamento; }
    public FormaPagamento getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(FormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public String getMercadoPagoSubscriptionId() { return mercadoPagoSubscriptionId; }
    public void setMercadoPagoSubscriptionId(String id) { this.mercadoPagoSubscriptionId = id; }
}
