# Deploy GitHub + Vercel

O projeto esta pronto para subir como Vite na Vercel.

## Status atual

- Build local aprovado com `npm run build`.
- Supabase configurado no app com URL e publishable key.
- `.env.local`, `node_modules`, `dist`, cache e pasta `work` ficam fora do deploy/versionamento.
- A sincronizacao ClickUp foi mantida apenas em localhost ate existir uma rota autenticada por Supabase.

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
```

6. Publique o deploy.

## Depois do deploy

Testar login com:

- `alessia@lookassessoria.com`
- `bianca@lookassessoria.com`
- `cecilio@lookassessoria.com`

Se o login falhar, conferir no Supabase se o usuario aceitou o convite, definiu senha e aparece na tabela `profiles`.
