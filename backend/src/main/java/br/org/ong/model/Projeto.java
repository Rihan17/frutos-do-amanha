package br.org.ong.model;

import java.time.Instant;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Document("projetos")
public class Projeto {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String nome;
    private String slug;
    private String categoria;
    private String resumo;
    private String descricao;
    private String imagemUrl;
    private String imagemAlt;
    private int ordem;
    private Instant dataCadastro;
    @Indexed private boolean ativo;
    @Field(targetType = FieldType.OBJECT_ID) private String adminId;

    public Projeto() { this.ativo = true; this.dataCadastro = Instant.now(); }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getResumo() { return resumo; }
    public void setResumo(String resumo) { this.resumo = resumo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getImagemAlt() { return imagemAlt; }
    public void setImagemAlt(String imagemAlt) { this.imagemAlt = imagemAlt; }
    public int getOrdem() { return ordem; }
    public void setOrdem(int ordem) { this.ordem = ordem; }
    public Instant getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(Instant dataCadastro) { this.dataCadastro = dataCadastro; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
}
