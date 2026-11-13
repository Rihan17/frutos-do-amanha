package br.org.ong.dto.request;
import jakarta.validation.constraints.NotBlank;
public record CargoRequest(@NotBlank String cargo) {}
