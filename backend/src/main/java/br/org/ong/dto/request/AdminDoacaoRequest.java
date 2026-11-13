package br.org.ong.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminDoacaoRequest(
        @NotBlank @Size(max = 120) String doadorNome,
        @NotNull @DecimalMin(value = "0.01") BigDecimal valor,
        @NotNull LocalDate data,
        @Pattern(regexp = "^[a-fA-F0-9]{24}$", message = "Informe um projeto válido") String projetoId,
        @Size(max = 140) String observacao) {}
