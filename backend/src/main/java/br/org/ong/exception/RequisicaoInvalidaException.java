package br.org.ong.exception;

import java.util.Map;

public class RequisicaoInvalidaException extends RuntimeException {
    private final Map<String, String> campos;

    public RequisicaoInvalidaException(String mensagem) {
        this(mensagem, Map.of());
    }

    public RequisicaoInvalidaException(String mensagem, Map<String, String> campos) {
        super(mensagem);
        this.campos = Map.copyOf(campos);
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
