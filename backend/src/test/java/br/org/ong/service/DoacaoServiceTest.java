package br.org.ong.service;

import br.org.ong.dto.request.DoacaoRequest;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Doacao;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.StatusDoacao;
import br.org.ong.model.enums.TipoDoacao;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.payment.MercadoPagoClient;
import br.org.ong.repository.DoacaoRepository;
import br.org.ong.repository.PlanoRepository;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DoacaoServiceTest {
    private static final String USER_ID="000000000000000000000001";
    @Test void criaDoacaoUnicaComDoadorDoToken(){
        var doacoes=mock(DoacaoRepository.class);var usuarios=mock(UsuarioRepository.class);var projetos=mock(ProjetoRepository.class);
        var planos=mock(PlanoRepository.class);var mercadoPago=mock(MercadoPagoClient.class);var mongo=mock(MongoTemplate.class);
        Usuario user=new Usuario();user.setId(USER_ID);user.setAtivo(true);user.setTipo(TipoUsuario.COMUM);when(usuarios.findById(USER_ID)).thenReturn(Optional.of(user));
        when(mercadoPago.criarPreferencia(any(),eq(user))).thenReturn(new MercadoPagoClient.PaymentSession("pref-1","https://checkout.example/pref-1"));
        when(doacoes.save(any())).thenAnswer(invocation->invocation.getArgument(0));
        var request=new DoacaoRequest(null,new BigDecimal("25.50"));
        Doacao saved=new DoacaoService(doacoes,usuarios,projetos,planos,mercadoPago,mongo).criarUnica(USER_ID,request).doacao();
        assertEquals(USER_ID,saved.getDoadorId());assertEquals(TipoDoacao.UNICA,saved.getTipo());assertEquals(StatusDoacao.PENDENTE,saved.getStatus());assertEquals(new BigDecimal("25.50"),saved.getValor());
    }
    @Test void adminNaoPodeFazerDoacao(){
        var usuarios=mock(UsuarioRepository.class);Usuario admin=new Usuario();admin.setAtivo(true);admin.setTipo(TipoUsuario.ADMIN);when(usuarios.findById(USER_ID)).thenReturn(Optional.of(admin));
        var service=new DoacaoService(mock(DoacaoRepository.class),usuarios,mock(ProjetoRepository.class),mock(PlanoRepository.class),mock(MercadoPagoClient.class),mock(MongoTemplate.class));
        assertThrows(RegraNegocioException.class,()->service.criarUnica(USER_ID,new DoacaoRequest(null,BigDecimal.ONE)));
    }
}
