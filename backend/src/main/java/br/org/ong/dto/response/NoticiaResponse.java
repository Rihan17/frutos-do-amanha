package br.org.ong.dto.response;

import br.org.ong.model.Noticia;
import java.time.Instant;
import java.time.LocalDate;

public record NoticiaResponse(String id, String titulo, String slug, String categoria, String resumo,
        String texto, String imagemUrl, String imagemAlt, LocalDate dataPublicacao, boolean publicada,
        Instant dataCadastro) {
    public static NoticiaResponse from(Noticia n) {
        return new NoticiaResponse(n.getId(), n.getTitulo(), n.getSlug(), n.getCategoria(), n.getResumo(),
                n.getTexto(), n.getImagemUrl(), n.getImagemAlt(), n.getDataPublicacao(), n.isPublicada(),
                n.getDataCadastro());
    }

    /* A lista pública mostra a foto no cartão, mas não precisa do texto
       inteiro, que pode ter 40 mil caracteres. */
    public static NoticiaResponse resumida(Noticia n) {
        return new NoticiaResponse(n.getId(), n.getTitulo(), n.getSlug(), n.getCategoria(), n.getResumo(),
                null, n.getImagemUrl(), n.getImagemAlt(), n.getDataPublicacao(), n.isPublicada(),
                n.getDataCadastro());
    }

    /* A tabela do painel não mostra foto nenhuma, e as fotos vêm embutidas em
       base64: mandá-las aqui seria trafegar megabytes por linha à toa. Quem
       abre uma notícia para editar busca o registro inteiro pelo id. */
    public static NoticiaResponse paraTabela(Noticia n) {
        return new NoticiaResponse(n.getId(), n.getTitulo(), n.getSlug(), n.getCategoria(), n.getResumo(),
                null, null, n.getImagemAlt(), n.getDataPublicacao(), n.isPublicada(), n.getDataCadastro());
    }
}
