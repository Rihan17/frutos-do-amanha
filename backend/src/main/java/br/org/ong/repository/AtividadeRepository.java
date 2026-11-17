package br.org.ong.repository;

import br.org.ong.model.Atividade;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AtividadeRepository extends MongoRepository<Atividade, String> {}
