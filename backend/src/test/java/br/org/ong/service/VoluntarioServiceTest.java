package br.org.ong.service;

import br.org.ong.model.Projeto;
import br.org.ong.model.Usuario;
import br.org.ong.model.Voluntario;
import br.org.ong.model.enums.StatusVoluntario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import br.org.ong.repository.VoluntarioRepository;
import com.mongodb.client.result.DeleteResult;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VoluntarioServiceTest {
    private static final String USER="000000000000000000000001", PROJECT="000000000000000000000002";
    private static final String INSCRICAO="000000000000000000000003";
    @Test void novaInscricaoReabreDocumentoRecusado(){
        var repo=mock(VoluntarioRepository.class);var projetos=mock(ProjetoRepository.class);var usuarios=mock(UsuarioRepository.class);var mongo=mock(MongoTemplate.class);
        Usuario user=new Usuario();user.setAtivo(true);user.setTipo(TipoUsuario.COMUM);when(usuarios.findById(USER)).thenReturn(Optional.of(user));
        Projeto project=new Projeto();project.setAtivo(true);when(projetos.findById(PROJECT)).thenReturn(Optional.of(project));
        Voluntario old=new Voluntario();old.setId("000000000000000000000003");old.setUsuarioId(USER);old.setProjetoId(PROJECT);old.setStatus(StatusVoluntario.RECUSADA);old.setJustificativaRecusa("recusada");old.setDataSaida(java.time.Instant.now());
        when(repo.findByUsuarioIdAndProjetoId(USER,PROJECT)).thenReturn(Optional.of(old));when(repo.save(any())).thenAnswer(invocation->invocation.getArgument(0));
        Voluntario reopened=new VoluntarioService(repo,projetos,usuarios,mongo).inscrever(USER,PROJECT,true);
        assertSame(old,reopened);assertEquals(StatusVoluntario.PENDENTE,reopened.getStatus());assertNull(reopened.getJustificativaRecusa());assertNull(reopened.getDataSaida());assertNull(reopened.getAnalise());verify(repo).save(old);
    }

    /* Antes o servico recusava excluir quem tinha sido aprovado, para nao
       perder o registro de quem chegou a ser voluntario. Esse cuidado virou
       escolha de quem usa o painel: ali aparecem encerrar, que guarda a data
       da saida, e excluir, que apaga. Se alguem puser a regra de volta no
       backend, o botao de excluir passa a dar erro em metade da lista. */
    @Test void exclusaoApagaAteCandidaturaAprovada(){
        var repo=mock(VoluntarioRepository.class);var mongo=mock(MongoTemplate.class);
        Voluntario aprovada=new Voluntario();aprovada.setId(INSCRICAO);aprovada.setStatus(StatusVoluntario.APROVADA);
        when(repo.findById(INSCRICAO)).thenReturn(Optional.of(aprovada));
        when(mongo.remove(any(Query.class),eq(Voluntario.class))).thenReturn(DeleteResult.acknowledged(1));

        servico(repo,mongo).excluir(INSCRICAO);

        verify(mongo).remove(any(Query.class),eq(Voluntario.class));
    }

    /* Duas pessoas no painel ao mesmo tempo: a segunda nao pode receber um
       "pronto" por uma exclusao que nao aconteceu. */
    @Test void exclusaoQueNaoApagouNadaAvisaEmVezDeFingirSucesso(){
        var repo=mock(VoluntarioRepository.class);var mongo=mock(MongoTemplate.class);
        Voluntario v=new Voluntario();v.setId(INSCRICAO);v.setStatus(StatusVoluntario.PENDENTE);
        when(repo.findById(INSCRICAO)).thenReturn(Optional.of(v));
        when(mongo.remove(any(Query.class),eq(Voluntario.class))).thenReturn(DeleteResult.acknowledged(0));
        var servico=servico(repo,mongo);

        assertThrows(br.org.ong.exception.RegraNegocioException.class,()->servico.excluir(INSCRICAO));
    }

    private static VoluntarioService servico(VoluntarioRepository repo,MongoTemplate mongo){
        return new VoluntarioService(repo,mock(ProjetoRepository.class),mock(UsuarioRepository.class),mongo);
    }
}
