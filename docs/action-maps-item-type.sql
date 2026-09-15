-- Adiciona o tipo/formato da acao (conteudo, midia, evento, parceria...) a cada
-- item do Mapa de Acoes. Seguro rodar mesmo que a coluna ja exista.

alter table public.action_map_items
  add column if not exists item_type text;
