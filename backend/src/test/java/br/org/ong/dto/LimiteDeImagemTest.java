package br.org.ong.dto;

import br.org.ong.dto.request.NoticiaRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/* O limite da foto existe em dois lugares que precisam concordar:
   LIMITE_IMAGEM_MB no painel.js confere o tamanho do ARQUIVO escolhido, e o
   @Size de imagemUrl confere o TEXTO em base64, que e um terco maior. Se o
   segundo ficar para tras, a pessoa escolhe uma foto que o navegador aceita e
   a API recusa com erro de validacao.

   Estes testes prendem os dois numeros um ao outro. */
class LimiteDeImagemTest {
    /** O mesmo valor de LIMITE_IMAGEM_MB no frontend/assets/js/painel.js. */
    private static final int LIMITE_MB = 10;

    private static final Validator VALIDADOR;
    static {
        try (ValidatorFactory fabrica = Validation.buildDefaultValidatorFactory()) {
            VALIDADOR = fabrica.getValidator();
        }
    }

    /** Quantos caracteres uma data URL ocupa para um arquivo de n bytes. */
    private static int caracteresBase64(long bytes) {
        return "data:image/jpeg;base64,".length() + (int) (4 * Math.ceil(bytes / 3.0));
    }

    private static NoticiaRequest comImagemDe(int caracteres) {
        return new NoticiaRequest("Titulo", null, "Evento", "resumo", "texto",
                "x".repeat(caracteres), "descricao", LocalDate.now(), true);
    }

    @Test void aFotoNoTamanhoMaximoPassa() {
        int cabe = caracteresBase64(LIMITE_MB * 1024L * 1024L);
        assertTrue(VALIDADOR.validate(comImagemDe(cabe)).isEmpty(),
                "uma foto de " + LIMITE_MB + " MB vira " + cabe
                        + " caracteres em base64, e o @Size de imagemUrl precisa aceitar isso");
    }

    @Test void acimaDoLimiteARecusaVemDaApi() {
        int demais = caracteresBase64((LIMITE_MB + 2) * 1024L * 1024L);
        assertFalse(VALIDADOR.validate(comImagemDe(demais)).isEmpty(),
                "acima do limite a API tem de recusar, em vez de guardar qualquer tamanho");
    }
}
