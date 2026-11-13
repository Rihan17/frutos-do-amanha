package br.org.ong.repository;
import br.org.ong.model.Beneficiario; import java.util.Optional; import org.springframework.data.mongodb.repository.MongoRepository;
public interface BeneficiarioRepository extends MongoRepository<Beneficiario,String> { Optional<Beneficiario> findBySolicitacaoOrigemId(String solicitacaoOrigemId); }
