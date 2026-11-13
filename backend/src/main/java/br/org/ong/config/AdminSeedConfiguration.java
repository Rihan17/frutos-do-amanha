package br.org.ong.config;

import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeedConfiguration {
    private static final Logger log = LoggerFactory.getLogger(AdminSeedConfiguration.class);

    @Bean
    ApplicationRunner seedFirstAdmin(UsuarioRepository usuarios, PasswordEncoder encoder,
                                    @Value("${app.admin-seed.email:}") String email,
                                    @Value("${app.admin-seed.password:}") String password,
                                    @Value("${app.admin-seed.nome:Administrador Inicial}") String nome,
                                    @Value("${app.admin-seed.telefone:}") String telefone) {
        return args -> {
            if (usuarios.countByTipo(TipoUsuario.ADMIN) > 0) return;
            if (email.isBlank() || password.isBlank()) {
                throw new IllegalStateException("Nenhum ADMIN existe. Configure ONG_ADMIN_EMAIL e ONG_ADMIN_PASSWORD para criar o primeiro administrador");
            }
            if (password.length() < 8) throw new IllegalStateException("ONG_ADMIN_PASSWORD deve ter no mínimo 8 caracteres");
            String emailNormalizado = email.trim().toLowerCase(java.util.Locale.ROOT);
            if (usuarios.findByEmailIgnoreCase(emailNormalizado).isPresent()) {
                throw new IllegalStateException("ONG_ADMIN_EMAIL já pertence a uma conta comum; escolha um e-mail novo para o seed");
            }
            Usuario admin = new Usuario();
            admin.setNome(nome.trim()); admin.setEmail(emailNormalizado); admin.setTelefone(telefone);
            admin.setSenhaHash(encoder.encode(password)); admin.setTipo(TipoUsuario.ADMIN); admin.setCargo("Administrador");
            usuarios.save(admin);
            log.info("Primeiro administrador criado via seed: {}", emailNormalizado);
        };
    }
}
