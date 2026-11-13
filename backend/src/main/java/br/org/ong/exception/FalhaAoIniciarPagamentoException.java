package br.org.ong.exception;

public class FalhaAoIniciarPagamentoException extends RuntimeException {
    public FalhaAoIniciarPagamentoException() {
        super("Não foi possível iniciar o pagamento no Mercado Pago. Tente novamente.");
    }
}
