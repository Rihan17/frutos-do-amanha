package br.org.ong.service;

import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioServiceTest {
    @Test void naoPermiteRebaixarUltimoAdmin(){
        UsuarioRepository repository=mock(UsuarioRepository.class);Usuario admin=new Usuario();admin.setId("000000000000000000000001");admin.setEmail("operacional@ong.org");admin.setTipo(TipoUsuario.ADMIN);
        when(repository.findById(admin.getId())).thenReturn(Optional.of(admin));when(repository.countByTipo(TipoUsuario.ADMIN)).thenReturn(1L);
        var service=new UsuarioService(repository,mock(org.springframework.security.crypto.password.PasswordEncoder.class),"principal@ong.org");
        assertThrows(RegraNegocioException.class,()->service.rebaixar(admin.getId(),"principal@ong.org"));verify(repository,never()).save(any());
    }
}
