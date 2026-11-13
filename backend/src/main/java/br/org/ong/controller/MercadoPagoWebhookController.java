package br.org.ong.controller;

import br.org.ong.payment.MercadoPagoClient;
import br.org.ong.service.DoacaoService;
import br.org.ong.service.PlanoService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhooks/mercadopago")
public class MercadoPagoWebhookController {
    private final MercadoPagoClient mercadoPago;
    private final DoacaoService doacoes;
    private final PlanoService planos;

    public MercadoPagoWebhookController(MercadoPagoClient mercadoPago, DoacaoService doacoes, PlanoService planos) {
        this.mercadoPago = mercadoPago;
        this.doacoes = doacoes;
        this.planos = planos;
    }

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId,
            @RequestParam(name = "data.id", required = false) String queryDataId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String topic,
            @RequestBody(required = false) JsonNode body) {
        String dataId = queryDataId;
        if ((dataId == null || dataId.isBlank()) && body != null) dataId = body.path("data").path("id").asText(null);
        if (!mercadoPago.validarWebhook(signature, requestId, dataId)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String event = type;
        if (event == null || event.isBlank()) event = body == null ? topic : body.path("type").asText(topic);
        if (event == null) return ResponseEntity.ok().build();
        switch (event.toLowerCase(java.util.Locale.ROOT)) {
            case "payment" -> doacoes.aplicarPagamentoMercadoPago(mercadoPago.obterPagamento(dataId));
            case "subscription_preapproval", "preapproval" -> planos.aplicarStatusAssinatura(mercadoPago.obterAssinatura(dataId));
            case "subscription_authorized_payment" -> doacoes.processarNotificacaoFatura(mercadoPago.obterFatura(dataId));
            default -> { }
        }
        return ResponseEntity.ok().build();
    }
}
