package br.org.ong.service;

import br.org.ong.dto.request.CadastroRequest;
import br.org.ong.dto.request.LoginRequest;
import br.org.ong.exception.CredenciaisInvalidasException;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.UsuarioRepository;
import br.org.ong.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    @Test void cadastroSempreCriaComumMesmoSeJsonTentarTipoAdmin() {
        UsuarioRepository repository=mock(UsuarioRepository.class);PasswordEncoder encoder=mock(PasswordEncoder.class);JwtService jwt=mock(JwtService.class);
        when(repository.findByEmailIgnoreCase("ana@example.org")).thenReturn(Optional.empty());
        when(encoder.encode("senha-segura")).thenReturn("bcrypt-hash");
        when(repository.save(any())).thenAnswer(call->{Usuario user=call.getArgument(0);user.setId("000000000000000000000001");return user;});
        when(jwt.gerarToken(any())).thenReturn("jwt-token");
        AuthService service=new AuthService(repository,encoder,jwt);

        var response=service.cadastrar(new CadastroRequest("Ana","ANA@example.org","11999999999",null,"senha-segura"));

        assertEquals("jwt-token",response.token());assertEquals("COMUM",response.usuario().tipo());
        verify(repository).save(argThat(user->user.getTipo()==TipoUsuario.COMUM&&user.getSenhaHash().equals("bcrypt-hash")&&user.getEmail().equals("ana@example.org")));
    }

    @Test void loginComSenhaCorretaGeraToken() {
        UsuarioRepository repository=mock(UsuarioRepository.class);PasswordEncoder encoder=mock(PasswordEncoder.class);JwtService jwt=mock(JwtService.class);
        Usuario user=new Usuario();user.setId("000000000000000000000001");user.setEmail("ana@example.org");user.setSenhaHash("hash");user.setTipo(TipoUsuario.COMUM);user.setAtivo(true);
        when(repository.findByEmailIgnoreCase("ana@example.org")).thenReturn(Optional.of(user));when(encoder.matches("senha", "hash")).thenReturn(true);when(jwt.gerarToken(user)).thenReturn("token");
        assertEquals("token",new AuthService(repository,encoder,jwt).login(new LoginRequest("Ana@example.org","senha")).token());
    }

    @Test void loginComSenhaInvalidaFalhaSemRevelarConta() {
        UsuarioRepository repository=mock(UsuarioRepository.class);PasswordEncoder encoder=mock(PasswordEncoder.class);JwtService jwt=mock(JwtService.class);
        Usuario user=new Usuario();user.setSenhaHash("hash");user.setAtivo(true);
        when(repository.findByEmailIgnoreCase("ana@example.org")).thenReturn(Optional.of(user));when(encoder.matches("wrong", "hash")).thenReturn(false);
        assertThrows(CredenciaisInvalidasException.class,()->new AuthService(repository,encoder,jwt).login(new LoginRequest("ana@example.org","wrong")));
    }
}
