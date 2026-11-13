package br.org.ong.dto.response;

import br.org.ong.model.Doacao;
import java.math.BigDecimal;
import java.time.Instant;

public record DoacaoResponse(String id, String projetoId, String planoId, String competencia,
        BigDecimal valor, Instant data, String tipo, String formaPagamento, String status,
        String checkoutUrl) {
    public static DoacaoResponse from(Doacao donation) {
        return from(donation, null);
    }
    public static DoacaoResponse from(Doacao donation, String checkoutUrl) {
        return new DoacaoResponse(donation.getId(), donation.getProjetoId(), donation.getPlanoId(),
                donation.getCompetencia(), donation.getValor(), donation.getData(),
                donation.getTipo() == null ? null : donation.getTipo().name(),
                donation.getFormaPagamento() == null ? null : donation.getFormaPagamento().name(),
                donation.getStatus() == null ? null : donation.getStatus().name(), checkoutUrl);
    }
}
