package br.org.ong.service;

import br.org.ong.dto.request.SolicitacaoRequest;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Beneficiario;
import br.org.ong.model.Solicitacao;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.StatusSolicitacao;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.model.embedded.*;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.SolicitacaoRepository;
import br.org.ong.repository.UsuarioRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SolicitacaoServiceTest {
    private static final String ID="000000000000000000000001", ADMIN_ID="000000000000000000000002";
    private SolicitacaoRepository solicitacoes;private BeneficiarioRepository beneficiarios;private UsuarioRepository usuarios;private MongoTemplate mongo;private SolicitacaoService service;
    @BeforeEach void setup(){solicitacoes=mock(SolicitacaoRepository.class);beneficiarios=mock(BeneficiarioRepository.class);usuarios=mock(UsuarioRepository.class);mongo=mock(MongoTemplate.class);service=new SolicitacaoService(solicitacoes,beneficiarios,usuarios,mongo);}
    private Usuario admin(){Usuario u=new Usuario();u.setId(ADMIN_ID);u.setTipo(TipoUsuario.ADMIN);u.setAtivo(true);return u;}
    private Solicitacao pendente(){Solicitacao s=new Solicitacao();s.setId(ID);s.setStatus(StatusSolicitacao.PENDENTE);s.setBeneficiario(new DadosBeneficiarioSolicitacao("Criança",LocalDate.of(2014,2,3),"F"));s.setResponsavel(new DadosResponsavel("Responsável","r@example.org","1199","Mãe"));return s;}
    private Solicitacao aprovada(){Solicitacao s=pendente();s.setStatus(StatusSolicitacao.APROVADA);return s;}
    private Beneficiario beneficiario(){Beneficiario b=new Beneficiario();b.setId("000000000000000000000003");b.setSolicitacaoOrigemId(ID);return b;}
    @Test void aprovarCriaBeneficiarioEAtualizaSolicitacaoCondicionalmente(){
        when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));when(solicitacoes.findById(ID)).thenReturn(Optional.of(pendente()));when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.empty());when(beneficiarios.save(any())).thenAnswer(c->c.getArgument(0));
        Solicitacao result=aprovada();when(mongo.findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Solicitacao.class))).thenReturn(result);
        assertEquals(StatusSolicitacao.APROVADA,service.aprovar(ID,ADMIN_ID).getStatus());
        verify(beneficiarios).save(argThat(b->b.isAtivo()&&b.getDataEntrada()!=null&&b.getProjetoIds().isEmpty()&&ID.equals(b.getSolicitacaoOrigemId())));
        verify(mongo).findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Solicitacao.class));
    }
    @Test void repetirAprovacaoRetornaRegistroExistenteSemDuplicarBeneficiario(){
        when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));when(solicitacoes.findById(ID)).thenReturn(Optional.of(aprovada()));when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.of(beneficiario()));
        assertEquals(StatusSolicitacao.APROVADA,service.aprovar(ID,ADMIN_ID).getStatus());verify(beneficiarios,never()).save(any());verifyNoInteractions(mongo);
    }
    @Test void concorrenciaComAprovacaoVencedoraRetornaRegistroAtualizado(){
        when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));when(solicitacoes.findById(ID)).thenReturn(Optional.of(pendente()),Optional.of(aprovada()));when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.of(beneficiario()));when(mongo.findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Solicitacao.class))).thenReturn(null);
        assertEquals(StatusSolicitacao.APROVADA,service.aprovar(ID,ADMIN_ID).getStatus());
    }
    @Test void indiceUnicoPermiteProsseguirSeBeneficiarioJaFoiCriadoEmConcorrencia(){
        when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));when(solicitacoes.findById(ID)).thenReturn(Optional.of(pendente()));when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.empty(),Optional.of(beneficiario()));when(beneficiarios.save(any())).thenThrow(new DuplicateKeyException("duplicado"));when(mongo.findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Solicitacao.class))).thenReturn(aprovada());
        assertEquals(StatusSolicitacao.APROVADA,service.aprovar(ID,ADMIN_ID).getStatus());
    }
    @Test void recusarSemJustificativaEErro400(){when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));assertThrows(RequisicaoInvalidaException.class,()->service.recusar(ID,ADMIN_ID," "));}
    @Test void recusarFazUpdateCondicional(){when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));Solicitacao recusada=pendente();recusada.setStatus(StatusSolicitacao.RECUSADA);when(mongo.findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Solicitacao.class))).thenReturn(recusada);assertEquals(StatusSolicitacao.RECUSADA,service.recusar(ID,ADMIN_ID,"Não atende aos critérios").getStatus());}
    @Test void naoAprovaSolicitacaoQueNaoEstaPendente(){when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));Solicitacao antiga=aprovada();when(solicitacoes.findById(ID)).thenReturn(Optional.of(antiga));when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.empty());assertThrows(RegraNegocioException.class,()->service.aprovar(ID,ADMIN_ID));}
    @Test void consentimentoEObrigatorio(){var q=new SolicitacaoRequest("motivo",new SolicitacaoRequest.SolicitanteRequest("nome","tel"),new SolicitacaoRequest.BeneficiarioPedidoRequest("nome",LocalDate.of(2010,1,1),"F"),new SolicitacaoRequest.ResponsavelRequest("nome","a@b.com","tel","mãe",null,null,null,null,null,null,null),new SolicitacaoRequest.ConsentimentoRequest(false));assertThrows(RequisicaoInvalidaException.class,()->service.criar(q));verifyNoInteractions(solicitacoes);}

    /* O endereco era perguntado no formulario publico e descartado no envio:
       o ResponsavelRequest nao tinha onde guardar. Estes dois testes prendem
       o caminho inteiro, do pedido ate o beneficiario. */
    @Test void enderecoDoResponsavelEGuardado() {
        when(solicitacoes.save(any())).thenAnswer(c -> c.getArgument(0));
        var pedido = new SolicitacaoRequest("Preciso de apoio escolar.",
                new SolicitacaoRequest.SolicitanteRequest("Fernanda Oliveira", "13999990000"),
                new SolicitacaoRequest.BeneficiarioPedidoRequest("Lucas", LocalDate.of(2016, 5, 2), "M"),
                new SolicitacaoRequest.ResponsavelRequest("Fernanda Oliveira", "f@example.org",
                        "13999990000", "Mãe", "11345-230", "Rua Geralda Martins de Oliveira",
                        "355", "   ", "Vila Matias", "São Vicente", "sp"),
                new SolicitacaoRequest.ConsentimentoRequest(true));
        DadosResponsavel guardado = service.criar(pedido).getResponsavel();
        assertEquals("11345-230", guardado.cep());
        assertEquals("355", guardado.numero());
        assertNull(guardado.complemento(), "campo só com espaços vira null, não string vazia");
        assertEquals("SP", guardado.uf(), "a UF fica em maiúsculas");
        assertEquals("Rua Geralda Martins de Oliveira, 355 — Vila Matias, São Vicente/SP",
                guardado.enderecoCompleto());
    }

    @Test void oEnderecoAcompanhaOBeneficiarioQuandoAprova() {
        Solicitacao s = pendente();
        s.setResponsavel(new DadosResponsavel("Fernanda Oliveira", "f@example.org", "13999990000",
                "Mãe", "11345-230", "Rua Geralda Martins de Oliveira", "355", null,
                "Vila Matias", "São Vicente", "SP"));
        when(usuarios.findById(ADMIN_ID)).thenReturn(Optional.of(admin()));
        when(solicitacoes.findById(ID)).thenReturn(Optional.of(s));
        when(beneficiarios.findBySolicitacaoOrigemId(ID)).thenReturn(Optional.empty());
        when(beneficiarios.save(any())).thenAnswer(c -> c.getArgument(0));
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                eq(Solicitacao.class))).thenReturn(aprovada());
        service.aprovar(ID, ADMIN_ID);
        verify(beneficiarios).save(argThat(b -> "Vila Matias".equals(b.getResponsavel().bairro())
                && "11345-230".equals(b.getResponsavel().cep())));
    }
}
