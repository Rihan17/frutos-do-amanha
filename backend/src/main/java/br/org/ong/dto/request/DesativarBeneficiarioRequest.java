package br.org.ong.dto.request;
import jakarta.validation.constraints.NotBlank;
public record DesativarBeneficiarioRequest(@NotBlank String motivoSaida) {}
