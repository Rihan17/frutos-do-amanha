package br.org.ong.dto.request;
import jakarta.validation.constraints.*;
public record VoluntarioRequest(@NotBlank String projetoId, @Size(max = 1000) String observacao) {}
