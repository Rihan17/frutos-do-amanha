package br.org.ong.service;

import br.org.ong.dto.request.PlanoRequest;
import br.org.ong.dto.response.PlanoAdminResponse;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Plano;
import br.org.ong.model.Projeto;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.StatusPlano;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.payment.MercadoPagoClient;
import br.org.ong.repository.PlanoRepository;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import java.util.List;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.stereotype.Service;

@Service
public class PlanoService {
    private final PlanoRepository planos;
    private final UsuarioRepository usuarios;
    private final ProjetoRepository projetos;
    private final MongoTemplate mongo;
    private final MercadoPagoClient mercadoPago;

    public PlanoService(PlanoRepository planos,UsuarioRepository usuarios,ProjetoRepository projetos,MongoTemplate mongo, MercadoPagoClient mercadoPago){
        this.planos=planos;this.usuarios=usuarios;this.projetos=projetos;this.mongo=mongo;this.mercadoPago=mercadoPago;
    }

    public Checkout criar(String doadorId,PlanoRequest request){
        mercadoPago.requireConfigured();
        validarDoador(doadorId); validarProjeto(request.projetoId());
        Usuario doador = usuarios.findById(doadorId).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado"));
        Plano plano=new Plano(); plano.setDoadorId(doadorId); plano.setProjetoId(request.projetoId());
        plano.setValorMensal(request.valorMensal()); plano.setDiaCobranca(request.diaCobranca());
        plano.setFormaPagamento(null); plano.setStatus(StatusPlano.PENDENTE);
        plano.setDataInicio(java.time.LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")));
        plano = planos.save(plano);
        try {
            MercadoPagoClient.PaymentSession session = mercadoPago.criarAssinatura(plano, doador);
            plano.setMercadoPagoSubscriptionId(session.id());
            return new Checkout(planos.save(plano), session.checkoutUrl());
        } catch (RuntimeException failure) {
            plano.setStatus(StatusPlano.CANCELADO);
            plano.setDataCancelamento(java.time.LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")));
            planos.save(plano);
            throw failure;
        }
    }
    public record Checkout(Plano plano, String checkoutUrl) {}
    public void aplicarStatusAssinatura(com.fasterxml.jackson.databind.JsonNode subscription) {
        String id = subscription.path("id").asText(null);
        if (id == null) return;
        Plano plano = planos.findByMercadoPagoSubscriptionId(id).orElse(null);
        if (plano == null) return;
        String status = subscription.path("status").asText("pending");
        if ("authorized".equalsIgnoreCase(status)) plano.setStatus(StatusPlano.ATIVO);
        else if ("paused".equalsIgnoreCase(status)) plano.setStatus(StatusPlano.PAUSADO);
        else if ("cancelled".equalsIgnoreCase(status) || "canceled".equalsIgnoreCase(status)) { plano.setStatus(StatusPlano.CANCELADO); plano.setDataCancelamento(java.time.LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo"))); }
        else plano.setStatus(StatusPlano.PENDENTE);
        planos.save(plano);
    }
    public List<Plano> meus(String doadorId){return planos.findByDoadorId(doadorId);}
    public List<Plano> ativosParaCobranca(int dia){return planos.findByStatusAndDiaCobranca(StatusPlano.ATIVO,dia);}

    public Plano pausar(String id,String doadorId){Plano p=meuPlano(id,doadorId);if(p.getStatus()!=StatusPlano.ATIVO)throw new RegraNegocioException("Somente plano ativo pode ser pausado");if(p.getMercadoPagoSubscriptionId()!=null) mercadoPago.atualizarAssinatura(p.getMercadoPagoSubscriptionId(),"paused");p.setStatus(StatusPlano.PAUSADO);return planos.save(p);}
    public Plano retomar(String id,String doadorId){Plano p=meuPlano(id,doadorId);if(p.getStatus()!=StatusPlano.PAUSADO)throw new RegraNegocioException("Somente plano pausado pode ser retomado");if(p.getMercadoPagoSubscriptionId()!=null) mercadoPago.atualizarAssinatura(p.getMercadoPagoSubscriptionId(),"authorized");p.setStatus(StatusPlano.ATIVO);return planos.save(p);}
    public Plano cancelar(String id,String doadorId){Plano p=meuPlano(id,doadorId);if(p.getStatus()==StatusPlano.CANCELADO)throw new RegraNegocioException("Plano já está cancelado");if(p.getMercadoPagoSubscriptionId()!=null) mercadoPago.atualizarAssinatura(p.getMercadoPagoSubscriptionId(),"canceled");p.setStatus(StatusPlano.CANCELADO);p.setDataCancelamento(java.time.LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")));return planos.save(p);}

    public List<PlanoAdminResponse> listarParaAdmin(){
        AggregationOperation lookup=context->new Document("$lookup",new Document("from","usuarios").append("localField","doadorId").append("foreignField","_id").append("as","doador"));
        AggregationOperation unwind=context->new Document("$unwind",new Document("path","$doador").append("preserveNullAndEmptyArrays",true));
        AggregationOperation project=context->new Document("$project",new Document("_id",1).append("doadorId",1).append("doadorNome","$doador.nome")
                .append("projetoId",1).append("valorMensal",1).append("diaCobranca",1).append("status",1)
                .append("formaPagamento",1).append("dataInicio",1).append("dataCancelamento",1));
        AggregationResults<Document> results=mongo.aggregate(Aggregation.newAggregation(lookup,unwind,project),"planos",Document.class);
        return results.getMappedResults().stream().map(doc->new PlanoAdminResponse(doc.getObjectId("_id").toHexString(),id(doc.get("doadorId")),doc.getString("doadorNome"),id(doc.get("projetoId")),decimal(doc.get("valorMensal")),doc.getInteger("diaCobranca",1),name(doc.get("status")),name(doc.get("formaPagamento")),localDate(doc.get("dataInicio")),localDate(doc.get("dataCancelamento")))).toList();
    }

    private Plano meuPlano(String id,String doadorId){ValidarId.objectId(id);Plano p=planos.findById(id).orElseThrow(()->new NaoEncontradoException("Plano não encontrado"));if(!p.getDoadorId().equals(doadorId))throw new RegraNegocioException("Plano não pertence ao usuário autenticado");return p;}
    private void validarDoador(String id){Usuario u=usuarios.findById(id).orElseThrow(()->new NaoEncontradoException("Usuário não encontrado"));if(!u.isAtivo()||u.getTipo()!=TipoUsuario.COMUM)throw new RegraNegocioException("Apenas usuário comum ativo pode criar planos");}
    private void validarProjeto(String id){if(id==null)return;ValidarId.objectId(id);Projeto p=projetos.findById(id).orElseThrow(()->new NaoEncontradoException("Projeto não encontrado"));if(!p.isAtivo())throw new RegraNegocioException("Projeto está inativo");}
    private static String id(Object o){return o==null?null:o.toString();}
    private static java.math.BigDecimal decimal(Object o){return o instanceof Decimal128 d?d.bigDecimalValue():o instanceof java.math.BigDecimal d?d:o==null?null:new java.math.BigDecimal(o.toString());}
    private static String name(Object o){return o==null?null:o.toString();}
    private static java.time.LocalDate localDate(Object o){if(o instanceof java.util.Date d)return d.toInstant().atZone(java.time.ZoneOffset.UTC).toLocalDate();if(o instanceof java.time.LocalDate d)return d;return null;}
}
