package br.org.ong.repository;

import br.org.ong.model.Doacao;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DoacaoRepository extends MongoRepository<Doacao, String> {
    List<Doacao> findByDoadorId(String doadorId);
    Optional<Doacao> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);
    Optional<Doacao> findByPlanoIdAndCompetencia(String planoId, String competencia);
}
