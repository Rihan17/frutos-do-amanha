package br.org.ong.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/* A foto chega embutida como data URL em base64, não como upload de arquivo.
   Os 14 milhões de caracteres de imagemUrl correspondem a um arquivo de 10 MB,
   que é o limite conferido no navegador (lerImagem, no painel.js): base64
   engorda um terço. Mexer num lado sem mexer no outro quebra o envio. */
public record NoticiaRequest(
        @NotBlank @Size(max = 160) String titulo,
        @Size(max = 160) String slug,
        @Size(max = 80) String categoria,
        @NotBlank @Size(max = 400) String resumo,
        @NotBlank @Size(max = 40000) String texto,
        @Size(max = 14000000) String imagemUrl,
        @Size(max = 160) String imagemAlt,
        LocalDate dataPublicacao,
        Boolean publicada) {}
