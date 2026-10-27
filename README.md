# Profissional-Portfolio
My portfolio site. Profissional level for work!

Site estático (HTML + CSS + JS, sem build). Basta abrir `index.html` no browser
ou publicar a pasta em GitHub Pages / Netlify / Vercel.

## Estrutura

```
index.html                 conteúdo de todas as secções
css/style.css              estilos (tema escuro/claro via variáveis em :root)
js/main.js                 toggle de tema, menu mobile, scroll spy, animações
assets/illustrations/      os teus desenhos
```

## Ilustrações

As imagens aprovadas no Penpot ficam em `assets/illustrations/`. As cinco
ilustrações têm uma versão para cada tema; o botão de tema troca também os
ficheiros apresentados. O logótipo original é partilhado pelos dois temas.
As ilustrações são servidas em WebP otimizado, mantendo a resolução dos PNG do
Penpot. O logótipo mantém o PNG original e recebe um filtro de contraste por CSS
no tema claro.

| Tema escuro | Tema claro | Secção |
| --- | --- | --- |
| `logo.png` | `logo.png` | Cabeçalho e rodapé |
| `hero.webp` | `hero-light.webp` | Início |
| `about.webp` | `about-light.webp` | 01. About Me |
| `open-source.webp` | `open-source-light.webp` | 04. Open Source |
| `background.webp` | `background-light.webp` | 06. Background |
| `contact.webp` | `contact-light.webp` | 08. Contact |

Para substituir uma ilustração, mantém estes nomes ou atualiza `src`,
`data-src-dark` e `data-src-light` no `index.html`. As imagens abaixo da primeira
secção usam carregamento diferido. Os espaços reservados continuam disponíveis
como alternativa caso um ficheiro não carregue.
