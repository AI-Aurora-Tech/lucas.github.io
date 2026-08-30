# Portfólio — Lucas Gabriel Silva dos Santos

Site de portfólio esportivo com vídeos (em carrossel), fotos e as informações do atleta.
É um site estático: HTML, CSS e JavaScript puros, sem dependências para instalar.

---

## Como subir fotos e vídeos

Basta jogar os arquivos dentro das pastas abaixo. **Os nomes podem ser
quaisquer** — os nomes aleatórios do WhatsApp funcionam sem problema, o site lê
tudo o que estiver na pasta.

| Pasta | O que colocar |
|---|---|
| `midia/logo/` | O logo, com o nome **`Logo.jpeg`** |
| `midia/fotos/` | Todas as fotos (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`) |
| `midia/videos/` | Todos os vídeos (`.mp4`, `.webm`, `.mov`, `.m4v`, `.ogg`) |

Subpastas dentro de `midia/fotos/` e `midia/videos/` também são lidas.

Quando o nome do arquivo tem uma data (como nos arquivos do WhatsApp:
`WhatsApp Video 2026-03-15 at 19.42.10.mp4`), ela aparece como legenda no site.

### Pelo site do GitHub

1. Abra a pasta (ex.: `midia/fotos`)
2. **Add file → Upload files**
3. Arraste os arquivos e clique em **Commit changes**

O site se atualiza sozinho depois disso — não precisa mexer em código.

---

## Publicando no GitHub Pages

Uma única vez, para ligar o site:

1. No repositório, vá em **Settings → Pages**
2. Em **Source**, escolha **GitHub Actions**

> **Importante:** deixe o *Source* em **GitHub Actions**, não em *Deploy from a
> branch*. Nos dois modos ligados ao mesmo tempo, cada envio dispara duas
> publicações concorrentes e vale a que terminar por último — o que faz o site
> ora atualizar, ora não. O modo *branch* publica os arquivos como estão
> salvos, sem varrer as pastas de mídia.

Pronto. A cada envio para a branch principal do repositório, o GitHub Actions
varre as pastas de mídia, regenera a lista de arquivos e publica o site em:

```
https://ai-aurora-tech.github.io/portfolio-LG/
```

---

## Vendo o site no computador (opcional)

```bash
node scripts/gerar-midia.js   # lê as pastas de mídia e gera a lista de arquivos
```

Depois é só abrir o `index.html` no navegador. Para um resultado mais fiel ao
publicado, rode um servidor local:

```bash
python3 -m http.server 8000   # depois acesse http://localhost:8000
```

Rode o `gerar-midia.js` sempre que adicionar arquivos localmente. No GitHub isso
acontece automaticamente a cada publicação.

> As branches que disparam a publicação estão listadas em
> `.github/workflows/deploy.yml`, no campo `branches`. Se você renomear a branch
> principal, atualize essa lista.

---

## A foto ou o vídeo novo não apareceu?

A lista de arquivos é lida com o cache desligado, então um upload novo aparece
já no primeiro refresh. Se ainda assim faltar algo, confira nesta ordem:

1. Em **Actions**, se a última execução de *Publicar site* terminou com o visto
   verde. O log do passo *Gerar lista de fotos e vídeos* mostra quantas fotos e
   vídeos foram encontrados — é o número que o site vai exibir.
2. Se aparecer também uma execução chamada *pages build and deployment* no mesmo
   envio, o *Source* do Pages está em *Deploy from a branch*. Troque para
   **GitHub Actions** (veja acima): as duas publicações competem entre si.
3. Se o arquivo está na pasta certa (`midia/fotos` ou `midia/videos`) e com uma
   extensão suportada.
4. Se o vídeo é `.mp4` com H.264 (o padrão do WhatsApp). `.mov` do iPhone só
   abre no Safari — veja a conversão abaixo.
5. Se você mudou textos do `index.html`, o navegador guarda a página por até 10
   minutos. Um recarregamento forçado (Ctrl+Shift+R) mostra a versão nova na
   hora. A lista de fotos e vídeos não passa por essa espera.

## Limites de tamanho do GitHub

- **100 MB** é o limite por arquivo. Vídeos maiores são recusados no envio.
- Acima de **50 MB** o GitHub mostra um aviso, mas aceita.
- O repositório inteiro deve ficar, de preferência, abaixo de **1 GB**.

Se algum vídeo passar de 100 MB, comprima antes de enviar. Com o
[FFmpeg](https://ffmpeg.org/):

```bash
ffmpeg -i entrada.mp4 -vcodec libx264 -crf 28 -preset slow -acodec aac saida.mp4
```

Vídeos em `.mov` (iPhone) funcionam no Safari, mas nem sempre no Chrome e no
Firefox. Converter para `.mp4` é o mais seguro:

```bash
ffmpeg -i entrada.mov -vcodec libx264 -acodec aac saida.mp4
```

Fotos `.heic` do iPhone também têm suporte irregular nos navegadores — o site
esconde automaticamente as que não abrirem. O ideal é converter para `.jpg`.

---

## Painel de edição

Para alterar os dados do atleta sem mexer em código, abra o **painel de edição**
em `/admin.html` — por exemplo, `https://lucas.auroratech.app.br/admin.html`.
Não há link para ele no site: guarde esse endereço nos favoritos.

Nele dá para editar:

- dados do atleta (nome, nascimento, altura, peso, perna boa, categoria, posições);
- times, torneios e títulos — incluindo adicionar, remover e reordenar;
- o período em cada time; deixando em branco, o site mostra **Atual**;
- legenda e ordem de cada vídeo e de cada foto.

O painel **não envia nada sozinho** — um site sem servidor não tem permissão
para gravar no repositório. O fluxo é:

1. edite o que quiser;
2. na aba **Salvar**, clique em *Baixar dados.json*;
3. envie esse arquivo na pasta `assets` do repositório, por cima do antigo.

Cerca de um minuto depois o site está atualizado. Como o painel lê esse arquivo
sem passar pelo cache, a alteração aparece já no primeiro refresh.

Para acrescentar ou apagar fotos e vídeos, os botões *Abrir a pasta no GitHub*
levam direto à tela de envio da pasta certa.

A **idade é calculada sozinha** a partir da data de nascimento — não precisa
atualizar em nenhum aniversário.

O `index.html` continua trazendo os textos como estão hoje, e serve de reserva
caso o `dados.json` não carregue. Quando os dois existem, **o `dados.json` é
que vale**.

---

## Estrutura do projeto

```
index.html                        página do site
admin.html                        painel de edição dos dados
assets/dados.json                 dados do atleta (editados pelo painel)
assets/css/style.css              estilos, incluindo o campo de futebol de fundo
assets/css/admin.css              estilos do painel
assets/js/main.js                 idade automática, carrossel e galeria
assets/js/admin.js                lógica do painel
assets/media.json                 lista de arquivos (gerado — não edite)
assets/media.js                   a mesma lista, usada ao abrir o site do disco
scripts/gerar-midia.js            varre as pastas de mídia e gera o media.js
midia/logo/Logo.jpeg              logo do portfólio
midia/fotos/                      fotos
midia/videos/                     vídeos
.github/workflows/deploy.yml      publicação automática no GitHub Pages
```
