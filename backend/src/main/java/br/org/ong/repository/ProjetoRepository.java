package br.org.ong.repository;

import br.org.ong.model.Projeto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProjetoRepository extends MongoRepository<Projeto, String> {
    List<Projeto> findByAtivoTrue();
    Optional<Projeto> findBySlug(String slug);
}
