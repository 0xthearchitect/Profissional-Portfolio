# Profissional-Portfolio
My portfolio site. Profissional level for work!

Site estático (HTML + CSS + JS, sem build). Podes abrir `index.html` diretamente,
servir a pasta por HTTP ou publicar em GitHub Pages / Netlify / Vercel.

## Estrutura

```
index.html                 todas as secções (PT no HTML, EN em atributos data-en*)
css/style.css              estilos: preto, creme #fff8d0, Lilita One / Instrument Sans / IBM Plex Mono
js/main.js                 língua PT/EN, separadores dos projetos, teclado das ferramentas
js/github.js               contagens e estrelas do GitHub (snapshot incluído + atualização em direto)
js/github-config.mjs       utilizador e projetos em destaque ("owner/nome" para repos de outras contas)
scripts/sync-github.mjs    sincronização usada pelo GitHub Actions
data/github.json           snapshot gerado pelo GitHub Actions
assets/brand/              triângulo e wordmark (os logos originais)
assets/projects/           logos e capturas dos projetos
```

## Secções

Início · 01 Percurso · 02 Projetos (BeatBox, Mimic, Pocketme, CaraDBela, C.A.L.M.A.) ·
03 Ferramentas (teclado Construir / Quebrar) · 04 Como trabalho · 05 Contacto.
A língua começa em PT; o botão EN troca os textos e fica guardado no browser.

## Dados automáticos do GitHub

O rodapé do início mostra as contribuições do último ano e o número de repositórios
públicos; cada projeto mostra as suas estrelas (um projeto sem estrelas não mostra número).
Os projetos são definidos em `js/github-config.mjs` e têm de corresponder aos
atributos `data-repo` em `index.html`.

O workflow **Sync GitHub profile** atualiza `data/github.json` e o snapshot incluído
em `index.html` de hora a hora (ou manualmente em Actions → Sync GitHub profile → Run workflow),
com o `GITHUB_TOKEN` automático do Actions. O browser mostra o snapshot incluído antes de
qualquer pedido de rede, mesmo por `file://`, e depois tenta atualizar em direto pela API
pública e pelo `data/github.json` mais recente na branch `main`. Se nada responder, o
rodapé indica a data dos dados guardados.
Para atualizar localmente: `node scripts/sync-github.mjs` (Node 24).

## Testes

`python tests/verify_github.py` (precisa de Playwright e do Chrome) verifica o snapshot,
a atualização em direto, o modo offline, a troca de língua, os separadores e o teclado.
