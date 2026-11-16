package br.org.ong.repository;

import br.org.ong.model.Noticia;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoticiaRepository extends MongoRepository<Noticia, String> {
    List<Noticia> findByPublicadaTrue();
    Optional<Noticia> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
