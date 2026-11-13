package br.org.ong.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record BeneficiarioGestaoRequest(
        @Size(max = 20) List<@Pattern(regexp = "^[a-fA-F0-9]{24}$", message = "Informe um projeto válido") String> projetoIds,
        Boolean ativo,
        LocalDate dataSaida,
        @Size(max = 500) String motivoSaida) {}
