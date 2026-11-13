package br.org.ong.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ProjetoUpdateRequest(
        @Size(max = 100) String nome,
        @Size(max = 80) String categoria,
        @Min(1) @Max(999) Integer ordem,
        @Size(max = 300) String resumo,
        @Size(max = 10000) String descricao,
        @Size(max = 4000000) String imagemUrl,
        @Size(max = 160) String imagemAlt,
        Boolean ativo) {}
