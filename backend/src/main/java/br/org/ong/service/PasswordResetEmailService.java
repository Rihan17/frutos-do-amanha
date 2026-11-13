package br.org.ong.service;

import br.org.ong.exception.EmailServiceUnavailableException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {
    private final ObjectProvider<JavaMailSender> senderProvider;
    private final boolean enabled;
    private final String smtpHost;
    private final String fromAddress;
    private final String frontendBaseUrl;

    public PasswordResetEmailService(
            ObjectProvider<JavaMailSender> senderProvider,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${app.mail.from:}") String fromAddress,
            @Value("${app.frontend.base-url:http://localhost:5500}") String frontendBaseUrl) {
        this.senderProvider = senderProvider;
        this.enabled = enabled;
        this.smtpHost = smtpHost;
        this.fromAddress = fromAddress;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public boolean isConfigured() {
        return enabled && !smtpHost.isBlank() && !fromAddress.isBlank()
                && senderProvider.getIfAvailable() != null;
    }

    public void requireConfigured() {
        if (!isConfigured()) throw new EmailServiceUnavailableException();
    }

    public void sendPasswordReset(String email, String name, String token, long expirationMinutes) {
        requireConfigured();
        String baseUrl = frontendBaseUrl.replaceAll("/+$", "");
        String resetLink = baseUrl + "/redefinir-senha.html?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Redefinição de senha — ONG Frutos do Amanhã");
        message.setText(String.join(System.lineSeparator(),
                "Olá, " + (name == null || name.isBlank() ? "" : name.trim()) + ",",
                "",
                "Recebemos uma solicitação para redefinir a senha da sua conta.",
                "Use o link abaixo para criar uma nova senha:",
                "",
                resetLink,
                "",
                "O link expira em " + expirationMinutes + " minutos e só pode ser usado uma vez.",
                "Se você não pediu essa alteração, ignore este e-mail. Sua senha atual continuará valendo."));
        senderProvider.getObject().send(message);
    }
}
