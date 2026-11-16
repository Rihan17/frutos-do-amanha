package br.org.ong.service;

import br.org.ong.dto.request.NoticiaRequest;
import br.org.ong.dto.request.NoticiaUpdateRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.model.Noticia;
import br.org.ong.repository.NoticiaRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class NoticiaServiceTest {
    private static final String ADMIN = "000000000000000000000001";

    private static NoticiaRepository repositorioVazio() {
        NoticiaRepository repo = mock(NoticiaRepository.class);
        when(repo.findBySlug(anyString())).thenReturn(Optional.empty());
        when(repo.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
        return repo;
    }

    @Test void semEnderecoOSlugSaiDoTitulo() {
        NoticiaRepository repo = repositorioVazio();
        Noticia n = new NoticiaService(repo).criar(new NoticiaRequest(
                "1ª Quermesse Beneficente reúne o bairro", null, "Evento",
                "resumo", "texto", null, null, LocalDate.of(2026, 8, 23), true), ADMIN);
        assertEquals("1a-quermesse-beneficente-reune-o-bairro", n.getSlug());
    }

    @Test void oEnderecoInformadoPerdeOPontoHtml() {
        NoticiaRepository repo = repositorioVazio();
        Noticia n = new NoticiaService(repo).criar(new NoticiaRequest(
                "Entrega de julho", "noticia-entrega-julho.html", null,
                "resumo", "texto", null, null, null, true), ADMIN);
        assertEquals("noticia-entrega-julho", n.getSlug());
    }

    @Test void enderecoJaUsadoGanhaSufixo() {
        NoticiaRepository repo = repositorioVazio();
        Noticia existente = new Noticia();
        existente.setId("000000000000000000000009");
        existente.setSlug("entrega-de-julho");
        when(repo.findBySlug("entrega-de-julho")).thenReturn(Optional.of(existente));
        Noticia n = new NoticiaService(repo).criar(new NoticiaRequest(
                "Entrega de julho", null, null, "resumo", "texto", null, null, null, true), ADMIN);
        assertEquals("entrega-de-julho-2", n.getSlug());
    }

    @Test void semDataDePublicacaoUsaHoje() {
        NoticiaRepository repo = repositorioVazio();
        Noticia n = new NoticiaService(repo).criar(new NoticiaRequest(
                "Aviso", null, null, "resumo", "texto", null, null, null, null), ADMIN);
        assertEquals(LocalDate.now(), n.getDataPublicacao());
        assertTrue(n.isPublicada(), "sem dizer nada, a noticia nasce publicada");
    }

    @Test void rascunhoNaoNascePublicado() {
        NoticiaRepository repo = repositorioVazio();
        Noticia n = new NoticiaService(repo).criar(new NoticiaRequest(
                "Campanha de agasalho", null, null, "resumo", "texto", null, null, null, false), ADMIN);
        assertFalse(n.isPublicada());
    }

    /* Trocar o titulo nao pode trocar o endereco: os links ja divulgados da
       materia parariam de funcionar. */
    @Test void mudarOTituloNaoMudaOEndereco() {
        NoticiaRepository repo = repositorioVazio();
        Noticia salva = new Noticia();
        salva.setId("000000000000000000000005");
        salva.setTitulo("Titulo antigo");
        salva.setSlug("titulo-antigo");
        when(repo.findById(salva.getId())).thenReturn(Optional.of(salva));
        Noticia n = new NoticiaService(repo).atualizar(salva.getId(), new NoticiaUpdateRequest(
                "Titulo novo", null, null, null, null, null, null, null, null));
        assertEquals("Titulo novo", n.getTitulo());
        assertEquals("titulo-antigo", n.getSlug());
    }

    @Test void despublicarMandaSoOCampoPublicada() {
        NoticiaRepository repo = repositorioVazio();
        Noticia salva = new Noticia();
        salva.setId("000000000000000000000006");
        salva.setTitulo("No ar");
        salva.setTexto("texto original");
        salva.setPublicada(true);
        when(repo.findById(salva.getId())).thenReturn(Optional.of(salva));
        Noticia n = new NoticiaService(repo).atualizar(salva.getId(), new NoticiaUpdateRequest(
                null, null, null, null, null, null, null, null, false));
        assertFalse(n.isPublicada());
        assertEquals("No ar", n.getTitulo());
        assertEquals("texto original", n.getTexto());
    }

    @Test void rascunhoNaoApareceNoSitePublico() {
        NoticiaRepository repo = repositorioVazio();
        Noticia rascunho = new Noticia();
        rascunho.setId("000000000000000000000007");
        rascunho.setSlug("so-um-rascunho");
        rascunho.setPublicada(false);
        when(repo.findBySlug("so-um-rascunho")).thenReturn(Optional.of(rascunho));
        NoticiaService servico = new NoticiaService(repo);
        assertThrows(NaoEncontradoException.class, () -> servico.publica("so-um-rascunho"));
    }
}
