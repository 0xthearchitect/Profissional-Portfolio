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

Cada espaço reservado mostra o nome do ficheiro esperado. Coloca o desenho em
`assets/illustrations/` com esse nome e ele aparece automaticamente:

| Ficheiro           | Secção                                  |
|--------------------|-----------------------------------------|
| `logo.svg`         | Logótipo no cabeçalho (substitui o texto) |
| `hero.svg`         | Hero — figura com capuz + janelas       |
| `about.svg`        | 01. About Me — globo / cubo             |
| `open-source.svg`  | 04. Open Source — octocat               |
| `background.svg`   | 06. Background — cubos empilhados       |
| `contact.svg`      | 08. Contact — avião de papel            |

Podes usar `.png`/`.webp` em vez de `.svg`: muda só o `src` no `index.html`.
Para desenhos em traço que funcionem nos dois temas, usa SVG com
`stroke="currentColor"` ou PNG com fundo transparente.
