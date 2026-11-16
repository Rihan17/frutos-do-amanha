package br.org.ong.repository;

import br.org.ong.model.Responsavel;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResponsavelRepository extends MongoRepository<Responsavel, String> {
    Optional<Responsavel> findByCpf(String cpf);
}
