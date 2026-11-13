package br.org.ong.exception;

import br.org.ong.exception.EmailServiceUnavailableException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    record Erro(Instant timestamp, int status, String mensagem, Map<String, String> campos) {}

    @ExceptionHandler(EmailServiceUnavailableException.class)
    ResponseEntity<Erro> emailIndisponivel(EmailServiceUnavailableException e) {
        return ResponseEntity.status(503).body(new Erro(Instant.now(), 503, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    ResponseEntity<Erro> credenciaisInvalidas(CredenciaisInvalidasException e) {
        return ResponseEntity.status(401).body(new Erro(Instant.now(), 401, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(NaoEncontradoException.class)
    ResponseEntity<Erro> nf(NaoEncontradoException e) {
        return ResponseEntity.status(404).body(new Erro(Instant.now(), 404, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Erro> acessoNegado(AccessDeniedException e) {
        return ResponseEntity.status(403).body(new Erro(Instant.now(), 403, e.getMessage(), Map.of()));
    }

    @ExceptionHandler({RegraNegocioException.class, DuplicateKeyException.class})
    ResponseEntity<Erro> conflito(RuntimeException e) {
        return ResponseEntity.status(409).body(new Erro(Instant.now(), 409, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(RequisicaoInvalidaException.class)
    ResponseEntity<Erro> requisicaoInvalida(RequisicaoInvalidaException e) {
        return ResponseEntity.badRequest().body(new Erro(Instant.now(), 400, e.getMessage(), e.getCampos()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Erro> valid(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error -> campos.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new Erro(Instant.now(), 400, "Dados inválidos", campos));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<Erro> tipoIncompativel(MethodArgumentTypeMismatchException e) {
        String detalhe = "Valor inválido";
        if (e.getRequiredType() != null && e.getRequiredType().isEnum()) {
            String aceitos = java.util.Arrays.stream(e.getRequiredType().getEnumConstants())
                    .map(Object::toString).collect(java.util.stream.Collectors.joining(", "));
            detalhe = "Valores aceitos: " + aceitos;
        }
        return ResponseEntity.badRequest().body(new Erro(Instant.now(), 400, "Parâmetro inválido",
                Map.of(e.getName(), detalhe)));
    }

    @ExceptionHandler(PagamentoIndisponivelException.class)
    ResponseEntity<Erro> pagamentoIndisponivel(PagamentoIndisponivelException e) {
        return ResponseEntity.status(503).body(new Erro(Instant.now(), 503, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(FalhaAoIniciarPagamentoException.class)
    ResponseEntity<Erro> falhaPagamento(FalhaAoIniciarPagamentoException e) {
        return ResponseEntity.status(502).body(new Erro(Instant.now(), 502, e.getMessage(), Map.of()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Erro> corpoInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(new Erro(Instant.now(), 400,
                "JSON inválido ou valor de enum desconhecido", Map.of("body", "Verifique o JSON enviado")));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Erro> erroInterno(Exception e) {
        log.error("Erro inesperado ao processar requisição", e);
        return ResponseEntity.internalServerError().body(new Erro(Instant.now(), 500,
                "Erro interno do servidor", Map.of()));
    }
}
