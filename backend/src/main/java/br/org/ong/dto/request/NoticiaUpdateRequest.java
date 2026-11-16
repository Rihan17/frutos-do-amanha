package br.org.ong.dto.request;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/* Tudo opcional: o painel manda só o que mudou. Despublicar, por exemplo,
   é um PUT com publicada = false e mais nada. */
public record NoticiaUpdateRequest(
        @Size(max = 160) String titulo,
        @Size(max = 160) String slug,
        @Size(max = 80) String categoria,
        @Size(max = 400) String resumo,
        @Size(max = 40000) String texto,
        @Size(max = 14000000) String imagemUrl,
        @Size(max = 160) String imagemAlt,
        LocalDate dataPublicacao,
        Boolean publicada) {}
