package br.org.ong.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;

/* Decide quando um erro vira a página 404.html e quando vira JSON.

   O mesmo endereço errado pode chegar de dois jeitos muito diferentes: uma
   pessoa digitando no navegador, que precisa de uma página com o visual do
   site, e o próprio site chamando a API por fetch, que precisa de JSON para
   mostrar o recado no formulário. Antes os dois recebiam JSON, e quem errava
   o endereço via um texto técnico na tela.

   A regra: página só para navegação de verdade. É o que o Accept e o
   Sec-Fetch-Mode dizem — o navegador manda "text/html" e "navigate" ao abrir
   um endereço, e o fetch do site não manda nem um nem outro. */
public final class PaginaDeErro {
    private static final String CAMINHO = "static/404.html";
    /* Lida uma vez; o arquivo não muda enquanto a aplicação roda. */
    private static volatile String html;

    private PaginaDeErro() {}

    public static boolean querPagina(HttpServletRequest req) {
        if (req == null) return false;
        String aceita = req.getHeader("Accept");
        if (aceita == null || !aceita.contains(MediaType.TEXT_HTML_VALUE)) return false;
        /* Quando o cabeçalho existe, só navegação vale. Quando não existe
           (navegadores antigos, curl), o Accept acima já basta. */
        String modo = req.getHeader("Sec-Fetch-Mode");
        return modo == null || "navigate".equals(modo);
    }

    /* Escreve a página com o status pedido. Devolve false quando o arquivo
       não está no pacote — aí quem chamou segue com a resposta em JSON. */
    public static boolean escrever(HttpServletResponse res, int status) throws IOException {
        String corpo = carregar();
        if (corpo == null) return false;
        res.setStatus(status);
        res.setContentType(MediaType.TEXT_HTML_VALUE + ";charset=UTF-8");
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.getWriter().write(corpo);
        /* Confirma a resposta aqui mesmo. O tratador de exceções devolve null
           depois de chamar este método, e o Spring só aceita esse null como
           "já respondi" se a resposta estiver confirmada; sem o flush, ele
           tentaria escrever por cima. */
        res.flushBuffer();
        return true;
    }

    /* O 404.html pede os estilos por caminho relativo ("assets/css/..."),
       o que funciona porque todas as páginas do site moram na raiz. Só que
       esta página agora é servida no endereço que a pessoa errou, e um
       endereço com pastas — /algo/errado — faria o navegador procurar os
       estilos em /algo/assets/..., e a página apareceria sem formatação.
       Uma <base> resolve tudo a partir da raiz, qualquer que seja o
       endereço. O arquivo em disco não muda: isto vale só ao servir. */
    private static String comBase(String pagina) {
        int fim = pagina.indexOf("<head>");
        if (fim < 0) return pagina;
        fim += "<head>".length();
        return pagina.substring(0, fim) + "\n  <base href=\"/\">" + pagina.substring(fim);
    }

    private static String carregar() {
        String pronto = html;
        if (pronto != null) return pronto.isEmpty() ? null : pronto;
        try (InputStream entrada = new ClassPathResource(CAMINHO).getInputStream()) {
            pronto = comBase(new String(entrada.readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            /* Em desenvolvimento o front não está dentro do jar: sem página,
               e a resposta continua sendo a de sempre. */
            pronto = "";
        }
        html = pronto;
        return pronto.isEmpty() ? null : pronto;
    }
}
