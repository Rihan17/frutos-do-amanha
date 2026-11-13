package br.org.ong.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjetoRequest(
        @NotBlank @Size(max = 100) String nome,
        @Size(max = 80) String categoria,
        @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(999) Integer ordem,
        @Size(max = 300) String resumo,
        @NotBlank @Size(max = 10000) String descricao,
        @Size(max = 4000000) String imagemUrl,
        @Size(max = 160) String imagemAlt,
        Boolean ativo) {}
