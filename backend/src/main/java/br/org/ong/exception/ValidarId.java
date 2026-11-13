package br.org.ong.exception;

import org.bson.types.ObjectId;
import java.util.Map;

public final class ValidarId {
    private ValidarId() {}

    public static void objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new RequisicaoInvalidaException("Id inválido", Map.of("id", "Id inválido"));
        }
    }
}
