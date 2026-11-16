package br.org.ong.service;

import br.org.ong.dto.request.NoticiaRequest;
import br.org.ong.dto.request.NoticiaUpdateRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Noticia;
import br.org.ong.repository.NoticiaRepository;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class NoticiaService {
    private final NoticiaRepository noticias;
    public NoticiaService(NoticiaRepository noticias) { this.noticias = noticias; }

    /* Da mais recente para a mais antiga. Rascunho ainda sem data de
       publicação vai para o fim, e não para o topo. */
    private static final Comparator<Noticia> MAIS_RECENTE =
            Comparator.comparing(Noticia::getDataPublicacao, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(Noticia::getDataCadastro, Comparator.nullsLast(Comparator.reverseOrder()));

    public List<Noticia> publicadas() {
        return noticias.findByPublicadaTrue().stream().sorted(MAIS_RECENTE).toList();
    }
    public List<Noticia> todas() {
        return noticias.findAll().stream().sorted(MAIS_RECENTE).toList();
    }
    /* Aceita o endereço da página ou o id, como o ProjetoService faz. */
    public Noticia publica(String slug) {
        Noticia item = noticias.findBySlug(slug)
                .or(() -> noticias.findById(slug))
                .orElseThrow(() -> new NaoEncontradoException("Notícia não encontrada"));
        if (!item.isPublicada()) throw new NaoEncontradoException("Notícia não encontrada");
        return item;
    }
    public Noticia obter(String id) {
        return noticias.findById(id).orElseThrow(() -> new NaoEncontradoException("Notícia não encontrada"));
    }

    public Noticia criar(NoticiaRequest request, String adminId) {
        Noticia item = new Noticia();
        item.setAdminId(adminId);
        item.setTitulo(request.titulo().trim());
        item.setSlug(slugLivre(escolherSlug(request.slug(), request.titulo()), null));
        item.setResumo(request.resumo().trim());
        item.setTexto(request.texto());
        item.setDataPublicacao(request.dataPublicacao() == null ? LocalDate.now() : request.dataPublicacao());
        item.setPublicada(request.publicada() == null || request.publicada());
        if (request.categoria() != null) item.setCategoria(request.categoria());
        if (request.imagemUrl() != null) item.setImagemUrl(request.imagemUrl());
        if (request.imagemAlt() != null) item.setImagemAlt(request.imagemAlt());
        return noticias.save(item);
    }

    public Noticia atualizar(String id, NoticiaUpdateRequest request) {
        Noticia item = obter(id);
        if (request.titulo() != null) {
            if (request.titulo().isBlank()) throw new RegraNegocioException("O título não pode ficar vazio");
            item.setTitulo(request.titulo().trim());
        }
        /* O endereço só muda quando a pessoa pede. Trocar sozinho junto com o
           título quebraria os links já divulgados da matéria. */
        if (request.slug() != null && !request.slug().isBlank()) {
            item.setSlug(slugLivre(slug(request.slug()), item.getId()));
        }
        if (request.resumo() != null) item.setResumo(request.resumo());
        if (request.texto() != null) item.setTexto(request.texto());
        if (request.categoria() != null) item.setCategoria(request.categoria());
        if (request.imagemUrl() != null) item.setImagemUrl(request.imagemUrl());
        if (request.imagemAlt() != null) item.setImagemAlt(request.imagemAlt());
        if (request.dataPublicacao() != null) item.setDataPublicacao(request.dataPublicacao());
        if (request.publicada() != null) item.setPublicada(request.publicada());
        return noticias.save(item);
    }

    public void excluir(String id) { noticias.delete(obter(id)); }

    private static String escolherSlug(String pedido, String titulo) {
        return slug(pedido == null || pedido.isBlank() ? titulo : pedido);
    }
    /* Dois textos diferentes podem virar o mesmo endereço ("Entrega de julho"
       duas vezes, em anos diferentes). Quando já existe, acrescenta -2, -3… */
    private String slugLivre(String base, String idAtual) {
        if (base.isBlank()) base = "noticia";
        String tentativa = base;
        int n = 2;
        while (ocupado(tentativa, idAtual)) tentativa = base + "-" + n++;
        return tentativa;
    }
    private boolean ocupado(String slug, String idAtual) {
        return noticias.findBySlug(slug).filter(outra -> !outra.getId().equals(idAtual)).isPresent();
    }
    /* O endereço pode vir escrito como "noticia-quermesse.html"; o .html sai,
       porque a página não é mais um arquivo. */
    private static String slug(String value) {
        String limpo = (value == null ? "" : value).replaceAll("(?i)\\.html?$", "");
        /* "ª" e "º" não são acentos: o Normalizer não os desmonta, e a limpeza
           abaixo os apagaria. Sem isto "1ª Quermesse" viraria "1-quermesse". */
        limpo = limpo.replace("ª", "a").replace("º", "o");
        return Normalizer.normalize(limpo, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
