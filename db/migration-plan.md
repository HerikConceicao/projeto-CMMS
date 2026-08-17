# Plano de migração: localStorage → Supabase

Rascunho de como sair do `AppContext` baseado em `useLocalStorage` (src/context/AppContext.tsx) para o schema em `db/schema.sql`, sem quebrar o app no meio do caminho. Nenhuma linha de código de produto foi alterada ainda — isto é só o roteiro.

## Princípio geral: migrar por trás da mesma interface

`AppContext` hoje expõe `{ setores, setSetores, ordersOfService, setOrdersOfService, ... }` para todas as telas. Em vez de reescrever cada tela que chama `useAppContext()`, a estratégia é trocar o **interior** do `AppContext` (de `useLocalStorage` para hooks do Supabase) mantendo a mesma forma de saída sempre que possível. Isso reduz boa parte da "migração tela por tela" a "migração entidade por entidade dentro do Context" — só as telas com comportamento genuinamente novo (fotos, autenticação, tempo real) precisam de mudança própria na tela.

**Pré-requisito de arquitetura**: adotar [TanStack Query](https://tanstack.com/query) para cache/refetch/mutação em vez de state cru. Sem isso, cada tela reimplementa loading/error/refetch na mão. Isto é uma decisão a bater antes da Fase 0.

## Fase 0 — Infraestrutura (nenhuma tela ainda)

- Criar projeto Supabase, aplicar `db/schema.sql`
- Gerar types TS do schema (`supabase gen types typescript`)
- Instalar `@supabase/supabase-js` + `@tanstack/react-query`
- Variáveis de ambiente (`.env`, `.env.example`) — hoje o projeto não tem nenhuma
- Seed das tabelas de referência (setores, tipos, fabricantes, modelos, funções, tipos de problema) a partir dos arrays hoje em `src/data/seed/*.ts`, via SQL ou script de migração único
- **Decisão pendente**: confirmar a fusão `Funcao` + `RoleCost` numa tabela só (proposta no schema, ainda sem seu aval)

## Fase 1 — Autenticação e Usuários (bloqueia tudo, vai primeiro)

Toda tela depende de `currentUser`. Enquanto login não for real, nenhuma outra fase pode ir para produção multi-usuário.

- `LoginScreen`: trocar OTP fixo (`1234`) por `supabase.auth.signInWithOtp({ phone })` real
- `AppContext`: `currentUser` passa a vir da sessão Supabase + join na tabela `users`, não de um `currentUserId` em localStorage
- `ManageUsersScreen` / `UserFormModal`: **atenção aqui** — hoje o Gestor pode pré-cadastrar um usuário (nome+telefone+permissões) antes dele nunca ter logado. Com Supabase Auth por telefone, o registro em `auth.users` só nasce no primeiro OTP verificado daquele número. Solução: o Gestor continua criando a linha em `public.users` (telefone + perfil) sem `auth_user_id`; no primeiro login bem-sucedido daquele telefone, um trigger (ou a própria app) vincula `auth_user_id` à linha existente por telefone. Precisa ser resolvido nesta fase, não depois.
- Permissões: `perm_*` passam a vir do banco; a UI (`PermissionLabels`) não muda, só a fonte do dado

**Risco**: alto (é o ponto de entrada do app). **Trabalho**: médio.

## Fase 2 — Pré-cadastros (primeiro alvo real de CRUD, baixo risco)

Setores, Tipos de Equipamento, Fabricantes, Modelos, Funções, Tipos de Problema.

- `PreRegistrationScreen`, `CatalogTab`, `ModelosTab`: trocar `onAdd/onRename/onDelete` de setters locais para mutations do Supabase
- Os "count" que hoje ficam no objeto (`setor.count`) desaparecem — a tela passa a ler das views `*_com_contagem` do schema
- Serve para validar o padrão de hook (query + mutation + invalidação de cache) que todas as fases seguintes replicam

**Risco**: baixo (tela isolada, sem tempo real, sem storage). **Trabalho**: pequeno — bom primeiro PR real.

## Fase 3 — Configurações Financeiras

- `FinancialSettingsScreen`, `RoleCostManager`: mesma mecânica da Fase 2, sobre `funcoes` (ou `role_costs`, a depender da decisão pendente) + `financial_settings` (singleton)

**Risco**: baixo. **Trabalho**: pequeno. Pode andar em paralelo com a Fase 2.

## Fase 4 — Ativos (Gestão de Ativos, Reportar Ativo, Wizard de Validação)

Primeira fase que mexe em Storage e em uma mudança de modelo de fato:

- **Mudança de modelo**: hoje `provisionalAssets` e `validatedAssets` são dois arrays separados no localStorage. No schema novo é uma tabela `assets` só, com `status`. `AssetManagementScreen` precisa trocar "duas listas" por "um filtro de status" — isso é uma reestruturação real da tela, não só troca de fonte de dado.
- `AssetValidationWizard`: o passo final ("mover de provisório pra validado") vira um `UPDATE assets SET status = 'active', ...` em vez de remover de um array e inserir em outro
- `ReportAssetScreen`, `PhotoCapture`, os passos do wizard que usam fotos: trocar "guardar base64 no array" por upload real pro Supabase Storage + gravar `storage_path` em `attachments`
- Geração de TAG (`generateAssetTag`) precisa checar unicidade contra o banco, não contra um array em memória

**Risco**: médio-alto (mudança de modelo + storage). **Trabalho**: grande.

## Fase 5 — Ordens de Serviço (núcleo: Abrir OS, Lista de OS, Gestão de OS)

- `OpenOSScreen`: passo de identificação do ativo passa a consultar `assets` via API em vez de array local
- `OSListScreen`, `ManageOSScreen`: paginação/filtro server-side em vez de `.filter()` em memória (a tabela cresce sem limite num backend real, diferente do array fixo de hoje)
- Bom candidato a **Realtime** do Supabase: gestores olhando `ManageOSScreen` deveriam ver novas OSs aparecerem sem dar refresh

**Risco**: médio (tabela mais usada do sistema, mas sem mudança de modelo). **Trabalho**: grande.

## Fase 6 — Execução do Técnico e Liberação de Máquina

As duas telas mais "tempo real" do sistema — o valor de sair do localStorage aparece mais aqui do que em qualquer outro lugar.

- `TechnicianPanelScreen`: fila filtrada por `assigned_to_id = current_user`, com Realtime pra atualizar se o gestor reatribuir
- `TechnicianExecutionScreen`: o `useEffect` que grava `attendedAt` vira um `UPDATE` real na primeira execução (hoje é só `setOrdersOfService`)
- `MachineReleaseScreen`: fila de "Pendente Validação" com Realtime — é exatamente o cenário que motivou a migração (técnico conclui num aparelho, liberador vê na hora em outro)

**Risco**: médio. **Trabalho**: médio, mas é onde a Realtime paga o investimento.

## Fase 7 — Relatórios (Painel de Inteligência, Auditoria)

Diferente das fases anteriores, aqui não é só trocar a fonte do dado — a lógica de cálculo também muda:

- `src/utils/kpis.ts`, `auditMetrics.ts`, `financeSeries.ts`, `assetReplacement.ts` hoje recebem o array inteiro de OSs em memória e calculam em JS. Num banco real, isso deveria virar agregação SQL (`COUNT`, `AVG`, `date_trunc` por mês) — mais rápido e não trafega a tabela inteira pro cliente. As views já esboçadas em `db/schema.sql` cobrem parte disso; o resto vira queries agregadas ad hoc.
- `IndicatorsManualScreen`, `FinancialSettingsScreen` (aninhada aqui): sem mudança de lógica, só a fonte do orçamento

**Risco**: baixo pra funcionalidade, mas é a maior reescrita de lógica (não só de plumbing) do plano inteiro. Deixar por último de propósito: só compensa reescrever pra SQL depois que o volume real de dados existir.

## Fase 8 — Dashboard e telas restantes

`Dashboard`, `PlaceholderScreen`, wiring do `App.tsx` — migra quase de graça conforme as fases anteriores completam, já que só orquestra o que já foi trocado.

## Resumo — ordem recomendada

| Fase | Escopo | Risco | Motivo da ordem |
|---|---|---|---|
| 0 | Infra Supabase | — | pré-requisito |
| 1 | Auth + Usuários | Alto | bloqueia todo o resto |
| 2 | Pré-cadastros | Baixo | valida o padrão, baixo risco |
| 3 | Config. Financeiras | Baixo | mesmo padrão da Fase 2 |
| 4 | Ativos | Médio-alto | primeira mudança de modelo + storage |
| 5 | OS (núcleo) | Médio | tabela mais usada |
| 6 | Técnico + Liberação | Médio | Realtime paga o investimento aqui |
| 7 | Relatórios | Baixo/reescrita | reescreve cálculo pra SQL, sem pressa |
| 8 | Dashboard | — | migra por consequência |

Cada fase = um branch, testado no navegador do mesmo jeito que os módulos do SPEC foram, e só depois commitado — mesmo fluxo já validado nesta sessão.
