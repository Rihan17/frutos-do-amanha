package br.org.ong.repository;

import br.org.ong.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    void deleteByUsuarioId(String usuarioId);
}
