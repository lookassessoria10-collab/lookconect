-- Mapa de acoes por cliente (equivalente interno ao "Mapa de Acoes Look").
-- Rode isso no SQL editor do Supabase depois que docs/supabase-access-model.sql
-- ja tiver sido aplicado (estas tabelas dependem de public.clients e public.profiles).
--
-- action_maps: um registro por cliente com o titulo/objetivo do mapa (o "no central").
-- action_map_items: os itens de cada dimensao (Objetivos, Publico-alvo, Canais,
-- Recursos, Acoes, Resultados, Riscos) exibidos ao redor do no central.
--
-- Bianca e Alessia (admin_social) criam/editam o mapa somente dos clientes da
-- propria carteira. Cecilio (admin_master) ve o andamento de todos os clientes,
-- sem editar. O cliente logado ve o proprio mapa (somente leitura) na aba Acoes.

create table if not exists public.action_maps (
  client_id uuid primary key references public.clients(id) on delete cascade,
  title text not null default '',
  subtitle text,
  layout jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.action_map_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  category text not null check (category in (
    'objetivos', 'publico_alvo', 'canais', 'recursos', 'acoes', 'resultados', 'riscos'
  )),
  title text not null,
  position integer not null default 0,
  position_x double precision,
  position_y double precision,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists action_map_items_client_category_idx
  on public.action_map_items (client_id, category, position);

alter table public.action_maps enable row level security;
alter table public.action_map_items enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.action_maps to authenticated;
grant select, insert, update, delete on public.action_map_items to authenticated;

-- Leitura: cliente ve o proprio mapa; qualquer admin com acesso ao cliente ve tambem;
-- admin_master ve todos (usado no painel de andamento do Cecilio).
create policy "action_maps_select_by_access"
on public.action_maps
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = action_maps.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "action_map_items_select_by_access"
on public.action_map_items
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = action_map_items.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

-- Escrita: admin_master sempre; admin_social somente para clientes da propria carteira.
create policy "action_maps_write_by_admin"
on public.action_maps
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
        or (p.role = 'admin_social' and a.client_id = action_maps.client_id)
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
        or (p.role = 'admin_social' and a.client_id = action_maps.client_id)
      )
  )
);

create policy "action_map_items_write_by_admin"
on public.action_map_items
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
        or (p.role = 'admin_social' and a.client_id = action_map_items.client_id)
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
        or (p.role = 'admin_social' and a.client_id = action_map_items.client_id)
      )
  )
);
