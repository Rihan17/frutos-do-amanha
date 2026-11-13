package br.org.ong.config;

import java.time.Duration;
import java.util.Objects;
import org.bson.Document;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;

@Configuration
public class MongoConfig {
    @Bean
    ApplicationRunner createApplicationIndexes(MongoTemplate mongo) {
        return args -> {
            mongo.indexOps("password_reset_tokens").ensureIndex(new Index().on("tokenHash", Sort.Direction.ASC).unique());
            mongo.indexOps("password_reset_tokens").ensureIndex(new Index().on("expiraEm", Sort.Direction.ASC).expire(Duration.ZERO));
            mongo.indexOps("password_reset_tokens").ensureIndex(new Index().on("usuarioId", Sort.Direction.ASC));
            mongo.indexOps("usuarios").ensureIndex(new Index().on("cpfCnpj", Sort.Direction.ASC)
                    .unique().partial(PartialIndexFilter.of(new Document("cpfCnpj", new Document("$type", "string")))));
            mongo.indexOps("beneficiarios").ensureIndex(new Index().on("projetoIds", Sort.Direction.ASC));
            mongo.indexOps("planos").ensureIndex(new Index().on("doadorId", Sort.Direction.ASC));
            mongo.indexOps("doacoes").ensureIndex(new Index().on("doadorId", Sort.Direction.ASC));
            mongo.indexOps("doacoes").ensureIndex(new Index().on("mercadoPagoPaymentId", Sort.Direction.ASC).unique()
                    .partial(PartialIndexFilter.of(new Document("mercadoPagoPaymentId", new Document("$type", "string")))));
            mongo.indexOps("planos").ensureIndex(new Index().on("mercadoPagoSubscriptionId", Sort.Direction.ASC).unique()
                    .partial(PartialIndexFilter.of(new Document("mercadoPagoSubscriptionId", new Document("$type", "string")))));
            mongo.indexOps("planos").ensureIndex(new Index().on("status", Sort.Direction.ASC)
                    .on("diaCobranca", Sort.Direction.ASC));
            mongo.indexOps("doacoes").ensureIndex(new Index().on("projetoId", Sort.Direction.ASC));
            mongo.indexOps("doacoes").ensureIndex(new Index().on("planoId", Sort.Direction.ASC)
                    .on("competencia", Sort.Direction.ASC).unique()
                    .partial(PartialIndexFilter.of(new Document("planoId", new Document("$type", "objectId")))));
            ensureVolunteerIndexes(mongo);
        };
    }

    private static void ensureVolunteerIndexes(MongoTemplate mongo) {
        var operations = mongo.indexOps("voluntarios");
        operations.ensureIndex(new Index().on("status", Sort.Direction.ASC));

        Document expectedFilter = new Document("usuarioId", new Document("$type", "objectId"));
        for (Document index : mongo.getCollection("voluntarios").listIndexes()) {
            Document keys = index.get("key", Document.class);
            if (keys == null) continue;
            boolean unique = Boolean.TRUE.equals(index.getBoolean("unique"));
            boolean oldUserOnlyUnique = unique && keys.size() == 1 && keys.containsKey("usuarioId");
            boolean userAndProject = keys.size() == 2 && keys.containsKey("usuarioId") && keys.containsKey("projetoId");
            Document partialFilter = index.get("partialFilterExpression", Document.class);
            boolean expectedCompoundIndex = userAndProject && unique && Objects.equals(partialFilter, expectedFilter);
            if (oldUserOnlyUnique || (userAndProject && !expectedCompoundIndex)) {
                operations.dropIndex(index.getString("name"));
            }
        }

        operations.ensureIndex(new Index().on("usuarioId", Sort.Direction.ASC)
                .on("projetoId", Sort.Direction.ASC).unique()
                .partial(PartialIndexFilter.of(expectedFilter)));
    }
}
