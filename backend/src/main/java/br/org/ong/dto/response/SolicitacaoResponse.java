package br.org.ong.dto.response;
import br.org.ong.model.Solicitacao; import br.org.ong.model.embedded.Solicitante; import br.org.ong.model.embedded.DadosBeneficiarioSolicitacao; import br.org.ong.model.embedded.DadosResponsavel; import br.org.ong.model.embedded.Consentimento; import br.org.ong.model.embedded.Analise; import java.time.Instant; import java.time.LocalDate;
public record SolicitacaoResponse(String id,String status,Instant dataSolicitacao,String motivo,String justificativaRecusa,Solicitante solicitante,DadosBeneficiarioSolicitacao beneficiario,DadosResponsavel responsavel,Consentimento consentimento,Analise analise) {
 public static SolicitacaoResponse from(Solicitacao s){return new SolicitacaoResponse(s.getId(),s.getStatus().name(),s.getDataSolicitacao(),s.getMotivo(),s.getJustificativaRecusa(),s.getSolicitante(),s.getBeneficiario(),s.getResponsavel(),s.getConsentimento(),s.getAnalise());}
}
