package br.org.ong.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VoluntarioPublicoRequest(
        @Size(max = 24) String projetoId,
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 30) String telefone,
        @Size(max = 1000) String observacao) {}
