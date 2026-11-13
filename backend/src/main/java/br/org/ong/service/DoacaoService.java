package br.org.ong.service;

import br.org.ong.dto.request.DoacaoRequest;
import br.org.ong.dto.request.DoacaoPublicaRequest;
import br.org.ong.dto.request.AdminDoacaoRequest;
import br.org.ong.dto.response.DoacaoAdminResponse;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Doacao;
import br.org.ong.model.Plano;
import br.org.ong.model.Projeto;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.FormaPagamento;
import br.org.ong.model.enums.StatusDoacao;
import br.org.ong.model.enums.TipoDoacao;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.payment.MercadoPagoClient;
import br.org.ong.repository.DoacaoRepository;
import br.org.ong.repository.PlanoRepository;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.util.List;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.stereotype.Service;

@Service
public class DoacaoService {
    private final DoacaoRepository doacoes;
    private final UsuarioRepository usuarios;
    private final ProjetoRepository projetos;
    private final PlanoRepository planos;
    private final MercadoPagoClient mercadoPago;
    private final MongoTemplate mongo;

    public DoacaoService(DoacaoRepository doacoes, UsuarioRepository usuarios, ProjetoRepository projetos,
                         PlanoRepository planos, MercadoPagoClient mercadoPago, MongoTemplate mongo) {
        this.doacoes = doacoes; this.usuarios = usuarios; this.projetos = projetos;
        this.planos = planos; this.mercadoPago = mercadoPago; this.mongo = mongo;
    }

    public Checkout criarUnica(String doadorId, DoacaoRequest request) {
        mercadoPago.requireConfigured();
        Usuario doador = validarDoador(doadorId);
        validarProjetoAtivo(request.projetoId());
        Doacao doacao = new Doacao();
        doacao.setDoadorId(doadorId); doacao.setProjetoId(request.projetoId());
        doacao.setValor(request.valor()); doacao.setData(Instant.now());
        doacao.setTipo(TipoDoacao.UNICA); doacao.setOrigem("PLATAFORMA");
        doacao.setStatus(StatusDoacao.PENDENTE);
        doacao = doacoes.save(doacao);
        try {
            MercadoPagoClient.PaymentSession checkout = mercadoPago.criarPreferencia(doacao, doador);
            doacao.setMercadoPagoPreferenceId(checkout.id());
            return new Checkout(doacoes.save(doacao), checkout.checkoutUrl());
        } catch (RuntimeException failure) {
            doacao.setStatus(StatusDoacao.FALHOU);
            doacao.setMercadoPagoPaymentStatus("checkout_creation_failed");
            doacoes.save(doacao);
            throw failure;
        }
    }

    public Checkout criarPublica(DoacaoPublicaRequest request) {
        mercadoPago.requireConfigured();
        validarProjetoAtivo(request.projetoId());
        Doacao doacao = new Doacao();
        doacao.setDoadorNomeManual(request.nome().trim());
        doacao.setDoadorEmailManual(request.email().trim().toLowerCase(java.util.Locale.ROOT));
        doacao.setValor(request.valor());
        doacao.setProjetoId(request.projetoId());
        doacao.setData(Instant.now());
        doacao.setTipo(TipoDoacao.UNICA);
        doacao.setOrigem("PLATAFORMA_PUBLICA");
        doacao.setStatus(StatusDoacao.PENDENTE);
        doacao = doacoes.save(doacao);
        Usuario pagador = new Usuario();
        pagador.setNome(request.nome().trim());
        pagador.setEmail(request.email().trim());
        try {
            MercadoPagoClient.PaymentSession checkout = mercadoPago.criarPreferencia(doacao, pagador);
            doacao.setMercadoPagoPreferenceId(checkout.id());
            return new Checkout(doacoes.save(doacao), checkout.checkoutUrl());
        } catch (RuntimeException failure) {
            doacao.setStatus(StatusDoacao.FALHOU);
            doacao.setMercadoPagoPaymentStatus("checkout_creation_failed");
            doacoes.save(doacao);
            throw failure;
        }
    }

    public List<Doacao> listarMinhas(String doadorId) { return doacoes.findByDoadorId(doadorId); }

