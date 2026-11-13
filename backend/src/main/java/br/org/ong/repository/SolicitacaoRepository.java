package br.org.ong.repository;
import br.org.ong.model.Solicitacao; import br.org.ong.model.enums.StatusSolicitacao; import java.util.List; import org.springframework.data.mongodb.repository.MongoRepository;
public interface SolicitacaoRepository extends MongoRepository<Solicitacao,String> { List<Solicitacao> findByStatus(StatusSolicitacao status); }
