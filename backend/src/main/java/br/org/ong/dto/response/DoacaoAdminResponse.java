package br.org.ong.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record DoacaoAdminResponse(String id, String doadorId, String doadorNome, String projetoId, String planoId,
        String competencia, BigDecimal valor, Instant data, String tipo, String formaPagamento, String status,
        String origem, String observacao, String doadorEmail) {}
