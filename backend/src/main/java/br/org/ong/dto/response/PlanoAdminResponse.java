package br.org.ong.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanoAdminResponse(String id, String doadorId, String doadorNome, String projetoId, BigDecimal valorMensal,
        int diaCobranca, String status, String formaPagamento, LocalDate dataInicio, LocalDate dataCancelamento) {}
