package br.org.ong.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(
        @NotBlank String senhaAtual,
        @NotBlank @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres") String novaSenha) {}
