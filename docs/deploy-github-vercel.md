# Deploy GitHub + Vercel

O projeto esta pronto para subir como Vite na Vercel.

## Status atual

- Build local aprovado com `npm run build`.
- Supabase configurado no app com URL e publishable key.
- `.env.local`, `node_modules`, `dist`, cache e pasta `work` ficam fora do deploy/versionamento.
- A sincronizacao ClickUp usa uma rota segura da Vercel e valida o login pelo Supabase antes de buscar os dados.

## GitHub

Como a maquina nao tem GitHub CLI instalado e o Git local foi bloqueado para criar locks dentro de `.git`, crie um repositorio vazio no GitHub:

Nome sugerido: `portal-look`

Depois, envie os arquivos do projeto para esse repositorio. Nao envie:

- `.env.local`
- `node_modules`
- `dist`
- `.npm-cache`
- `work`

## Vercel

1. Abra a Vercel.
2. Clique em `Add New > Project`.
3. Importe o repositorio `portal-look`.
4. Confira:
   - Framework: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
5. Em `Environment Variables`, cadastre:

```env
VITE_SUPABASE_URL=https://wnpgawzvjdxevuweueou.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Z8ud3e334gWZtUqHwul5tg_QYEYVDUU
CLICKUP_TOKEN=cole_o_token_da_api_do_clickup
CLICKUP_FOLDER_IDS=90115200437
CLICKUP_LISTS_JSON={"lucas-fraga":"901108723170"}
```

6. Publique o deploy.

## ClickUp

A integracao real esta pronta para todos os clientes ativos do portal. No deploy, o token fica somente nas variaveis de ambiente da Vercel e a rota `/api/clickup?clientId=...` confere o usuario logado no Supabase antes de retornar planejamento, acoes e anexos.

Para cada cliente, o portal tenta encontrar a lista do ClickUp em uma destas formas:

- `CLICKUP_LISTS_JSON`, com um mapa no formato `{"lucas-fraga":"901108723170","cardiocenter":"ID_DA_LISTA"}`.
- Variaveis individuais, como `CLICKUP_LIST_CARDIOCENTER`, `CLICKUP_LIST_DANIELA_MOURA` e `CLICKUP_LIST_LUCAS_FRAGA`.
- Busca automatica dentro das pastas em `CLICKUP_FOLDER_IDS`, desde que o nome da lista no ClickUp bata com o nome do cliente.

Para testar, entre como `cecilio@lookassessoria.com` para ver todos os clientes, ou entre como cada social media para validar somente a carteira liberada. A Alessia nao deve acessar os clientes da Bianca, e a Bianca nao deve acessar os clientes da Alessia.

## Depois do deploy

Testar login com:

- `alessia@lookassessoria.com`
- `bianca@lookassessoria.com`
- `cecilio@lookassessoria.com`

Se o login falhar, conferir no Supabase se o usuario aceitou o convite, definiu senha e aparece na tabela `profiles`.
