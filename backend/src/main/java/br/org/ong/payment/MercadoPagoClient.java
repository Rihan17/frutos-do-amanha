package br.org.ong.payment;

import br.org.ong.exception.FalhaAoIniciarPagamentoException;
import br.org.ong.exception.PagamentoIndisponivelException;
import br.org.ong.model.Doacao;
import br.org.ong.model.Plano;
import br.org.ong.model.Usuario;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class MercadoPagoClient {
    private static final Logger log = LoggerFactory.getLogger(MercadoPagoClient.class);
    private final RestClient client;
    private final String accessToken;
    private final String webhookSecret;
    private final String frontendBaseUrl;
    private final String backendPublicUrl;

    public MercadoPagoClient(RestClient.Builder builder,
            @Value("${app.mercado-pago.access-token:}") String accessToken,
            @Value("${app.mercado-pago.webhook-secret:}") String webhookSecret,
            @Value("${app.mercado-pago.frontend-base-url:http://localhost:5500}") String frontendBaseUrl,
            @Value("${app.mercado-pago.backend-public-url:}") String backendPublicUrl) {
        this.client = builder.baseUrl("https://api.mercadopago.com").build();
        this.accessToken = accessToken;
        this.webhookSecret = webhookSecret;
        this.frontendBaseUrl = trimSlash(frontendBaseUrl);
        this.backendPublicUrl = trimSlash(backendPublicUrl);
    }

    public void requireConfigured() {
        if (accessToken == null || accessToken.isBlank()) {
            throw new PagamentoIndisponivelException("Configure MERCADOPAGO_ACCESS_TOKEN no backend para habilitar pagamentos.");
        }
    }

    public boolean webhookConfigured() { return webhookSecret != null && !webhookSecret.isBlank(); }

    public PaymentSession criarPreferencia(Doacao donation, Usuario donor) {
        requireConfigured();
        Map<String, Object> payload = new HashMap<>();
        payload.put("items", java.util.List.of(Map.of(
                "id", donation.getId(), "title", "Doação — ONG Frutos do Amanhã",
                "quantity", 1, "currency_id", "BRL", "unit_price", donation.getValor())));
        payload.put("external_reference", donation.getId());
        payload.put("payer", Map.of("email", donor.getEmail(), "name", donor.getNome()));
        if (httpsUrl(frontendBaseUrl)) {
            payload.put("back_urls", Map.of(
                    "success", frontendBaseUrl + "/doar-sucesso.html?doacao=" + donation.getId(),
                    "failure", frontendBaseUrl + "/doar-falha.html?doacao=" + donation.getId(),
                    "pending", frontendBaseUrl + "/doar-pendente.html?doacao=" + donation.getId()));
            payload.put("auto_return", "approved");
        }
        if (httpsUrl(backendPublicUrl)) payload.put("notification_url", backendPublicUrl + "/webhooks/mercadopago");
        payload.put("metadata", Map.of("doacao_id", donation.getId()));
        JsonNode response = post("/checkout/preferences", payload);
        return new PaymentSession(text(response, "id"), text(response, "init_point"));
    }

    public PaymentSession criarAssinatura(Plano plan, Usuario donor) {
        requireConfigured();
        if (!httpsUrl(frontendBaseUrl)) {
            throw new PagamentoIndisponivelException("Para doação mensal, configure APP_FRONTEND_BASE_URL com o endereço HTTPS público do site.");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("reason", "Doação mensal — ONG Frutos do Amanhã");
        payload.put("external_reference", plan.getId());
        payload.put("payer_email", donor.getEmail());
        payload.put("back_url", frontendBaseUrl + "/conta-doacoes.html");
        payload.put("status", "pending");
        payload.put("auto_recurring", Map.of("frequency", 1, "frequency_type", "months",
                "transaction_amount", plan.getValorMensal(), "currency_id", "BRL"));
        JsonNode response = post("/preapproval", payload);
        return new PaymentSession(text(response, "id"), text(response, "init_point"));
    }

    public JsonNode obterPagamento(String id) { return get("/v1/payments/" + encodePath(id)); }
    public JsonNode obterAssinatura(String id) { return get("/preapproval/" + encodePath(id)); }
    public JsonNode obterFatura(String id) { return get("/authorized_payments/" + encodePath(id)); }

    public void atualizarAssinatura(String id, String status) {
        requireConfigured();
        try {
            client.put().uri("/preapproval/{id}", id).header("Authorization", "Bearer " + accessToken)
                    .body(Map.of("status", status)).retrieve().toBodilessEntity();
        } catch (RestClientException failure) {
            log.warn("Mercado Pago recusou atualização de assinatura ({}).", failure.getClass().getSimpleName());
            throw new FalhaAoIniciarPagamentoException();
        }
    }

    public boolean validarWebhook(String signature, String requestId, String dataId) {
        if (!webhookConfigured() || signature == null || dataId == null || dataId.isBlank()) return false;
        String timestamp = null;
        String receivedHash = null;
        for (String part : signature.split(",")) {
            String[] pair = part.trim().split("=", 2);
            if (pair.length != 2) continue;
            if (pair[0].trim().equals("ts")) timestamp = pair[1].trim();
            if (pair[0].trim().equals("v1")) receivedHash = pair[1].trim();
        }
        if (timestamp == null || receivedHash == null) return false;
        StringBuilder manifest = new StringBuilder("id:").append(dataId.toLowerCase(Locale.ROOT)).append(';');
        if (requestId != null && !requestId.isBlank()) manifest.append("request-id:").append(requestId).append(';');
        manifest.append("ts:").append(timestamp).append(';');
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(manifest.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder expected = new StringBuilder();
            for (byte value : digest) expected.append(String.format("%02x", value));
            return MessageDigest.isEqual(expected.toString().getBytes(StandardCharsets.US_ASCII),
                    receivedHash.getBytes(StandardCharsets.US_ASCII));
        } catch (Exception impossible) {
            throw new IllegalStateException("Não foi possível validar a assinatura do webhook", impossible);
        }
    }

    private JsonNode post(String path, Object body) {
        try {
            JsonNode response = client.post().uri(path).header("Authorization", "Bearer " + accessToken)
                    .body(body).retrieve().body(JsonNode.class);
            if (response == null || text(response, "init_point") == null || text(response, "id") == null) {
                throw new FalhaAoIniciarPagamentoException();
            }
            return response;
        } catch (RestClientResponseException failure) {
            log.warn("Mercado Pago recusou criação de checkout (HTTP {}).", failure.getStatusCode().value());
            throw new FalhaAoIniciarPagamentoException();
        } catch (RestClientException failure) {
            log.warn("Falha de comunicação com Mercado Pago ({}).", failure.getClass().getSimpleName());
            throw new FalhaAoIniciarPagamentoException();
        }
    }

    private JsonNode get(String path) {
        requireConfigured();
        try {
            JsonNode response = client.get().uri(path).header("Authorization", "Bearer " + accessToken)
                    .retrieve().body(JsonNode.class);
            if (response == null) throw new FalhaAoIniciarPagamentoException();
            return response;
        } catch (RestClientResponseException failure) {
            log.warn("Falha ao consultar Mercado Pago (HTTP {}).", failure.getStatusCode().value());
            throw new FalhaAoIniciarPagamentoException();
        } catch (RestClientException failure) {
            log.warn("Falha de comunicação com Mercado Pago ({}).", failure.getClass().getSimpleName());
            throw new FalhaAoIniciarPagamentoException();
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
    private static String trimSlash(String value) { return value == null ? "" : value.replaceAll("/+$", ""); }
    private static boolean httpsUrl(String value) {
        try { return value != null && URI.create(value).getScheme().equalsIgnoreCase("https"); }
        catch (RuntimeException invalid) { return false; }
    }
    private static String encodePath(String value) { return value.replaceAll("[^A-Za-z0-9_-]", ""); }

    public record PaymentSession(String id, String checkoutUrl) {}
}
