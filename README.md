# GEO·TI — Indicadores Geográficos de Empresas de TI

**Site publicado:** <https://gustin7.github.io/indicadores-geograficos-ti/>

Website de apresentação do trabalho acadêmico **Indicadores Geográficos de Empresas do Setor de
Tecnologia da Informação**, com o aplicativo de mapa desenvolvido no ArcGIS incorporado à página.

- **Tema:** distribuição geográfica de empresas que atuam em TI
- **Ferramenta:** ArcGIS Instant Apps — modelo *Compare*
- **Integrantes:** Augusto César, Samuel Maciel, Lucca Casarim e Italo Henrique
- **Aplicativo original:** <https://www.arcgis.com/apps/instant/compare/index.html?appid=ebee2d228dc24e50ac4e30506d478b24>

O site tem duas telas — a apresentação do projeto e a exploração do mapa — com transição animada
entre elas, rota por hash (`#apresentacao` e `#mapa`) e versão responsiva.

## Estrutura

```text
/
├── index.html              # as três telas, no mesmo documento
├── css/
│   ├── fonts.css           # @font-face das fontes locais
│   └── style.css           # tokens, layout, componentes e responsivo
├── js/
│   ├── plot.js             # painel cartográfico da capa (canvas + SVG)
│   └── app.js              # rotas, transições, iframe, status e tela cheia
├── dados/
│   ├── empresas_ti_mg.csv  # base do levantamento (fonte do Power BI)
│   └── tema-geoti.json     # tema do Power BI na paleta do site
├── assets/
│   ├── fonts/              # Archivo, IBM Plex Sans e IBM Plex Mono (subset latin)
│   ├── icons/
│   │   └── favicon.svg
│   └── img/                # capturas dos seis visuais do Power BI
└── README.md
```

Tudo é estático: HTML5, CSS3 e JavaScript puro, sem build, sem dependências e sem backend.
As fontes são servidas pelo próprio site, então não há requisição a CDNs de terceiros.

## Painel no Power BI

A terceira tela apresenta o painel analítico: quatro indicadores, os seis gráficos do relatório
em capturas (clique para ampliar) e o botão que abre o relatório no Power BI. O link fica no
`index.html` (procure por `app.powerbi.com/groups/me/reports`); trocar o `href` nos dois botões
atualiza a tela inteira.

- **Base:** `dados/empresas_ti_mg.csv`, com as 20 empresas do mapa (cidade, segmento, porte,
  salário médio, nota Glassdoor, avaliações e coordenadas).
- **Relatório:** criado no Power BI sobre essa base — pizza de empresas por cidade, rosca por
  porte, nota e avaliações por cidade, salário por cidade e por segmento.
- **Capturas:** `assets/img/painel-01…06.png`, geradas em modo de foco (1205×828) e exibidas
  em galeria com lightbox. Para atualizar, basta substituir os arquivos com os mesmos nomes.
- **Tema:** `dados/tema-geoti.json` pode ser importado em *Exibição → Temas* para alinhar o
  relatório à paleta do site.
- **Incorporação:** a conta institucional bloqueia “Publicar na web”, então o relatório não pode
  ser embutido em iframe público. A tela mostra as capturas e o botão “Abrir painel no Power BI”.
  Se a instituição liberar a opção, troque a galeria por um `<iframe>` com a URL `view?r=…`.



## Rodar localmente

**Opção 1 — servidor local (recomendado).** O iframe do ArcGIS se comporta melhor quando a página
vem de `http://localhost`:

```bash
# com Python
python -m http.server 8000

# ou com Node.js
npx serve .
```

Depois abra <http://localhost:8000>.

**Opção 2 — abrir o arquivo.** Também funciona dar duplo clique em `index.html`. O layout e as
animações rodam normalmente; o mapa pode não carregar em alguns navegadores quando a origem é
`file://`, e nesse caso o botão “Abrir aplicativo original” resolve.

## Publicar

### GitHub Pages

```bash
git init
git add .
git commit -m "Website do trabalho: indicadores geográficos de empresas de TI"
git branch -M main
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

No repositório: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)`**.
O site fica em `https://<usuario>.github.io/<repositorio>/`.

### Netlify

1. <https://app.netlify.com/drop> → arraste a pasta do projeto; **ou**
2. conecte o repositório e use *build command* vazio e *publish directory* `.`.

### Vercel

Importe o repositório, escolha o preset **Other**, deixe o *build command* vazio e o
*output directory* como `.` (raiz).

Nenhuma das plataformas precisa de variável de ambiente, redirecionamento ou configuração extra.

## Notas técnicas

- **Iframe do ArcGIS:** o app é carregado sob demanda na primeira visita à tela do mapa e
  permanece montado ao voltar para a apresentação, evitando recarregar o mapa.
- **Fallback:** se o ArcGIS não carregar em ~14 s (bloqueio de terceiros, rede ou política do
  navegador), o painel de carregamento é substituído por uma mensagem com o botão
  “Abrir aplicativo original” e a opção “Tentar novamente”. A área do mapa nunca fica em branco.
- **Acessibilidade:** skip link, um `h1` por tela, foco visível, `aria-live` no status do mapa,
  `inert` na tela inativa, iframe com `title` e respeito a `prefers-reduced-motion`.
- **Desempenho:** partículas do painel pausam fora da tela e com a aba oculta; as animações usam
  apenas `transform` e `opacity`.
- **Conteúdo:** a página não exibe números ou estatísticas inventadas — apenas o que o trabalho
  entrega e o mapa oficial do grupo.
