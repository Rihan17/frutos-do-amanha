package br.org.ong.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PlanoRequest(String projetoId, @NotNull @Positive BigDecimal valorMensal,
                           @Min(1) @Max(28) int diaCobranca) {}
