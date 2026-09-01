# Configuracao manual do Supabase

O conector do Supabase no Codex nao conseguiu acessar o projeto `wnpgawzvjdxevuweueou` neste ambiente. Para seguir sem travar, aplique o modelo pelo painel:

1. Abra o projeto no Supabase.
2. Entre em `SQL Editor`.
3. Cole o conteudo de `docs/supabase-access-model.sql`.
4. Rode o SQL.
5. Crie/convidar os usuarios em `Authentication > Users`:
   - alessia@lookassessoria.com
   - bianca@lookassessoria.com
   - cecilio@lookassessoria.com
6. Depois que os usuarios existirem, rode novamente apenas o bloco final do arquivo, a partir de:
   `insert into public.profiles`

## Ambiente local

Como o projeto usa Vite, as variaveis publicas precisam ter prefixo `VITE_`:

```env
VITE_SUPABASE_URL=https://wnpgawzvjdxevuweueou.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
```

Na Vercel, cadastre essas duas variaveis com os mesmos nomes. A `service_role` deve ficar somente em rotas de backend, nunca no frontend.
