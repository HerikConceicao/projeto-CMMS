-- Políticas RLS aplicadas manualmente no Supabase (cmms-piloto) em 2026-10-06.
-- Rodar DEPOIS de schema.sql. users/orders_of_service já tinham políticas básicas (Fase 1).

create or replace function public.app_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case p
      when 'open_os' then perm_open_os when 'exec_os' then perm_exec_os
      when 'liberate' then perm_liberate when 'assets' then perm_assets
      when 'manage_users' then perm_manage_users when 'reports' then perm_reports
      else false end
    from public.users where auth_user_id = auth.uid() and status = 'Ativo'), false);
$$;
create or replace function public.app_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where auth_user_id = auth.uid() and status = 'Ativo');
$$;

alter table setores enable row level security;
alter table tipos_equipamento enable row level security;
alter table fabricantes enable row level security;
alter table modelos enable row level security;
alter table funcoes enable row level security;
alter table tipos_problema enable row level security;
alter table financial_settings enable row level security;
alter table role_costs enable row level security;
alter table attachments enable row level security;

-- assets: leitura p/ ativos; insert: assets|open_os|manage_users; update: qualquer ativo; delete: assets|manage_users
create policy assets_select on assets for select to authenticated using (app_active());
create policy assets_insert on assets for insert to authenticated
  with check (app_perm('assets') or app_perm('open_os') or app_perm('manage_users'));
create policy assets_update on assets for update to authenticated using (app_active()) with check (app_active());
create policy assets_delete on assets for delete to authenticated using (app_perm('assets') or app_perm('manage_users'));

-- pré-cadastros (setores, tipos_equipamento, fabricantes, modelos, funcoes, tipos_problema):
-- leitura p/ ativos; escrita: assets|manage_users
-- (repetir o par de políticas <tabela>_select / <tabela>_write para cada uma das 6 tabelas)
-- financeiro (financial_settings, role_costs): leitura p/ ativos; escrita: manage_users|reports
-- attachments: select/insert p/ ativos; delete: manage_users
create policy users_delete_requires_permission on users for delete to authenticated using (app_perm('manage_users'));

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter view setores_com_contagem set (security_invoker = true);
alter view fabricantes_com_contagem set (security_invoker = true);
alter view assets_com_contagem_os set (security_invoker = true);
alter view usuarios_com_contagem_os set (security_invoker = true);

-- =====================================================================
-- Storage de fotos (Fase 4/5) — aplicado MANUALMENTE no SQL Editor em 2026-10-06
-- =====================================================================
-- Bucket `cmms-photos`: PRIVADO, limite de 5 MB por arquivo, mime types permitidos
--   image/jpeg, image/png, image/webp. Acesso só via URL assinada (1h).
-- storage.objects (bucket_id = 'cmms-photos'): políticas de select / insert / delete
--   para `authenticated` com `app_active()` (qualquer usuário ativo e vinculado ao app).
-- attachments: policy `attachments_delete_own` — delete permitido a quem enviou
--   (`uploaded_by_id` = users.id do usuário logado) ou a quem tem manage_users
--   (substitui, na prática, a regra "delete: manage_users" descrita mais acima).
-- Caminho dos objetos: <entity_type>/<entity_id>/<uuid>.jpg
--   entity_type: 'asset' (Asset.photos) | 'os_report' (reportPhotos) | 'os_execution' (executionPhotos)
-- Nada deste bloco é executável por este arquivo; é só registro do que já existe no projeto.
