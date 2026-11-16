package br.org.ong.model.embedded;

/* Os dados de quem responde pela criança, guardados dentro da solicitação e,
   depois de aprovada, copiados para o beneficiário.

   O endereço entrou depois: o formulário público já perguntava bairro e
   cidade, mas esses campos não existiam aqui e o que a família digitava era
   descartado no envio. Os nomes acompanham o que o ViaCEP devolve, que é o
   que preenche a maior parte deles no site.

   Documentos gravados antes desta mudança não têm os campos novos, e o
   driver os lê como null — por isso nada aqui é obrigatório. */
public record DadosResponsavel(
        String nome,
        String email,
        String telefone,
        String parentesco,
        String cep,
        String endereco,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf) {

    /* Para quem só tem os quatro campos antigos (um teste, um cadastro feito
       por chamada direta). Evita espalhar sete nulls pelo código. */
    public DadosResponsavel(String nome, String email, String telefone, String parentesco) {
        this(nome, email, telefone, parentesco, null, null, null, null, null, null, null);
    }

    /* "Rua Geralda Martins de Oliveira, 355 — Vila Matias, São Vicente/SP",
       montado só com o que existe, para a tabela do painel e para quem for
       entregar alguma coisa. */
    public String enderecoCompleto() {
        StringBuilder linha = new StringBuilder();
        if (preenchido(endereco)) linha.append(endereco.trim());
        if (preenchido(numero)) linha.append(linha.length() > 0 ? ", " : "").append(numero.trim());
        if (preenchido(complemento)) linha.append(linha.length() > 0 ? " " : "").append(complemento.trim());
        if (preenchido(bairro)) linha.append(linha.length() > 0 ? " — " : "").append(bairro.trim());
        if (preenchido(cidade)) {
            linha.append(linha.length() > 0 ? ", " : "").append(cidade.trim());
            if (preenchido(uf)) linha.append("/").append(uf.trim());
        }
        return linha.length() > 0 ? linha.toString() : null;
    }

    private static boolean preenchido(String v) { return v != null && !v.isBlank(); }
}
