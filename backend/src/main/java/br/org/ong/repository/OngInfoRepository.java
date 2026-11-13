package br.org.ong.repository;

import br.org.ong.model.OngInfo;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OngInfoRepository extends MongoRepository<OngInfo, String> {}
