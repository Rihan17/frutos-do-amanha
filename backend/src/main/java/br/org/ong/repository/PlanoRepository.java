package br.org.ong.repository;

import br.org.ong.model.Plano;
import br.org.ong.model.enums.StatusPlano;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PlanoRepository extends MongoRepository<Plano, String> {
    List<Plano> findByDoadorId(String doadorId);
    List<Plano> findByStatusAndDiaCobranca(StatusPlano status, int diaCobranca);
    Optional<Plano> findByMercadoPagoSubscriptionId(String mercadoPagoSubscriptionId);
}
