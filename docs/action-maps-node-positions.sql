-- Deixa o Mapa de Acoes dinamico: guarda a posicao de cada no arrastado no canvas.
-- Rode isso depois de docs/action-maps-schema.sql (seguro rodar mesmo que essas
-- colunas ja existam - o IF NOT EXISTS nao falha nem apaga dado).

alter table public.action_map_items
  add column if not exists position_x double precision,
  add column if not exists position_y double precision;

-- Posicao de cada no de categoria (Objetivos, Publico-alvo, Canais, Recursos,
-- Acoes, Resultados, Riscos) para o cliente, como { "objetivos": {"x":..,"y":..}, ... }.
alter table public.action_maps
  add column if not exists layout jsonb;
