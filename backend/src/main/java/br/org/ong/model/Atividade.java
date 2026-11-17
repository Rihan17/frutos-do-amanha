package br.org.ong.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

/* Uma turma: o que a criança faz, em que dias, a que horas e com quantas
   vagas.

   Projeto é outra coisa, e as duas coexistem de propósito. Projeto é o que o
   site mostra ao público — "Feirinha da Criança", com foto, resumo e página
   própria. Atividade é o que a equipe usa para organizar a semana: "Reforço
   escolar, terça e quinta, 14h às 16h, 20 vagas". Um projeto pode render
   várias atividades, e nem toda atividade vira página no site.

   Os dias ficam como códigos de três letras (SEG, TER, ...) em vez de texto
   livre: assim a tela pode marcá-los em caixas, ordenar a semana e, no futuro,
   montar uma grade. O horário é texto "HH:mm" porque é isso que o campo
   <input type="time"> do navegador manda e é isso que a pessoa lê.

   vagas = 0 significa sem limite, e não turma lotada. Nem toda atividade tem
   teto, e obrigar um número inventado faria a tela mentir. */
@Document("atividades")
public class Atividade {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String nome;
    private List<String> dias;
    private String horarioInicio;
    private String horarioFim;
    private String local;
    private int vagas;
    private String observacao;
    @Indexed private boolean ativa;
    private Instant dataCadastro;

    public Atividade() {
        this.ativa = true;
        this.dias = new ArrayList<>();
        this.dataCadastro = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public List<String> getDias() { return dias; }
    public void setDias(List<String> dias) { this.dias = dias == null ? new ArrayList<>() : dias; }
    public String getHorarioInicio() { return horarioInicio; }
    public void setHorarioInicio(String horarioInicio) { this.horarioInicio = horarioInicio; }
    public String getHorarioFim() { return horarioFim; }
    public void setHorarioFim(String horarioFim) { this.horarioFim = horarioFim; }
    public String getLocal() { return local; }
    public void setLocal(String local) { this.local = local; }
    public int getVagas() { return vagas; }
    public void setVagas(int vagas) { this.vagas = vagas; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public boolean isAtiva() { return ativa; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
    public Instant getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(Instant dataCadastro) { this.dataCadastro = dataCadastro; }
}
