# Criar usuarios clientes no Supabase

Este processo cria os acessos restantes dos clientes da Look seguindo o padrao de e-mail usado no teste.

## Importante

Use a chave secreta do Supabase somente no `.env.local` da sua maquina. Nao coloque essa chave no GitHub, na Vercel como variavel publica, nem dentro do codigo do frontend.

Para ambiente real, troque a senha padrao depois dos testes.

## E-mails criados pelo script

- `daniela@lookassessoria.com` -> Daniela Moura
- `faturemais@lookassessoria.com` -> Fature Mais
- `luanda@lookassessoria.com` -> Luanda
- `sobramid@lookassessoria.com` -> Sobramid
- `rodrigo@lookassessoria.com` -> Rodrigo da Guarda
- `lazzo@lookassessoria.com` -> Lazzo Matumbi
- `marcelo@lookassessoria.com` -> Marcelo Midlej
- `rose@lookassessoria.com` -> Rose Meire
- `senge@lookassessoria.com` -> Senge
- `prime@lookassessoria.com` -> Prime Esthetics
- `serenity@lookassessoria.com` -> Serenity
- `isabor@lookassessoria.com` -> Isabor

Senha padrao de todos: `123456`.

## Como rodar

No `.env.local`, adicione:

```env
SUPABASE_URL=https://wnpgawzvjdxevuweueou.supabase.co
SUPABASE_SECRET_KEY=cole_a_chave_secreta_do_supabase
DEFAULT_CLIENT_PASSWORD=123456
```

Depois rode:

```bash
npm run supabase:create-client-users
```

O script e idempotente: se o usuario ja existir, ele atualiza a senha, confirma o e-mail, ajusta o perfil e refaz o vinculo com o cliente certo.

## Conferir

Rode no SQL Editor do Supabase:

```sql
select
  u.email,
  p.full_name,
  p.role,
  c.name as cliente,
  a.access_level
from auth.users u
left join public.profiles p on p.id = u.id
left join public.user_client_access a on a.user_id = u.id
left join public.clients c on c.id = a.client_id
where u.email like '%@lookassessoria.com'
order by u.email, c.name;
```
