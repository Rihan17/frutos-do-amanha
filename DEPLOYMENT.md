# Publicar gratuitamente para demonstração

Este projeto pode rodar em um único serviço web do Render: o container compila a API Spring e empacota os arquivos do `frontend/` dentro da aplicação. O MongoDB continua no Atlas. O código permanece organizado em pastas separadas.

O Blueprint usa um banco separado, `ong_demo`, e cria nele um administrador de demonstração. Assim, o site publicado não lê nem altera os dados atuais do banco `ong`. Crie um usuário MongoDB exclusivo para esse banco com a função `readWrite` apenas em `ong_demo`.

O plano gratuito do Render é adequado para demonstração, mas suspende o serviço web após 15 minutos sem tráfego, pode reiniciá-lo e não é indicado para produção. A primeira requisição depois da suspensão demora para acordar a API. O front-end e a API compartilham o mesmo domínio, então não é preciso liberar CORS entre serviços.

## Antes de publicar: trocar a senha do MongoDB

1. Entre no MongoDB Atlas e abra **Security → Database Access**.
2. Edite o usuário de banco atual e gere uma senha nova para invalidar a credencial exposta.
3. Crie um segundo usuário exclusivo da demonstração, com a função `readWrite` somente no banco `ong_demo`.
4. Copie uma URI em **Connect → Drivers** para esse novo usuário. Use-a somente nas variáveis de ambiente, nunca em arquivos do site, no GitHub ou em mensagens.
5. Depois de confirmar que o site local continua usando a credencial rotacionada e que a demonstração usa o usuário novo, remova usuários antigos que não serão mais usados.

A senha do administrador não tem mais tela para ser trocada: a área de conta saiu do projeto e o painel novo ainda não tem esse formulário. O endpoint continua existindo (`PUT /auth/alterar-senha`, com o token no cabeçalho). O caminho que funciona pela interface é o de recuperação: `gestao.html` → **Receber um link por e-mail** → o link abre `redefinir-senha.html?token=...`. Ele depende de SMTP configurado, que o plano gratuito do Render não permite (veja a última seção). O admin da demonstração é outra conta, criada pelas variáveis secretas do Render.

## Publicar

1. Crie um repositório **privado e vazio** no GitHub. No terminal, entre na pasta principal do projeto e envie os arquivos:

   ```bash
   cd "$HOME/Área de trabalho/ong-frutos-do-amanha"
   git init -b main
   git add .
   git status --short
   ```

   Confira a lista e confirme que não há `.env`, `application-local.properties` ou arquivos com credenciais. Depois faça o commit e associe o endereço do repositório privado:

   ```bash
   git commit -m "Preparar publicação da ONG"
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

   Troque `SEU_USUARIO/SEU_REPOSITORIO` pelo caminho do repositório que você criou. O `.gitignore` e `.dockerignore` do projeto excluem arquivos locais de configuração.
2. No Render, crie um **Blueprint** e conecte esse repositório. O Render lê `render.yaml` e configura o serviço web gratuito com Docker.
3. No fluxo inicial do Blueprint, informe `MONGODB_URI` do novo usuário limitado ao banco `ong_demo`, o e-mail/nome do administrador da demonstração e uma senha nova para ele. O Blueprint gera `JWT_SECRET` como chave aleatória em Base64 de 256 bits. Trocar essa chave invalida os tokens de login já emitidos.
4. Assim que o serviço Render for criado, abra **Connect → Outbound** e adicione no Atlas, em **Security → Network Access**, as faixas CIDR de saída mostradas pelo Render. Faça isso antes de depender de uma conexão bem-sucedida; se a primeira inicialização falhar, redeploy depois de liberar as faixas. Mantenha também o IP atual do seu computador se ainda for acessar o banco localmente. Não use `0.0.0.0/0` como configuração permanente.
5. Após o Render mostrar o domínio `https://...onrender.com`, abra esse endereço. Ele serve o front-end e a API. `api-config.js` seleciona o domínio automaticamente; no Live Server local, continua apontando para `http://localhost:8080`.

O banco `ong_demo` começa vazio; o Render cria o administrador com as variáveis `ONG_ADMIN_EMAIL`, `ONG_ADMIN_PASSWORD` e `ONG_ADMIN_NOME`. Os projetos de demonstração são semeados pela aplicação.

## O que depende de serviços externos

- Pagamentos reais dependem das credenciais do Mercado Pago e da configuração do webhook HTTPS. Não configure token de produção até validar o fluxo com credenciais de teste.
- O banco vazio recebe os dados públicos padrão da ONG configurados no projeto, inclusive a chave PIX. Confirme com a ONG que esses dados e a exibição pública da chave estão autorizados antes de divulgar o domínio.
- A recuperação por Gmail/SMTP não funciona nesse plano gratuito do Render porque conexões SMTP de saída nas portas usuais são bloqueadas. Ela precisa de um provedor de e-mail via HTTPS ou de outra hospedagem que permita SMTP.
- Um serviço gratuito pode dormir; não use este plano para depender de pagamentos, e-mails ou tarefas agendadas em tempo real.
