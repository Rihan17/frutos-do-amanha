package br.org.ong.config;

import br.org.ong.model.Noticia;
import br.org.ong.repository.NoticiaRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/* As três matérias que o site já tinha, semeadas no banco na primeira
   inicialização, como o ProjetoSeedConfiguration faz com os projetos.

   Sem isto a transição ficaria estranha: a lista de notícias mostra o que
   está escrito no HTML enquanto o banco estiver vazio, e as três sumiriam da
   tela no instante em que a equipe publicasse a primeira notícia pelo painel.
   Semeadas, elas continuam na lista e passam a ser editáveis.

   As páginas noticia-*.html continuam no projeto e seguem abrindo por
   endereço direto, para não quebrar link já divulgado. */
@Configuration
public class NoticiaSeedConfiguration {
    @Bean
    ApplicationRunner seedNoticias(NoticiaRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            repository.saveAll(List.of(
                    noticia("1ª Quermesse Beneficente reúne o bairro na sede",
                            "quermesse-beneficente",
                            "Evento · Sede Vila Matias",
                            LocalDate.of(2026, 8, 23),
                            "Comidas típicas, brincadeiras e apresentações das oficinas. Toda a renda foi para as cestas da Feirinha da Criança e para a reforma da sala de reforço escolar.",
                            """
                            No sábado, 23 de agosto, a sede da Frutos do Amanhã virou arraiá. A primeira Quermesse Beneficente da ONG juntou famílias atendidas, vizinhos e voluntários num pátio com barracas de comida, brincadeiras e apresentações das turmas de dança e música.

                            A ideia nasceu nas oficinas: as crianças queriam mostrar o que ensaiaram durante o ano, e a equipe aproveitou para transformar a apresentação em arrecadação. Os pratos foram preparados pelas mães que participam dos cursos de geração de renda.

                            Toda a renda foi dividida entre duas frentes: a compra de alimentos para as cestas da Feirinha da Criança e a reforma da sala de reforço escolar, que precisava de pintura e de mesas novas.

                            A quermesse deve virar evento anual. Quem quiser ajudar na próxima edição pode se candidatar como voluntário pelo site.""",
                            "assets/img/quermesse-beneficente.jpg",
                            "Turma de dança da ONG em apresentação no palco, com saias cor-de-rosa"),

                    noticia("Entrega de julho atende 250 famílias em dois dias",
                            "entrega-julho",
                            "Feirinha da Criança",
                            LocalDate.of(2026, 7, 12),
                            "Com a ajuda de voluntários e de pequenos comércios da região, a distribuição de alimentos aconteceu em São Vicente e em Praia Grande.",
                            """
                            A entrega de julho da Feirinha da Criança aconteceu em dois dias, atendendo cerca de 250 famílias em São Vicente e em Praia Grande. A divisão em dois dias, com horários combinados por grupo, evitou fila na porta da sede.

                            As cestas levaram alimentos não perecíveis, frutas, legumes e verduras. Boa parte das frutas e verduras veio de pequenos comércios da região, que separam o que podem no dia anterior à distribuição.

                            Oito voluntários trabalharam na montagem das cestas na véspera e mais seis ajudaram na entrega. Sem esse grupo, a distribuição levaria o dobro do tempo.

                            A próxima entrega acontece no mês seguinte, na mesma sede. Quem quiser doar alimentos pode deixar na sede de segunda a sexta, das 9h às 17h.""",
                            "assets/img/entrega-julho.jpg",
                            "Voluntários montando cestas de alimentos na sede"),

                    noticia("Estudando para o Amanhã abre lista de material",
                            "lista-material",
                            "Campanha",
                            LocalDate.of(2026, 6, 2),
                            "Já são 180 kits pedidos pelas famílias para o próximo ano letivo. A lista completa está no perfil do Instagram da ONG.",
                            """
                            A campanha Estudando para o Amanhã abriu a lista de material para o próximo ano letivo. Até agora, 180 kits foram pedidos pelas famílias atendidas.

                            Cada kit muda conforme a série da criança e costuma levar mochila, cadernos, estojo com lápis e canetas, régua, tesoura sem ponta, cola e, quando a escola exige, uniforme.

                            A arrecadação segue até o fim do ano, e as entregas acontecem em janeiro, antes do começo das aulas. A lista completa fica no perfil do Instagram da ONG durante todo o período da campanha.

                            Dá para ajudar doando material novo na sede ou doando em dinheiro, o que permite comprar exatamente o que falta nas listas.""",
                            "assets/img/lista-material.jpg",
                            "Kits de material escolar separados sobre uma mesa")));
        };
    }

    private static Noticia noticia(String titulo, String slug, String categoria, LocalDate data,
            String resumo, String texto, String imagemUrl, String imagemAlt) {
        Noticia n = new Noticia();
        n.setTitulo(titulo);
        n.setSlug(slug);
        n.setCategoria(categoria);
        n.setDataPublicacao(data);
        n.setResumo(resumo);
        n.setTexto(texto);
        n.setImagemUrl(imagemUrl);
        n.setImagemAlt(imagemAlt);
        n.setPublicada(true);
        return n;
    }
}
