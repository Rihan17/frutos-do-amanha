package br.org.ong.repository;
import br.org.ong.model.Usuario; import br.org.ong.model.enums.TipoUsuario; import java.util.Optional; import org.springframework.data.mongodb.repository.MongoRepository;
public interface UsuarioRepository extends MongoRepository<Usuario,String> { Optional<Usuario> findByEmailIgnoreCase(String email); long countByTipo(TipoUsuario tipo); }
