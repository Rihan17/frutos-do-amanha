package br.org.ong.service;

import br.org.ong.dto.request.AtualizarPerfilRequest;
import br.org.ong.dto.request.AdminCriacaoRequest;
import br.org.ong.dto.response.UsuarioAdminResponse;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.UsuarioRepository;
import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final String emailAdministradorPrincipal;

    public UsuarioService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder,
                          @Value("${app.admin-seed.email:}") String emailAdministradorPrincipal) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.emailAdministradorPrincipal = emailAdministradorPrincipal.trim();
    }

    public Usuario obter(String id) {
        ValidarId.objectId(id);
        return usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado"));
    }

    public Usuario atualizarPerfil(String id, AtualizarPerfilRequest request) {
        Usuario usuario = obter(id);
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        usuarios.findByEmailIgnoreCase(email).filter(outro -> !outro.getId().equals(usuario.getId()))
                .ifPresent(outro -> { throw new RegraNegocioException("E-mail já cadastrado"); });
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(request.telefone().trim());
        usuario.setCpfCnpj(request.cpfCnpj() == null || request.cpfCnpj().isBlank() ? null : request.cpfCnpj().trim());
        try {
            return usuarios.save(usuario);
        } catch (DuplicateKeyException e) {
            throw new RegraNegocioException("E-mail ou CPF/CNPJ já cadastrado");
        }
    }

    public List<UsuarioAdminResponse> listarParaAdmin() {
        return usuarios.findAll().stream().map(usuario -> UsuarioAdminResponse.from(usuario, emailAdministradorPrincipal)).toList();
    }

    public UsuarioAdminResponse criarAdministrador(AdminCriacaoRequest request, String emailAutor) {
        if (emailAdministradorPrincipal.isBlank() || emailAutor == null
                || !emailAdministradorPrincipal.equalsIgnoreCase(emailAutor.trim())) {
            throw new AccessDeniedException("Somente o administrador principal pode criar novos administradores");
        }
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail");
        }
        Usuario novo = new Usuario();
        novo.setNome(request.nome().trim());
        novo.setEmail(email);
        novo.setTelefone(request.telefone().trim());
        novo.setCargo(request.cargo().trim());
        novo.setSenhaHash(passwordEncoder.encode(request.senha()));
        novo.setTipo(TipoUsuario.ADMIN);
        try {
            return UsuarioAdminResponse.from(usuarios.save(novo), emailAdministradorPrincipal);
        } catch (DuplicateKeyException e) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail");
        }
    }

    public synchronized UsuarioAdminResponse promover(String id, String cargo, String emailAutor) {
        exigirAdministradorPrincipal(emailAutor);
        Usuario usuario = obter(id);
        if (usuario.getEmail().equalsIgnoreCase(emailAdministradorPrincipal)) {
            throw new RegraNegocioException("O administrador principal já possui acesso administrativo");
        }
        usuario.setTipo(TipoUsuario.ADMIN);
        usuario.setCargo(cargo.trim());
        return UsuarioAdminResponse.from(usuarios.save(usuario), emailAdministradorPrincipal);
    }

    public synchronized void rebaixar(String id, String emailAutor) {
        exigirAdministradorPrincipal(emailAutor);
        Usuario usuario = obter(id);
        if (usuario.getEmail().equalsIgnoreCase(emailAdministradorPrincipal)) {
            throw new RegraNegocioException("O administrador principal não pode ser rebaixado");
        }
        if (usuario.getTipo() != TipoUsuario.ADMIN) {
            throw new RegraNegocioException("Usuário não é administrador");
        }
        if (usuarios.countByTipo(TipoUsuario.ADMIN) <= 1) {
            throw new RegraNegocioException("Não é possível rebaixar o último administrador");
        }
        usuario.setTipo(TipoUsuario.COMUM);
        usuario.setCargo(null);
        usuarios.save(usuario);
    }

    private void exigirAdministradorPrincipal(String emailAutor) {
        if (emailAdministradorPrincipal.isBlank() || emailAutor == null
                || !emailAdministradorPrincipal.equalsIgnoreCase(emailAutor.trim())) {
            throw new AccessDeniedException("Somente o administrador principal pode gerenciar acessos administrativos");
        }
    }
}
