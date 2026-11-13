package br.org.ong.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminCriacaoRequest(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank String telefone,
        @NotBlank String cargo,
        @NotBlank @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres") String senha) {}
