package br.org.ong.repository;

import br.org.ong.model.Beneficiario;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BeneficiarioRepository extends MongoRepository<Beneficiario, String> {
    Optional<Beneficiario> findBySolicitacaoOrigemId(String solicitacaoOrigemId);

    /* Quem está numa turma, e quantos ocupam vaga nela.

       A contagem olha só quem está ativo: uma criança que saiu da ONG não
       pode continuar segurando vaga numa turma que a equipe precisa
       preencher. A lista, essa, traz todo mundo, porque a tela da atividade
       mostra quem saiu junto com quem ficou. */
    List<Beneficiario> findByAtividadeIdsContaining(ObjectId atividadeId);

    long countByAtividadeIdsContainingAndAtivoIsTrue(ObjectId atividadeId);
}