    public DoacaoAdminResponse registrarManual(AdminDoacaoRequest request) {
        Doacao doacao = new Doacao();
        doacao.setDoadorNomeManual(request.doadorNome().trim());
        doacao.setValor(request.valor());
        doacao.setData(request.data().atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant());
        doacao.setTipo(TipoDoacao.UNICA);
        doacao.setFormaPagamento(FormaPagamento.PIX);
        doacao.setStatus(StatusDoacao.CONFIRMADA);
        doacao.setOrigem("PIX_MANUAL");
        if (request.projetoId() != null && !request.projetoId().isBlank()) {
            ValidarId.objectId(request.projetoId());
            projetos.findById(request.projetoId()).orElseThrow(() -> new NaoEncontradoException("Projeto não encontrado"));
            doacao.setProjetoId(request.projetoId());
        }
        if (request.observacao() != null && !request.observacao().isBlank()) doacao.setObservacao(request.observacao().trim());
        doacao = doacoes.save(doacao);
        return new DoacaoAdminResponse(doacao.getId(), null, doacao.getDoadorNomeManual(), doacao.getProjetoId(), null,
                null, doacao.getValor(), doacao.getData(), doacao.getTipo().name(), doacao.getFormaPagamento().name(),
                doacao.getStatus().name(), doacao.getOrigem(), doacao.getObservacao(), null);
    }

    public List<DoacaoAdminResponse> listarParaAdmin() {
        AggregationOperation lookup = context -> new Document("$lookup", new Document("from", "usuarios")
                .append("localField", "doadorId").append("foreignField", "_id").append("as", "doador"));
        AggregationOperation unwind = context -> new Document("$unwind", new Document("path", "$doador").append("preserveNullAndEmptyArrays", true));
        AggregationOperation project = context -> new Document("$project", new Document("_id", 1)
                .append("doadorId", 1)
                .append("doadorNome", new Document("$ifNull", List.of("$doador.nome", "$doadorNomeManual")))
                .append("doadorEmail", new Document("$ifNull", List.of("$doador.email", "$doadorEmailManual")))
                .append("projetoId", 1).append("planoId", 1).append("competencia", 1)
                .append("valor", 1).append("data", 1).append("tipo", 1).append("formaPagamento", 1)
                .append("status", 1).append("origem", 1).append("observacao", 1));
        AggregationResults<Document> results = mongo.aggregate(Aggregation.newAggregation(lookup, unwind, project), "doacoes", Document.class);
        return results.getMappedResults().stream().map(doc -> new DoacaoAdminResponse(
                id(doc.get("_id")), id(doc.get("doadorId")), doc.getString("doadorNome"), id(doc.get("projetoId")),
                id(doc.get("planoId")), doc.getString("competencia"), decimal(doc.get("valor")), instant(doc.get("data")),
                enumName(doc.get("tipo")), enumName(doc.get("formaPagamento")), enumName(doc.get("status")),
                doc.getString("origem"), doc.getString("observacao"), doc.getString("doadorEmail"))).toList();
    }

    public void aplicarPagamentoMercadoPago(JsonNode payment) {
        String paymentId = text(payment, "id");
        String externalReference = text(payment, "external_reference");
        if (paymentId == null) return;
        Doacao doacao = doacoes.findByMercadoPagoPaymentId(paymentId).orElse(null);
        if (doacao == null && externalReference != null) doacao = doacoes.findById(externalReference).orElse(null);
        if (doacao != null && doacao.getTipo() == TipoDoacao.UNICA) {
            atualizarDadosPagamento(doacao, payment, paymentId);
            doacoes.save(doacao);
            return;
        }
        String subscriptionId = text(payment, "preapproval_id");
        Plano plan = subscriptionId == null ? null : planos.findByMercadoPagoSubscriptionId(subscriptionId).orElse(null);
        if (plan == null && externalReference != null) plan = planos.findById(externalReference).orElse(null);
        if (plan == null) return;
        Instant created = date(payment, "date_created");
        String competencia = java.time.YearMonth.from((created == null ? Instant.now() : created)
                .atZone(java.time.ZoneId.of("America/Sao_Paulo"))).toString();
        if (doacao == null) doacao = doacoes.findByPlanoIdAndCompetencia(plan.getId(), competencia).orElseGet(Doacao::new);
        doacao.setDoadorId(plan.getDoadorId());
        doacao.setProjetoId(plan.getProjetoId());
        doacao.setPlanoId(plan.getId());
        doacao.setTipo(TipoDoacao.MENSAL);
        doacao.setOrigem("MERCADO_PAGO");
        doacao.setValor(number(payment, "transaction_amount", plan.getValorMensal()));
        doacao.setData(created == null ? Instant.now() : created);
        doacao.setCompetencia(competencia);
        atualizarDadosPagamento(doacao, payment, paymentId);
        FormaPagamento forma = formaPagamento(text(payment, "payment_type_id"));
        if (forma != null) { plan.setFormaPagamento(forma); planos.save(plan); }
        doacoes.save(doacao);
    }

