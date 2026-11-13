package br.org.ong.exception;

import br.org.ong.model.enums.StatusSolicitacao;
import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    private static class EndpointFake {
        @SuppressWarnings("unused") void listar(StatusSolicitacao status) {}
    }
}
