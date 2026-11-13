package br.org.ong.service;

import br.org.ong.dto.request.CadastroRequest;
import br.org.ong.dto.request.LoginRequest;
import br.org.ong.dto.request.AlterarSenhaRequest;
import br.org.ong.dto.response.AuthResponse;
import br.org.ong.dto.response.UsuarioResponse;
import br.org.ong.exception.CredenciaisInvalidasException;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.UsuarioRepository;
import br.org.ong.security.JwtService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse cadastrar(CadastroRequest request) {
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
            throw new RegraNegocioException("E-mail já cadastrado");
        }
        Usuario usuario = new Usuario();
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(request.telefone().trim());
        usuario.setCpfCnpj(normalizarOpcional(request.cpfCnpj()));
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        // Cadastro público ignora qualquer tipo que venha em JSON e sempre cria usuário comum.
        usuario.setTipo(TipoUsuario.COMUM);
        try {
            usuario = usuarios.save(usuario);
        } catch (DuplicateKeyException e) {
            throw new RegraNegocioException("E-mail ou CPF/CNPJ já cadastrado");
        }
        return autenticar(usuario);
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(request.email().trim().toLowerCase(java.util.Locale.ROOT))
                .filter(Usuario::isAtivo)
                .filter(conta -> passwordEncoder.matches(request.senha(), conta.getSenhaHash()))
                .filter(conta -> conta.getTipo() == TipoUsuario.ADMIN)
                .orElseThrow(CredenciaisInvalidasException::new);
        return autenticar(usuario);
    }

    public String alterarSenha(String usuarioId, AlterarSenhaRequest request) {
        Usuario usuario = usuarios.findById(usuarioId)
                .filter(Usuario::isAtivo)
                .orElseThrow(CredenciaisInvalidasException::new);
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new RequisicaoInvalidaException("A senha atual está incorreta");
        }
        if (passwordEncoder.matches(request.novaSenha(), usuario.getSenhaHash())) {
            throw new RequisicaoInvalidaException("A nova senha deve ser diferente da atual");
        }
        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuarios.save(usuario);
        return "Senha alterada. Entre novamente com a nova senha.";
    }

    private AuthResponse autenticar(Usuario usuario) {
        return new AuthResponse(jwtService.gerarToken(usuario), "Bearer", jwtService.expiraEmSegundos(), UsuarioResponse.from(usuario));
    }

    private String normalizarOpcional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
