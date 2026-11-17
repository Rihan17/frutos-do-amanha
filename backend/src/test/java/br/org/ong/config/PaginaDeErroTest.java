package br.org.ong.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/* A regra que separa "pessoa digitando um endereco" de "o site chamando a
   API". Errar para um lado devolve JSON cru na tela de quem navega; errar
   para o outro devolve uma pagina HTML onde o formulario espera uma
   mensagem, e o aviso de erro fica em branco. */
class PaginaDeErroTest {

    private static HttpServletRequest pedido(String accept, String modo) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("Accept")).thenReturn(accept);
        when(req.getHeader("Sec-Fetch-Mode")).thenReturn(modo);
        return req;
    }

    @Test void navegacaoDoNavegadorPedeAPagina() {
        assertTrue(PaginaDeErro.querPagina(
                pedido("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "navigate")));
    }

    /* O fetch do api.js nao define Accept, entao o navegador manda o curinga
       (qualquer tipo), que nao cita text/html. */
    @Test void chamadaDaApiNaoPedeAPagina() {
        assertFalse(PaginaDeErro.querPagina(pedido("*/*", "cors")));
        assertFalse(PaginaDeErro.querPagina(pedido("application/json", "cors")));
    }

    /* Caso traicoeiro: alguem pede html por fetch. O Sec-Fetch-Mode entrega
       que nao e navegacao, e a resposta tem de seguir em JSON. */
    @Test void fetchQuePedeHtmlAindaRecebeJson() {
        assertFalse(PaginaDeErro.querPagina(pedido("text/html", "cors")));
        assertFalse(PaginaDeErro.querPagina(pedido("text/html", "same-origin")));
    }

    /* Sem o cabecalho Sec-Fetch-Mode (navegador antigo, curl), o Accept
       decide sozinho. */
    @Test void semSecFetchModeOAcceptDecide() {
        assertTrue(PaginaDeErro.querPagina(pedido("text/html", null)));
        assertFalse(PaginaDeErro.querPagina(pedido("application/json", null)));
    }

    @Test void semCabecalhoNenhumNaoPedeAPagina() {
        assertFalse(PaginaDeErro.querPagina(pedido(null, null)));
        assertFalse(PaginaDeErro.querPagina(null));
    }
}
