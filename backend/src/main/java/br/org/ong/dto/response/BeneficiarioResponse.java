package br.org.ong.dto.response;
import br.org.ong.model.Beneficiario; import br.org.ong.model.embedded.DadosResponsavel; import java.time.LocalDate; import java.util.List;
public record BeneficiarioResponse(String id,String nome,LocalDate dataNascimento,String genero,LocalDate dataEntrada,LocalDate dataSaida,String motivoSaida,boolean ativo,String solicitacaoOrigemId,List<String> projetoIds,DadosResponsavel responsavel) {
 public static BeneficiarioResponse from(Beneficiario b){return new BeneficiarioResponse(b.getId(),b.getNome(),b.getDataNascimento(),b.getGenero(),b.getDataEntrada(),b.getDataSaida(),b.getMotivoSaida(),b.isAtivo(),b.getSolicitacaoOrigemId(),b.getProjetoIds().stream().map(Object::toString).toList(),b.getResponsavel());}
}
