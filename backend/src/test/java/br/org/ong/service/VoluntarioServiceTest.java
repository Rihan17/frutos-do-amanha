package br.org.ong.service;

import br.org.ong.model.Projeto;
import br.org.ong.model.Usuario;
import br.org.ong.model.Voluntario;
import br.org.ong.model.enums.StatusVoluntario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import br.org.ong.repository.VoluntarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VoluntarioServiceTest {
    private static final String USER="000000000000000000000001", PROJECT="000000000000000000000002";
    @Test void novaInscricaoReabreDocumentoRecusado(){
        var repo=mock(VoluntarioRepository.class);var projetos=mock(ProjetoRepository.class);var usuarios=mock(UsuarioRepository.class);var mongo=mock(MongoTemplate.class);
        Usuario user=new Usuario();user.setAtivo(true);user.setTipo(TipoUsuario.COMUM);when(usuarios.findById(USER)).thenReturn(Optional.of(user));
        Projeto project=new Projeto();project.setAtivo(true);when(projetos.findById(PROJECT)).thenReturn(Optional.of(project));
        Voluntario old=new Voluntario();old.setId("000000000000000000000003");old.setUsuarioId(USER);old.setProjetoId(PROJECT);old.setStatus(StatusVoluntario.RECUSADA);old.setJustificativaRecusa("recusada");old.setDataSaida(java.time.Instant.now());
        when(repo.findByUsuarioIdAndProjetoId(USER,PROJECT)).thenReturn(Optional.of(old));when(repo.save(any())).thenAnswer(invocation->invocation.getArgument(0));
        Voluntario reopened=new VoluntarioService(repo,projetos,usuarios,mongo).inscrever(USER,PROJECT,true);
        assertSame(old,reopened);assertEquals(StatusVoluntario.PENDENTE,reopened.getStatus());assertNull(reopened.getJustificativaRecusa());assertNull(reopened.getDataSaida());assertNull(reopened.getAnalise());verify(repo).save(old);
    }
}
