package br.org.ong.dto.response;

import br.org.ong.model.Plano;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanoResponse(String id, String projetoId, BigDecimal valorMensal, int diaCobranca,
        String status, String formaPagamento, LocalDate dataInicio, LocalDate dataCancelamento,
        String checkoutUrl) {
    public static PlanoResponse from(Plano plan) { return from(plan, null); }
    public static PlanoResponse from(Plano plan, String checkoutUrl) {
        return new PlanoResponse(plan.getId(), plan.getProjetoId(), plan.getValorMensal(), plan.getDiaCobranca(),
                plan.getStatus().name(), plan.getFormaPagamento() == null ? null : plan.getFormaPagamento().name(),
                plan.getDataInicio(), plan.getDataCancelamento(), checkoutUrl);
    }
}
