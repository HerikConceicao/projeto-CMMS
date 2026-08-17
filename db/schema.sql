-- ============================================================================
-- projeto-CMMS — schema Postgres (rascunho para Supabase)
--
-- Migra o modelo hoje guardado em localStorage (src/types/*.ts) para tabelas
-- relacionais reais. Convenções adotadas:
--   - timestamptz em todo campo de data/hora (evita ambiguidade de fuso).
--   - status/prioridade/tipo como text + CHECK, não enum nativo do Postgres
--     (enum exige ALTER TYPE para crescer; CHECK é mais fácil de evoluir).
--   - created_at/updated_at em toda tabela (não existiam no modelo TS, mas
--     são padrão mínimo de higiene para depuração e sync).
--   - campos hoje derivados no frontend (osCount, osCreated, osOpen, os
--     "count" de cada pré-cadastro) NÃO viram coluna — ficam como view/query
--     agregada no fim do arquivo, pra não haver dado que desincroniza.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS
-- auth_user_id referencia auth.users (Supabase Auth cuida do telefone/OTP;
-- esta tabela é só o perfil de aplicação). Permissões viraram colunas
-- booleanas individuais (em vez de JSONB) para dar pra referenciar direto
-- nas policies de RLS sem parsear JSON a cada checagem.
-- ----------------------------------------------------------------------------
create table users (
  id                uuid primary key default gen_random_uuid(),
  auth_user_id      uuid unique references auth.users (id) on delete set null,
  name              text not null,
  role              text not null check (role in ('Gestor', 'Técnico', 'Liberador', 'Operador')),
  status            text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  phone             text not null unique,
  email             text,
  perm_open_os          boolean not null default true,
  perm_exec_os           boolean not null default false,
  perm_liberate          boolean not null default false,
  perm_assets            boolean not null default false,
  perm_manage_users      boolean not null default false,
  perm_reports           boolean not null default false,
  perm_view_intelligence boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PRÉ-CADASTROS
-- Os "count" que hoje existem em Setor/TipoEquipamento/Fabricante/TipoProblema
-- somem daqui — viram COUNT(*) sob demanda (ver views no fim do arquivo).
-- ----------------------------------------------------------------------------
create table setores (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table tipos_equipamento (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table fabricantes (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table modelos (
  id               bigint generated always as identity primary key,
  name             text not null,
  manufacturer_id  bigint not null references fabricantes (id) on delete restrict,
  created_at       timestamptz not null default now(),
  unique (manufacturer_id, name)
);

-- DECISÃO DE DESIGN: hoje "Funções de Usuário" (pré-cadastro) e "Custo de Mão
-- de Obra por Função" (financeiro) são duas listas paralelas que só coincidem
-- por nome ("Técnico Júnior" aparece nas duas, sem vínculo real). Aqui elas
-- foram unificadas numa função só, com taxa horária opcional — evita a
-- duplicação frágil. Se preferir manter as duas listas separadas como hoje,
-- é só voltar a splitar em duas tabelas.
create table funcoes (
  id            bigint generated always as identity primary key,
  name          text not null unique,
  hourly_rate   numeric(10, 2),
  created_at    timestamptz not null default now()
);

create table tipos_problema (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ASSETS
-- sector/type/manufacturer/model viram FK (eram texto solto no frontend).
-- reported_by vira FK pra users em vez de nome em texto.
-- ----------------------------------------------------------------------------
create table assets (
  id                 bigint generated always as identity primary key,
  name               text not null,
  sector_id          bigint references setores (id) on delete restrict,
  asset_number       text not null unique,
  no_tag             boolean not null default false,
  reported_by_id     uuid references users (id) on delete set null,
  type_id            bigint references tipos_equipamento (id) on delete restrict,
  manufacturer_id    bigint references fabricantes (id) on delete restrict,
  model_id           bigint references modelos (id) on delete restrict,
  serial_number      text,
  location_details   text,
  criticality        text check (criticality in ('Baixa', 'Média', 'Alta', 'Crítica')),
  health_score       smallint check (health_score between 0 and 100),
  residual_value     numeric(12, 2),
  status             text not null default 'pending'
                       check (status in ('pending', 'active', 'maintenance', 'decommissioned')),
  registered_at      date not null default current_date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_assets_status on assets (status);
create index idx_assets_sector on assets (sector_id);

-- ----------------------------------------------------------------------------
-- ORDERS OF SERVICE
-- assigned_to/created_by/released_by viram FK pra users (eram nome-texto).
-- asset_name/asset_number/sector continuam como colunas de SNAPSHOT
-- (propositalmente denormalizadas): a OS deve mostrar o setor/tag que o
-- ativo tinha NO MOMENTO da abertura, mesmo que o ativo mude de setor depois
-- — é o mesmo comportamento que o frontend já tem hoje.
-- ----------------------------------------------------------------------------
create table orders_of_service (
  id                       bigint generated always as identity primary key,
  asset_id                 bigint not null references assets (id) on delete restrict,
  asset_name_snapshot      text not null,
  asset_number_snapshot    text not null,
  sector_snapshot          text not null,
  priority                 text not null check (priority in ('baixa', 'media', 'alta', 'urgente')),
  status                   text not null default 'Aberto'
                             check (status in ('Aberto', 'Em Andamento', 'Pendente Validação', 'Concluído', 'Cancelado')),
  type                     text not null check (type in ('Preventiva', 'Corretiva', 'Preditiva')),
  created_by_id            uuid not null references users (id) on delete restrict,
  assigned_to_id           uuid references users (id) on delete set null,
  released_by_id           uuid references users (id) on delete set null,
  estimated_time           text,
  description              text not null,
  is_machine_stopped       boolean not null default false,
  horimeter_start          numeric(10, 1),
  horimeter_end            numeric(10, 1),
  execution_report         text,
  release_rejection_reason text,
  labor_cost               numeric(10, 2),
  parts_cost               numeric(10, 2),
  attended_at              timestamptz,
  closed_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_os_status on orders_of_service (status);
create index idx_os_asset on orders_of_service (asset_id);
create index idx_os_assigned_to on orders_of_service (assigned_to_id);
create index idx_os_created_at on orders_of_service (created_at);

-- ----------------------------------------------------------------------------
-- ATTACHMENTS (fotos)
-- Tabela única e polimórfica em vez de 3 colunas array quase idênticas
-- (Asset.photos, OS.reportPhotos, OS.executionPhotos). storage_path aponta
-- pro objeto no Supabase Storage; a URL pública/assinada é resolvida na hora
-- de exibir, nunca guardada aqui.
-- ----------------------------------------------------------------------------
create table attachments (
  id             bigint generated always as identity primary key,
  entity_type    text not null check (entity_type in ('asset', 'os_report', 'os_execution')),
  entity_id      bigint not null,
  storage_path   text not null,
  uploaded_by_id uuid references users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index idx_attachments_entity on attachments (entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- FINANCIAL SETTINGS
-- Singleton (uma linha só) via CHECK (id = 1). budget_mensal é o único
-- campo que sobra aqui depois que "roles" virou a tabela funcoes acima.
-- ----------------------------------------------------------------------------
create table financial_settings (
  id             smallint primary key default 1 check (id = 1),
  budget_mensal  numeric(12, 2) not null default 0,
  updated_at     timestamptz not null default now()
);

insert into financial_settings (id, budget_mensal) values (1, 0);

-- ============================================================================
-- VIEWS — campos que hoje são "derivados na hora" no frontend (contagens,
-- osCreated/osOpen, etc.) viram query agregada em vez de coluna, pra nunca
-- ficar desincronizado do dado real.
-- ============================================================================

create view setores_com_contagem as
  select s.*, count(a.id) as asset_count
  from setores s
  left join assets a on a.sector_id = s.id
  group by s.id;

create view fabricantes_com_contagem as
  select f.*,
         count(distinct a.id) as asset_count,
         count(distinct m.id) as model_count
  from fabricantes f
  left join assets a on a.manufacturer_id = f.id
  left join modelos m on m.manufacturer_id = f.id
  group by f.id;

create view usuarios_com_contagem_os as
  select u.*,
         count(o.id) filter (where o.created_by_id = u.id) as os_created,
         count(o.id) filter (
           where o.assigned_to_id = u.id
             and o.status in ('Aberto', 'Em Andamento', 'Pendente Validação')
         ) as os_open
  from users u
  left join orders_of_service o
    on o.created_by_id = u.id or o.assigned_to_id = u.id
  group by u.id;

create view assets_com_contagem_os as
  select a.*, count(o.id) as os_count
  from assets a
  left join orders_of_service o on o.asset_id = a.id
  group by a.id;

-- ============================================================================
-- RLS — esboço do MECANISMO, não a lista completa de policies (isso se faz
-- tabela a tabela na próxima fase). O padrão: uma função que lê o usuário
-- logado (via auth.uid()) e devolve sua linha em `users`, usada dentro de
-- cada policy pra checar o campo perm_* relevante.
-- ============================================================================

alter table orders_of_service enable row level security;
alter table assets enable row level security;
alter table users enable row level security;

create or replace function current_app_user()
returns users
language sql stable
as $$
  select * from users where auth_user_id = auth.uid();
$$;

-- Exemplo: só quem tem perm_open_os pode criar OS; qualquer usuário
-- autenticado e ativo pode ler.
create policy "os_select_authenticated" on orders_of_service
  for select using (auth.uid() is not null);

create policy "os_insert_requires_permission" on orders_of_service
  for insert with check ((select perm_open_os from current_app_user()));

create policy "os_update_requires_permission" on orders_of_service
  for update using (
    (select perm_exec_os from current_app_user())
    or (select perm_liberate from current_app_user())
    or (select perm_manage_users from current_app_user())
  );
