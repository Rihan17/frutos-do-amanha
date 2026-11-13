package br.org.ong.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record DoacaoRequest(String projetoId, @NotNull @Positive BigDecimal valor) {}
