# Organização do projeto

Site estático de DJ Nicolas Silva. A raiz guarda um único arquivo de projeto: `index.html`. Cada outro arquivo fica na pasta do seu tipo.

## Raiz

| Item | Papel |
| --- | --- |
| `index.html` | Entrada do site: home, navegação e ligação com o restante |

Pastas não contam como arquivo solto. A raiz pode ter as pastas abaixo e a pasta `.git` do repositório. Nenhum outro arquivo fica na raiz.

## Mapa

```text
index.html
pages/                 páginas internas do site
assets/
  brand/               selo, logos e favicon
  css/                 folha de estilo
  js/                  comportamento do site
  images/
    instagram/         fotos públicas do perfil e da Fire Music
press/                 textos para download: bio, ficha, legendas
seo/                   robots.txt e sitemap.xml
docs/                  este padrão
```

## O que entra em cada pasta

- `pages/` — uma página por arquivo: trajetória, sets, agenda, LP, press kit, campanhas, contato e privacidade.
- `assets/brand/` — marca. O favicon do site é `assets/brand/favicon.svg`.
- `assets/css/` — estilo. Hoje, `styles.css`.
- `assets/js/` — scripts. Hoje, `main.js`.
- `assets/images/instagram/` — fotografias usadas nas páginas, com `fontes.txt` na mesma pasta.
- `press/` — arquivos de texto que o press kit oferece para download. Não são páginas.
- `seo/` — instruções para buscadores. Não são páginas do visitante.
- `docs/` — decisões de estrutura. Não entram no site publicado como conteúdo.

Arquivo novo segue a pasta do tipo. Página nova vai para `pages/`. Foto nova vai para `assets/images/`, na subpasta do conjunto. Texto de imprensa vai para `press/`.

## Caminhos

A home fica na raiz. As outras páginas ficam um nível abaixo, em `pages/`.

Na home (`index.html`):

- outra página: `pages/nome.html`
- a própria home: `index.html` ou `index.html#galeria`
- estilo, script, foto e favicon: `assets/...`

Em uma página interna (`pages/nome.html`):

- home: `../index.html`
- outra página interna: `nome.html` (mesma pasta)
- estilo, script, foto e favicon: `../assets/...`
- texto de imprensa: `../press/...`

`assets/js/main.js` é o mesmo arquivo na home e nas páginas internas. O link da política de privacidade, montado por esse script, usa `internalPage()`: em `pages/` o arquivo é `privacidade.html`; na home é `pages/privacidade.html`.

## Publicação

Buscadores pedem `/robots.txt` e `/sitemap.xml` na raiz do domínio. No projeto esses arquivos ficam em `seo/`, para a raiz não acumular arquivo além de `index.html`.

Quando o domínio estiver no ar:

- publique `seo/robots.txt` em `/robots.txt`
- publique `seo/sitemap.xml` em `/sitemap.xml`

A home já aponta o mapa com `<link rel="sitemap" href="seo/sitemap.xml">`. Isso ajuda quem abre o projeto. O Google continua esperando o mapa na raiz do domínio.