    public void processarNotificacaoFatura(JsonNode invoice) {
        JsonNode payment = invoice == null ? null : invoice.path("payment");
        String paymentId = payment == null || payment.isMissingNode() || payment.isNull() ? null
                : payment.isObject() ? text(payment, "id") : payment.asText(null);
        if (paymentId != null && !paymentId.isBlank()) aplicarPagamentoMercadoPago(mercadoPago.obterPagamento(paymentId));
    }

    public record Checkout(Doacao doacao, String checkoutUrl) {}

    private void atualizarDadosPagamento(Doacao doacao, JsonNode payment, String paymentId) {
        doacao.setMercadoPagoPaymentId(paymentId);
        String remoteStatus = text(payment, "status");
        doacao.setMercadoPagoPaymentStatus(remoteStatus);
        doacao.setStatus(status(remoteStatus));
        doacao.setFormaPagamento(formaPagamento(text(payment, "payment_type_id")));
        Instant approved = date(payment, "date_approved");
        if (approved != null) doacao.setData(approved);
    }

    private Usuario validarDoador(String id) {
        ValidarId.objectId(id);
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado"));
        if (!usuario.isAtivo() || usuario.getTipo() != TipoUsuario.COMUM) throw new RegraNegocioException("Apenas usuário comum ativo pode doar");
        return usuario;
    }

    private void validarProjetoAtivo(String id) {
        if (id == null || id.isBlank()) return;
        ValidarId.objectId(id);
        Projeto projeto = projetos.findById(id).orElseThrow(() -> new NaoEncontradoException("Projeto não encontrado"));
        if (!projeto.isAtivo()) throw new RegraNegocioException("Projeto está inativo");
    }

    private static StatusDoacao status(String status) {
        if ("approved".equalsIgnoreCase(status)) return StatusDoacao.CONFIRMADA;
        if ("refunded".equalsIgnoreCase(status) || "charged_back".equalsIgnoreCase(status)) return StatusDoacao.ESTORNADA;
        if ("rejected".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) return StatusDoacao.FALHOU;
        return StatusDoacao.PENDENTE;
    }

    private static FormaPagamento formaPagamento(String kind) {
        if (kind == null) return null;
        return switch (kind.toLowerCase()) {
            case "bank_transfer" -> FormaPagamento.PIX;
            case "ticket" -> FormaPagamento.BOLETO;
            case "credit_card", "debit_card" -> FormaPagamento.CARTAO;
            default -> FormaPagamento.OUTRO;
        };
    }
    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
    private static BigDecimal number(JsonNode node, String field, BigDecimal fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? fallback : value.decimalValue();
    }
    private static Instant date(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) return null;
        try { return OffsetDateTime.parse(value).toInstant(); }
        catch (RuntimeException ignored) { try { return Instant.parse(value); } catch (RuntimeException invalid) { return null; } }
    }
    private static String id(Object value) { return value == null ? null : value.toString(); }
    private static BigDecimal decimal(Object value) {
        if (value instanceof Decimal128 d) return d.bigDecimalValue();
        if (value instanceof BigDecimal d) return d;
        return value == null ? null : new BigDecimal(value.toString());
    }
    private static Instant instant(Object value) {
        if (value instanceof java.util.Date d) return d.toInstant();
        if (value instanceof Instant i) return i;
        return null;
    }
    private static String enumName(Object value) { return value == null ? null : value.toString(); }
}
