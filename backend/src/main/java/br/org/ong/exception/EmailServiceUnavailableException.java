package br.org.ong.exception;

public class EmailServiceUnavailableException extends RuntimeException {
    public EmailServiceUnavailableException() {
        super("A recuperação de senha está indisponível: configure o serviço SMTP no backend");
    }
}
