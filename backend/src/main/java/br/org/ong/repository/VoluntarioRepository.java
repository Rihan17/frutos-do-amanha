package br.org.ong.repository;
import br.org.ong.model.Voluntario; import br.org.ong.model.enums.StatusVoluntario; import java.util.List; import java.util.Optional; import org.springframework.data.mongodb.repository.MongoRepository;
public interface VoluntarioRepository extends MongoRepository<Voluntario,String> { Optional<Voluntario> findByUsuarioIdAndProjetoId(String usuarioId,String projetoId); List<Voluntario> findByUsuarioId(String usuarioId); List<Voluntario> findByStatus(StatusVoluntario status); }
