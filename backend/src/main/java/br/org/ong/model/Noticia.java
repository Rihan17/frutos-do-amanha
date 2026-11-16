package br.org.ong.model;

import java.time.Instant;
import java.time.LocalDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

/* Uma matéria do site. Antes as notícias eram páginas HTML escritas à mão
   (noticia-*.html); agora vivem no banco e o painel as edita.

   "publicada" separa o rascunho da matéria no ar: o site público só lista o
   que está publicado, e o painel lista as duas coisas. */
@Document("noticias")
public class Noticia {
    @MongoId(FieldType.OBJECT_ID) private String id;
    private String titulo;
    @Indexed private String slug;
    private String categoria;
    private String resumo;
    private String texto;
    private String imagemUrl;
    private String imagemAlt;
    private LocalDate dataPublicacao;
    @Indexed private boolean publicada;
    private Instant dataCadastro;
    @Field(targetType = FieldType.OBJECT_ID) private String adminId;

    public Noticia() { this.dataCadastro = Instant.now(); }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getResumo() { return resumo; }
    public void setResumo(String resumo) { this.resumo = resumo; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getImagemAlt() { return imagemAlt; }
    public void setImagemAlt(String imagemAlt) { this.imagemAlt = imagemAlt; }
    public LocalDate getDataPublicacao() { return dataPublicacao; }
    public void setDataPublicacao(LocalDate dataPublicacao) { this.dataPublicacao = dataPublicacao; }
    public boolean isPublicada() { return publicada; }
    public void setPublicada(boolean publicada) { this.publicada = publicada; }
    public Instant getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(Instant dataCadastro) { this.dataCadastro = dataCadastro; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
}
