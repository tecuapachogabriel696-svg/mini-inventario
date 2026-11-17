-- Día 4: tabla productos con Row Level Security (docs/diseno.md).
-- Cada usuario solo puede leer, crear, editar y borrar sus propios productos.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  sku text not null check (sku ~ '^[A-Za-z0-9-]+$'),
  cantidad integer not null check (cantidad >= 0),
  minimo integer not null check (minimo >= 5),
  created_at timestamptz not null default now(),
  -- SKU único por usuario. También sirve como índice para filtrar por user_id.
  constraint productos_user_sku_unico unique (user_id, sku)
);

alter table public.productos enable row level security;

-- (select auth.uid()) se evalúa una sola vez por consulta y no por cada fila.
create policy "productos: leer los propios"
  on public.productos for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "productos: crear los propios"
  on public.productos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "productos: editar los propios"
  on public.productos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "productos: borrar los propios"
  on public.productos for delete
  to authenticated
  using ((select auth.uid()) = user_id);
