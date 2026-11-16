package br.org.ong.exception;

import br.org.ong.model.enums.StatusSolicitacao;
import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpMethod;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

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
    @Test void arquivoEstaticoAusenteDevolve404() {
        var erro = new NoResourceFoundException(HttpMethod.GET, "assets/img/hero-criancas.webp");
        var resposta = handler.arquivoNaoEncontrado(erro);
        assertEquals(404, resposta.getStatusCode().value());
        assertEquals(404, resposta.getBody().status());
        assertTrue(resposta.getBody().campos().isEmpty());
    }

    private static class EndpointFake {
        @SuppressWarnings("unused") void listar(StatusSolicitacao status) {}
    }
}
