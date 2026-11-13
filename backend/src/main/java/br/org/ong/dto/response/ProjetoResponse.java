package br.org.ong.dto.response;

import br.org.ong.model.Projeto;
import java.time.Instant;

public record ProjetoResponse(String id, String nome, String slug, String categoria, String resumo,
        String descricao, String imagemUrl, String imagemAlt, int ordem, Instant dataCadastro, boolean ativo) {
    public static ProjetoResponse from(Projeto p) {
        return new ProjetoResponse(p.getId(), p.getNome(), p.getSlug(), p.getCategoria(), p.getResumo(),
                p.getDescricao(), p.getImagemUrl(), p.getImagemAlt(), p.getOrdem(), p.getDataCadastro(), p.isAtivo());
    }
}
