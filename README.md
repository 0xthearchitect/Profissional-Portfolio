# Profissional-Portfolio
My portfolio site. Profissional level for work!

Site estático (HTML + CSS + JS, sem build). Podes abrir `index.html` diretamente,
servir a pasta por HTTP ou publicar em GitHub Pages / Netlify / Vercel.

## Estrutura

```
index.html                 conteúdo de todas as secções
css/style.css              estilos (tema escuro/claro via variáveis em :root)
js/main.js                 toggle de tema, menu mobile, scroll spy, animações
js/github.js               estatísticas e repositórios públicos do GitHub
js/github-config.mjs       configuração usada pelo script de sincronização
scripts/sync-github.mjs     sincronização do calendário de contribuições
data/github.json           snapshot gerado por GitHub Actions
assets/illustrations/      os teus desenhos
```

## Dados automáticos do GitHub

O menu segue a ordem das secções: Projects → Open Source → Skills.
Ao abrir a página, `js/github.js` consulta a API pública para obter seguidores,
número de repositórios públicos e os projetos em destaque do utilizador
`0xthearchitect`: WhatIf, NataBase e Anvil. A seleção e a ordem são definidas
em `js/github-config.mjs`; executa o script de sincronização após alterá-las.
Nomes, descrições e estrelas vêm da API; as descrições são inseridas como texto.

As contribuições dos últimos 12 meses vêm do calendário público do perfil no
GitHub, sem necessidade de autenticação. O snapshot inicial já está incluído.
O workflow **Sync GitHub profile** atualiza `data/github.json` e o snapshot
incluído em `index.html` de hora a hora
(a execução pode atrasar no GitHub), na primeira publicação do workflow em
`main`/`master`, ou manualmente em Actions → Sync GitHub profile → Run workflow.
Usa o `GITHUB_TOKEN` automático do Actions para a API e os commits; não é necessário colocar um token
no browser nem configurar um serviço externo. GitHub Actions tem de estar ativo
e as regras da branch têm de permitir os commits do bot com `contents: write`.

O browser mostra os dados incluídos no HTML antes de qualquer pedido de rede,
mesmo quando aberto diretamente por `file://`. O JavaScript usa scripts normais,
sem imports de módulos no browser. Em segundo plano procura uma versão mais recente na
branch `main` via raw.githubusercontent.com, para receber as contribuições novas
mesmo sem um novo deploy do site. Ao mudar o nome do repositório ou a branch,
atualiza também o URL em `js/github.js`.
O snapshot continua visível se a API pública estiver indisponível ou atingir
o limite de pedidos; a página indica a data da sincronização. Se o GitHub alterar
o HTML do calendário, o script falha e preserva o último snapshot válido.
Para atualizar os dados localmente: `node scripts/sync-github.mjs` (Node 24).

Referências: [API de repositórios](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
e [calendário público do perfil](https://github.com/users/0xthearchitect/contributions).

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
