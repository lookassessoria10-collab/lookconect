-- Dashboard comercial por cliente.
-- Rode isso no SQL editor do Supabase depois que docs/supabase-access-model.sql
-- ja tiver sido aplicado (esta tabela depende de public.clients e public.profiles).
--
-- O ADM cola ou sobe um arquivo .html pronto (com os dados do cliente) no painel,
-- o app guarda o HTML aqui e a area do cliente mostra esse HTML dentro de um
-- iframe isolado (sandbox), sem misturar CSS/JS do arquivo com o resto do portal.

create table if not exists public.commercial_dashboards (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  html text not null,
  filename text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Um dashboard comercial por cliente. Reenviar substitui o anterior.
create unique index if not exists commercial_dashboards_client_id_key
  on public.commercial_dashboards (client_id);

alter table public.commercial_dashboards enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.commercial_dashboards to authenticated;

-- Cliente ve somente o dashboard do proprio cadastro (mesma regra usada em
-- traffic_reports/planning_items: vinculo em user_client_access).
create policy "commercial_dashboards_select_by_client_access"
on public.commercial_dashboards
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = commercial_dashboards.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

-- ADM geral sempre pode publicar; ADM de carteira so pode publicar para
-- clientes vinculados a propria carteira.
create policy "commercial_dashboards_write_by_admin"
on public.commercial_dashboards
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = commercial_dashboards.client_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = commercial_dashboards.client_id)
      )
  )
);
