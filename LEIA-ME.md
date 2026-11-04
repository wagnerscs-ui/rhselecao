# Teste técnico online · Complementare

Site para o RH aplicar o teste técnico de instalações elétricas. Cada candidato recebe um link próprio, faz o teste no navegador e, depois de enviar, o link não abre mais o teste.

## Como funciona

1. O RH entra em `/admin`, digita o nome do candidato e clica em **Gerar link**. Sai um link como `https://SEU-SITE.netlify.app/t/AB3K7QPX`, com botão para mandar pelo WhatsApp.
2. O candidato abre o link, lê as orientações e clica em **Começar o teste**. A partir daí correm 25 minutos.
3. No A1 ele desenha à mão e envia a foto. Pelo computador, ele lê um QR code com o celular e tira a foto por lá; a página do teste avisa quando a foto chega. Também dá para enviar um arquivo direto.
4. As respostas são salvas sozinhas a cada 15 segundos. Se a conexão cair, o mesmo link retoma o teste com o tempo que sobrou.
5. Ao clicar em **Enviar respostas**, ou quando o tempo acaba, as respostas são gravadas uma única vez. Depois disso o link mostra "Este teste já foi enviado".

Durante o teste, colar texto fica bloqueado, e o sistema registra quantas vezes o candidato saiu da página, quantas vezes tentou colar e quantas vezes abriu o link.

## Onde ficam os resultados

- **Netlify Blobs**, o armazenamento do próprio site na conta Netlify de vocês. Nada fica no navegador do candidato.
- **Painel `/admin`**, protegido por senha. Mostra a lista de candidatos e a situação de cada um. Em cada candidato aparecem as respostas, a foto do desenho, o tempo gasto, os registros de saída da página, o gabarito ao lado e o formulário de avaliação (A1, B1, resultado e observação). O painel sugere o resultado pelo critério do gabarito.
- **E-mail (opcional):** a cada envio, um resumo com as respostas e a foto anexada vai para os endereços configurados.

O gabarito só sai do servidor para o painel com senha. As perguntas só aparecem para um link válido.

## Publicar na Netlify

Arrastar a pasta para o Netlify Drop **não serve**, porque não publica as funções. Use um dos caminhos abaixo.

### Opção A: pelo GitHub (recomendada)

1. Crie um repositório no GitHub e suba esta pasta, sem `node_modules`.
2. Na Netlify: **Add new site → Import an existing project → GitHub** e escolha o repositório. As configurações vêm do `netlify.toml`; não precisa mudar nada.
3. Em **Site configuration → Environment variables**, crie as variáveis da tabela abaixo.
4. Clique em **Deploy**. Depois, em **Domain management**, dá para trocar o nome, por exemplo `teste-complementare.netlify.app`, ou usar um subdomínio como `teste.cprojetos.com.br`.

### Opção B: pela linha de comando

```bash
npm install
npm install -g netlify-cli
netlify login
netlify init          # cria o site na sua conta
netlify env:set ADMIN_PASSWORD "uma-senha-forte"
netlify deploy --prod
```

### Variáveis de ambiente

| Variável | Obrigatória | Exemplo | Para que serve |
|---|---|---|---|
| `ADMIN_PASSWORD` | Sim | uma senha forte | Senha do painel do RH |
| `DURACAO_MIN` | Não | `25` | Duração do teste em minutos (padrão 25) |
| `SMTP_HOST` | Para e-mail | `smtp.zoho.com` | Servidor de e-mail |
| `SMTP_PORT` | Para e-mail | `465` | Porta SSL |
| `SMTP_USER` | Para e-mail | `rh@cprojetos.com.br` | Conta que envia |
| `SMTP_PASS` | Para e-mail | senha de aplicativo do Zoho | Senha da conta |
| `SMTP_FROM` | Não | `Teste técnico <rh@cprojetos.com.br>` | Remetente exibido |
| `MAIL_TO` | Para e-mail | `wagner@cprojetos.com.br, rh@equipecerta.com.br` | Quem recebe o aviso |

Sem as variáveis de e-mail, o site funciona normalmente e os resultados ficam só no painel.

## Uso no dia a dia

- **Gerar link:** `/admin` → nome → Gerar link → Enviar pelo WhatsApp.
- **Acompanhar:** a lista mostra quem não começou, quem está em andamento e quem enviou.
- **Problema técnico do candidato:** no detalhe, **Liberar o link de novo** apaga respostas e foto e deixa o link abrir do zero.
- **Fim do processo:** **Excluir candidato** apaga tudo dele. Vale fazer isso depois de fechar a vaga, para não guardar dados pessoais além do necessário (LGPD).

## Limites

- O bloqueio de colar e o registro de saída da página reduzem a consulta, mas não impedem o candidato de olhar outro aparelho. Para a maior segurança, o RH aplica o teste durante uma chamada de vídeo, com a câmera ligada.
- O link é a única chave do candidato. Quem tiver o link consegue abrir o teste enquanto ele não for enviado.

## Testar no computador antes de publicar

```bash
npm install
npm run local
```

Abra `http://localhost:8888/admin` com a senha `teste`. Os dados de teste ficam em `dev/.dados`; apague a pasta para zerar.

## Onde mudar o conteúdo

- Perguntas, imagem da A2, quadro da B1 e gabarito: `netlify/lib/conteudo.mjs`.
- Textos e regras da página do candidato: `public/assets/teste.js`.
- Painel do RH: `public/assets/admin.js`.
