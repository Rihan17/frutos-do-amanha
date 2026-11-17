package br.org.ong.exception;

import br.org.ong.model.enums.StatusSolicitacao;
import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test void erroDeRequisicaoUsaFormatoPadraoEStatus400() {
        var resposta = handler.requisicaoInvalida(
                new RequisicaoInvalidaException("Id inválido", Map.of("id", "Id inválido")));
        assertEquals(400, resposta.getStatusCode().value());
        assertEquals(400, resposta.getBody().status());
        assertEquals("Id inválido", resposta.getBody().mensagem());
        assertEquals("Id inválido", resposta.getBody().campos().get("id"));
        assertNotNull(resposta.getBody().timestamp());
    }

    @Test void erroDeConversaoDeParametroUsaFormatoPadrao() throws NoSuchMethodException {
        Method metodo = EndpointFake.class.getDeclaredMethod("listar", StatusSolicitacao.class);
        var erro = new MethodArgumentTypeMismatchException("invalido", StatusSolicitacao.class, "status",
                new MethodParameter(metodo, 0), new IllegalArgumentException("enum inválido"));
        var resposta = handler.tipoIncompativel(erro);
        assertEquals(400, resposta.getStatusCode().value());
        assertEquals(400, resposta.getBody().status());
        assertTrue(resposta.getBody().campos().get("status").contains("PENDENTE, APROVADA, RECUSADA"));
    }

    @Test void jsonInvalidoUsaFormatoPadrao() {
        var erro = new HttpMessageNotReadableException("JSON inválido", mock(HttpInputMessage.class));
        var resposta = handler.corpoInvalido(erro);
        assertEquals(400, resposta.getStatusCode().value());
        assertEquals(400, resposta.getBody().status());
        assertTrue(resposta.getBody().campos().containsKey("body"));
    }

    /* Arquivo ausente e 404, e nao 500. Sem o tratador proprio isso caia no
       catch-all, e cada visita ao site gerava varios 500 com rastro de pilha
       no log: o carregador de fotos pedia uma versao .webp que nunca existiu.
       Se alguem remover o tratador, este teste avisa. */
    /* Pedido do proprio site (fetch): JSON, que e o que o formulario sabe
       mostrar. O Accept de um fetch nao pede html. */
    @Test void arquivoAusentePedidoPelaApiDevolve404EmJson() throws Exception {
        var erro = new NoResourceFoundException(HttpMethod.GET, "assets/img/hero-criancas.webp");
        var req = mock(HttpServletRequest.class);
        when(req.getHeader("Accept")).thenReturn("*/*");
        var resposta = handler.arquivoNaoEncontrado(erro, req, mock(HttpServletResponse.class));
        assertNotNull(resposta, "sem navegacao, a resposta continua sendo JSON");
        assertEquals(404, resposta.getStatusCode().value());
        assertEquals(404, resposta.getBody().status());
        assertTrue(resposta.getBody().campos().isEmpty());
    }

    /* Pessoa digitando o endereco no navegador: ai vale a pagina do site.
       Sem o 404.html no classpath (que e o caso nos testes), o tratador cai
       de volta no JSON em vez de responder vazio. */
    @Test void navegacaoSemAPaginaNoPacoteVoltaParaJson() throws Exception {
        var erro = new NoResourceFoundException(HttpMethod.GET, "paginaquenaoexiste.html");
        var req = mock(HttpServletRequest.class);
        when(req.getHeader("Accept")).thenReturn("text/html,application/xhtml+xml");
        when(req.getHeader("Sec-Fetch-Mode")).thenReturn("navigate");
        var resposta = handler.arquivoNaoEncontrado(erro, req, mock(HttpServletResponse.class));
        assertNotNull(resposta);
        assertEquals(404, resposta.getStatusCode().value());
    }

    private static class EndpointFake {
        @SuppressWarnings("unused") void listar(StatusSolicitacao status) {}
    }
}
