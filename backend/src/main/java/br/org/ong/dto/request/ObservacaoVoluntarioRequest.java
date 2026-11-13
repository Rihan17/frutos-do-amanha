package br.org.ong.dto.request;

import jakarta.validation.constraints.Size;

public record ObservacaoVoluntarioRequest(@Size(max = 1000) String observacao) {}
