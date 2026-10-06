# Plano de migração: localStorage → Supabase

Rascunho de como sair do `AppContext` baseado em `useLocalStorage` (src/context/AppContext.tsx) para o schema em `db/schema.sql`, sem quebrar o app no meio do caminho. Nenhuma linha de código de produto foi alterada ainda — isto é só o roteiro.

## Princípio geral: migrar por trás da mesma interface

`AppContext` hoje expõe `{ setores, setSetores, ordersOfService, setOrdersOfService, ... }` para todas as telas. Em vez de reescrever cada tela que chama `useAppContext()`, a estratégia é trocar o **interior** do `AppContext` (de `useLocalStorage` para hooks do Supabase) mantendo a mesma forma de saída sempre que possível. Isso reduz boa parte da "migração tela por tela" a "migração entidade por entidade dentro do Context" — só as telas com comportamento genuinamente novo (fotos, autenticação, tempo real) precisam de mudança própria na tela.

**Pré-requisito de arquitetura (confirmado)**: adotar [TanStack Query](https://tanstack.com/query) para cache/refetch/mutação em vez de state cru. Sem isso, cada tela reimplementa loading/error/refetch na mão.

## Fase 0 — Infraestrutura (nenhuma tela ainda)

- [x] Instalar `@supabase/supabase-js` + `@tanstack/react-query`
- [x] `QueryClientProvider` conectado em `src/main.tsx` (ainda sem nenhuma query — só infraestrutura)
- [x] `src/lib/supabaseClient.ts` criado (não importado por nenhuma tela ainda; só passa a ser usado a partir da Fase 1)
- [x] `.env.example` + `.gitignore` atualizado para nunca commitar `.env`
- [x] `db/seed_reference_data.sql` — seed das 6 tabelas de referência (setores, tipos, fabricantes, modelos, funções, tipos de problema), espelhando `src/data/seed/*.ts` com os mesmos ids
- [x] **Resolvido**: `Funcao` (pré-cadastro) e `RoleCost` (financeiro) ficam como duas listas separadas, igual ao frontend hoje — não serão fundidas
- [ ] **Depende de você**: criar o projeto no painel do Supabase, aplicar `db/schema.sql` e depois `db/seed_reference_data.sql` no SQL Editor (ou via CLI), copiar `.env.example` para `.env` com a URL/chave reais
- [ ] Gerar types TS do schema (`supabase gen types typescript`) — só é possível depois que o projeto real existir

## Fase 1 — Autenticação e Usuários (bloqueia tudo, vai primeiro) — CONCLUÍDA

Toda tela depende de `currentUser`. Enquanto login não for real, nenhuma outra fase pode ir para produção multi-usuário.

**Mudança de escopo em relação ao rascunho original**: trocamos OTP por SMS
(`supabase.auth.signInWithOtp({ phone })`) por **e-mail + senha**
(`supabase.auth.signInWithPassword` / `signUp`). Motivo: OTP por SMS exige
contratar um provedor (Twilio etc.) fora do Supabase, com custo e setup que
não fazem sentido pra um piloto interno agora. O campo `email` já existia no
cadastro de usuário (`UserFormModal`), só não era usado para login. Dá pra
trocar para SMS depois, é uma troca pontual, não estrutural.

Checklist desta fase:

- [x] RLS em `public.users` (select para autenticados; insert/update exigem `perm_manage_users`)
- [x] Trigger `on_auth_user_created` → `link_auth_user()`: no primeiro `signUp` com um e-mail que já existe em `public.users` (criado pelo Gestor sem `auth_user_id`), vincula automaticamente a conta real criada
- [x] `AppContext`: `currentUser`/`users`/`setUsers` migrados de `useLocalStorage` para sessão real do Supabase Auth + TanStack Query sobre `public.users`; `login`/`signUpFirstAccess`/`logout` novos
- [x] `LoginScreen`: reescrita com abas "Entrar" / "Primeiro acesso" (e-mail+senha), removido o código fixo `1234` e os botões de bypass demo
- [x] `ManageUsersScreen`: removido `nextUserId` (o banco gera o id); `UserFormModal` não precisou mudar (já tinha e-mail opcional e já omitia `id` no save)
- [x] `users.id` corrigido de `uuid` para `bigint generated always as identity` (e FKs de `assets.reported_by_id`, `attachments.uploaded_by_id`, `orders_of_service.created_by_id/assigned_to_id/released_by_id` ajustadas junto, views `assets_com_contagem_os`/`usuarios_com_contagem_os` recriadas). Rodado manualmente por segurança (classificador bloqueou a execução automática por ter vários DROP numa query só); confirmado via consulta que os 6 campos agora são `bigint`, as 2 views e as 5 FKs existem, e `users.id` está com identity ativa.
- [x] Testado fim a fim: primeiro usuário (Herik, Gestor, `perm_manage_users=true`) inserido via SQL direto (bootstrap — não dá pra criar o primeiro usuário pela tela, já que ela exige alguém logado com permissão); depois fez "Primeiro acesso" com o mesmo e-mail e entrou no dashboard normalmente, `currentUser` resolvendo certo. Próximos usuários (equipe) já podem ser cadastrados pela tela "Gerenciar Usuários" normalmente, pois agora existe um Gestor logado.
- [x] Confirmado: `npm run dev` compila sem erros no Mac e a nova tela de login (abas "Entrar"/"Primeiro acesso") renderiza corretamente

**Risco**: alto (é o ponto de entrada do app). **Trabalho**: médio.

## Fase 2 — Pré-cadastros (primeiro alvo real de CRUD, baixo risco) — CONCLUÍDA

Setores, Tipos de Equipamento, Fabricantes, Modelos, Funções, Tipos de Problema.

- [x] `AppContext`: as 6 listas migradas de `useLocalStorage` para TanStack Query sobre `setores`/`tipos_equipamento`/`fabricantes`/`modelos`/`funcoes`/`tipos_problema`, mesmo padrão (query key por tabela + `setX` que diffa prev/next por id, faz insert/update/delete e invalida) de `users`/`assets`/`ordersOfService`.
- [x] `Modelo.manufacturerId` já era um id local (não um nome), então virou `manufacturer_id` direto no insert/update — sem precisar de `resolveIdByName` como em Ativos/OS.
- [x] `PreRegistrationScreen`, `CatalogTab`, `ModelosTab`: nenhuma mudança necessária — só trocam `onAdd/onRename/onDelete` chamando os mesmos `setSetores`/`setTipos`/.../`setProblemas` de sempre, que agora gravam no banco por trás.
- [x] **Resolvido o "problema de FK por nome" anotado na Fase 4**: `AssetRefs` (usado por `mapDbAsset`/`toDbAssetFields`) agora recebe as linhas reais vindas do banco (`setores`/`tipos`/`fabricantes`/`modelos`), então a resolução de `sector_id`/`type_id`/`manufacturer_id`/`model_id` deixou de depender de coincidência entre o seed local e o seed do banco.
- [x] **Contagens (`count`/`modelCount`)**: `setores_com_contagem`/`fabricantes_com_contagem` (views do schema) não foram usadas — como `assets` já estava carregado no mesmo Context, foi mais simples recalcular `count` (setores/tipos/fabricantes, por nome) e `modelCount` (fabricantes, via `modelos`) em memória a partir de `assets`/`modelos`, sem precisar de uma query a mais. Mesma decisão simplificadora do `osCount` na Fase 4.
- [ ] **Deferido / comportamento mudou de propósito**: `funcoes.count` e `tipos_problema.count` ficam fixos em `0` — não existe, no modelo atual, nenhuma relação real que os popule (nenhuma tela liga `User` a `Funcao`, nem `OrderOfService` a `TipoProblema`; os números do seed antigo eram decorativos). Efeito colateral: a tela de Funções não bloqueia mais a exclusão de uma função "em uso" (antes bloqueava com base num número de seed estático, nunca com um vínculo de verdade) — não é uma regressão de dado real, só a perda de uma trava que já era falsa.

**Risco**: baixo (tela isolada, sem tempo real, sem storage). **Trabalho**: pequeno — bom primeiro PR real.

## Fase 3 — Configurações Financeiras — CONCLUÍDA

- [x] `AppContext`: `financialSettings`/`setFinancialSettings` migrados de `useLocalStorage` para duas queries TanStack (`['financial_settings']` lendo o singleton `id = 1`, e `['role_costs']`), compostas no mesmo shape `FinancialSettings` (`roles[].id = String(row.id)`). Interface pública do Context inalterada — `FinancialSettingsScreen`, `RoleCostManager`, `IntelligencePanelScreen`/`financeSeries` não precisaram mudar (só um `useEffect` em `FinancialSettingsScreen` pra manter o campo de orçamento em dia com o valor vindo do banco).
- [x] `setFinancialSettings` (aceita valor ou updater) diffa prev/next: mudança de orçamento faz **upsert** em `financial_settings` `{ id: 1, budget_mensal, updated_at }` (`onConflict: 'id'`), porque a linha singleton pode ainda não existir; funções removidas → `delete` por id; alteradas (nome/valor-hora) → `update` por id; funções novas → `insert { name, hourly_rate }`.
- [x] Ids novos x existentes: funções criadas na tela têm id gerado no cliente (slug, ver `nextRoleId`) — qualquer id que não esteja em `prev` (ids vindos do banco, numéricos) é tratado como insert e o id do cliente nunca vai pro banco; update/delete só usam ids que estão em `prev` e são numéricos.
- [x] Falhas de gravação: `console.error` + aviso fixo (mesmo `PhotoSyncAlert`); violação de unicidade em `role_costs.name` (23505) mostra "Já existe uma função com esse nome.". Após qualquer escrita as queries são invalidadas, então a UI volta ao estado real do banco.
- [x] **Nenhum dado demo é inserido automaticamente**: sem linha em `financial_settings` o orçamento é `0`, sem funções a lista é vazia. Os valores reais são cadastrados pela tela (`seedFinancialSettings` em `src/data/seed` ficou só como referência, não é mais importado; `STORAGE_KEYS.financialSettings` removido).
- [x] Realtime: `financial_settings` e `role_costs` adicionados ao mapa do canal `cmms-db-changes`.
- Obs.: `laborCost`/`partsCost` das OS são valores informados na baixa (não são calculados a partir de `role_costs`), então a migração não os afeta.

**Risco**: baixo.

## Fase 4 — Ativos (Gestão de Ativos, Reportar Ativo, Wizard de Validação) — CONCLUÍDA (com ressalvas)

- [x] **Mudança de modelo**: `provisionalAssets`/`validatedAssets` (dois arrays em localStorage) viraram um único `assets: Asset[]` + `setAssets` no `AppContext` (TanStack Query sobre a tabela `assets`, mesmo padrão de `users` da Fase 1). `AssetManagementScreen` agora deriva `validatedAssets`/`provisionalAssets` filtrando por `status` em vez de ler dois arrays.
- [x] `AssetValidationWizard`: o passo final não remove de um array e insere em outro — faz `setAssets((prev) => prev.map(...))` atualizando o mesmo registro (`status: 'active'`), que o `AppContext` traduz num `UPDATE` real.
- [x] `ReportAssetScreen`: novo ativo entra via `setAssets((prev) => [...prev, novoAtivo])`; `reported_by_id` é setado no insert com `currentUser.id` (não tenta casar o nome de `reportedBy` contra `users`).
- [x] Geração de TAG (`generateAssetTag`/`isAssetTagTaken`): passou a receber a lista `assets` (agora vinda do banco) em vez dos arrays antigos — já é "contra o banco" na prática, já que `assets` é o resultado da query.
- [x] Resolução de `sector_id`/`type_id`/`manufacturer_id`/`model_id`: `Asset` continua guardando esses campos como NOME (texto), sem mudar o shape público do tipo. `AppContext` resolve o id casando o nome contra `setores`/`tipos`/`fabricantes`/`modelos` (ainda em localStorage, Fase 2/3) com `resolveIdByName`/`nameFromId`; sem match, cai pra `null`/`undefined` com `console.warn`, não lança erro.
- [x] **Fotos (`Asset.photos`)**: persistidas no Storage (bucket privado `cmms-photos`) + linha em `attachments` (`entity_type = 'asset'`). Ver "Design das fotos" abaixo. Sobrevivem a reload e aparecem em outros dispositivos.
- [ ] **PENDENTE — limpeza de órfãos**: excluir um ativo (`setAssets` removendo o item) apaga a linha em `assets`, mas não apaga as linhas de `attachments` (sem FK) nem os objetos no Storage.
- [ ] **NÃO FEITO (fragilidade conhecida) — resolução de FK por nome**: a resolução de `sector`/`type`/`manufacturer`/`model` por nome (item acima) só funciona porque os ids do seed local (`src/data/seed/*.ts`) e os ids de `db/seed_reference_data.sql` coincidem hoje. Qualquer edição de pré-cadastro que desalinhe esses ids quebra a resolução silenciosamente (cai pro `console.warn` + `null`). **Recomendação: migrar a Fase 2 (pré-cadastros) a seguir**, pra esses virarem ids reais vindos do banco e eliminar essa dependência de coincidência.
- [x] Correção lateral: `asset_number` é `unique` no banco; um ativo "sem etiqueta" (TAG vazia) agora grava um placeholder único (`SEM-TAG-<timestamp>-<random>`) em vez de string vazia, pra não colidir com outro ativo sem etiqueta já existente.

**Risco**: médio-alto (mudança de modelo + storage). **Trabalho**: grande. **Pendências**: fragilidade de FK-por-nome e limpeza de fotos órfãs — ver itens acima.

## Fase 5 — Ordens de Serviço (núcleo: Abrir OS, Lista de OS, Gestão de OS) — CONCLUÍDA (com ressalvas)

- [x] `ordersOfService` (array em localStorage) virou `ordersOfService: OrderOfService[]` + `setOrdersOfService` sobre a tabela `orders_of_service`, mesmo padrão de `users`/`assets`.
- [x] `OpenOSScreen`: passo de identificação do ativo já consulta `assets` (agora vindo da API via `AppContext`, não mudou nada na tela além do nome da fonte).
- [x] `created_by_id` (NOT NULL): setado no insert com `currentUser.id` — `OpenOSScreen` é o único fluxo de criação de OS e sempre é o usuário logado, então não precisou de nenhuma mudança na tela.
- [x] `assigned_to_id`: mapeia direto de `assignedTo` (já é um id de usuário).
- [x] `released_by_id`: **não** assume que é sempre o `currentUser` — `CloseOSModal` (baixa manual, em `ManageOSScreen`) deixa escolher qualquer usuário com permissão de liberar num `<select>`, que pode ser diferente de quem está logado. Por isso `released_by_id` é resolvido casando o nome em `releasedBy` contra a lista `users` (`resolveUserIdByName`), e não com `currentUser.id` fixo. No fluxo de `MachineReleaseScreen` (liberação normal), `releasedBy` já é sempre o nome do `currentUser`, então o resultado é o mesmo.
- [x] `assetName`/`assetNumber`/`sector` (snapshot): mapeiam direto pras colunas `*_snapshot`, sem lookup de FK.
- [x] Grep final em `ManageOSScreen`, `OSListScreen`, `MachineReleaseScreen`, `TechnicianPanelScreen`, `TechnicianExecutionScreen`, `AuditScreen`, `ManageUsersScreen`, `Dashboard`, `IntelligencePanelScreen`: nenhuma dessas telas precisou de alteração — todas só liam/escreviam `ordersOfService`/`setOrdersOfService` pelo nome, que não mudou.
- [x] **Fotos (`reportPhotos`/`executionPhotos`)**: persistidas no Storage + `attachments` (`entity_type = 'os_report'` / `'os_execution'`), mesmo mecanismo dos ativos. Ver "Design das fotos" abaixo.
- [ ] **PENDENTE — limpeza de órfãos**: excluir uma OS não apaga suas linhas em `attachments` nem os objetos no Storage.
- [ ] **PENDENTE — retry de upload**: se o upload de uma foto falha, o registro (ativo/OS) já está salvo e o usuário é avisado por um banner (`PhotoSyncAlert`), mas a foto é perdida — não há UI para reenviar, nem fila offline.
- [ ] **NÃO FEITO (adiado de propósito, conforme plano original)**: paginação/filtro server-side em `OSListScreen`/`ManageOSScreen` (continuam `.filter()` em memória sobre a lista inteira) e **Realtime** do Supabase (gestor não vê OS nova aparecer sem dar refresh). Nenhuma das duas é regressão — é o mesmo comportamento de antes, só que agora sobre dados reais do banco.

**Risco**: médio (tabela mais usada do sistema, mas sem mudança de modelo). **Trabalho**: grande. **Pendências**: paginação/filtro server-side, Realtime, limpeza de fotos órfãs e retry de upload — ver itens acima.


### Design das fotos (Fases 4 e 5)

- **Armazenamento**: bucket `cmms-photos` privado (5 MB/arquivo; jpeg/png/webp), caminho `<entity_type>/<entity_id>/<uuid>.jpg`; cada foto tem uma linha em `attachments` (`entity_type`: `asset` → `Asset.photos`, `os_report` → `OrderOfService.reportPhotos`, `os_execution` → `executionPhotos`; `entity_id` = `assets.id` / `orders_of_service.id`, sem FK).
- **Leitura**: uma única query `['attachments']` (paginada em 1000) + `createSignedUrls` em lote com validade de 1h; as URLs ficam em cache e só são renovadas quando restam <20 min (refetch a cada 10 min), então o `<img src>` não troca a cada refetch. O `AppContext` agrupa por `entity_type`+`entity_id` e preenche `photos`/`reportPhotos`/`executionPhotos` com as URLs; as telas continuam tratando tudo como `string` em `<img src>`.
- **Escrita**: a tela segue usando data URLs em estado local (wizards inalterados). Em `setAssets`/`setOrdersOfService`, o registro é salvo primeiro (insert com `.select('id')` para obter o id real) e só então as strings `data:` são comprimidas (canvas, lado maior ≤ 1280px, JPEG q≈0.72), enviadas e registradas em `attachments` com `uploaded_by_id = currentUser.id`. URLs `http` (já persistidas) não são reenviadas; foto persistida que saiu do array é removida (linha em `attachments` primeiro — o RLS só deixa quem enviou/`manage_users` —, depois o objeto).
- **Falhas**: nunca bloqueiam nem desfazem o salvamento do registro; cada foto que falha é logada (`console.error`) e o usuário vê um banner persistente (`PhotoSyncAlert`) dizendo quantas fotos não foram salvas.

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


## Segurança (RLS) — aplicado em 2026-10-06
- Auditoria encontrou: `assets` com RLS ligada e **zero políticas** (toda gravação seria negada) e 9 tabelas com RLS desligada + grants totais para `anon` (chave pública no bundle do navegador = leitura/escrita/exclusão por qualquer pessoa).
- Corrigido: RLS ligada em todas as 12 tabelas, políticas por permissão (`app_perm()`/`app_active()`), grants de `anon` revogados, views com `security_invoker`. Resumo em `db/policies.sql` (aplicado manualmente no SQL Editor; o arquivo é referência resumida, não um dump completo).
- [ ] Pendente: política de DELETE em `orders_of_service` (hoje ninguém exclui OS; só cancela) e revisão fina de quem pode editar ativos.


## Ideias para depois (backlog de produto)
- **Abrir OS lendo o QR Code do ativo com a câmera** (sugestão do Herik, 2026-10-06). Ler o QR já resolve o passo "identificar ativo"; se existir OS aberta (Aberto / Em Andamento / Pendente Validação) para o ativo, mostrar aviso com nº, status e responsável, com "Ver essa OS" como ação principal e "Abrir outra mesmo assim" como secundária; sem OS aberta, ir direto para os detalhes do problema. Manter busca manual (etiqueta danificada / "sem etiqueta").
  - Base existente: `AssetDetailModal` já gera QR (`qrcode.react`, valor = `assetNumber`); `QrFinishScanStep` já existe na execução do técnico (verificar se lê câmera de verdade ou é simulado).
  - Pré-requisitos: app publicado em HTTPS (câmera exige), Realtime ligado (aviso de OS aberta confiável entre aparelhos). Avaliar trocar o conteúdo do QR por URL (`.../ativo/<assetNumber>`) para a câmera nativa do celular abrir o app direto.
  - Testar leitura em condições reais (pouca luz, etiqueta suja).


## Realtime — aplicado em 2026-10-06
- SQL (manual): `alter publication supabase_realtime add table orders_of_service, assets, attachments, users, setores, tipos_equipamento, fabricantes, modelos, funcoes, tipos_problema;`
- `AppContext.tsx`: um canal `cmms-db-changes` assina `postgres_changes` dessas tabelas e invalida a query correspondente (técnico conclui OS num aparelho → liberador vê no outro sem refresh). Respeita RLS de SELECT.
- [ ] Testar entre dois aparelhos/navegadores (não verificado ainda). [x] `financial_settings`/`role_costs` já estão no mapa do canal (Fase 3). [ ] **Pendente (manual)**: `alter publication supabase_realtime add table financial_settings, role_costs;`

- [x] (2026-10-06) `alter publication supabase_realtime add table financial_settings, role_costs;` aplicado — Realtime cobre todas as tabelas do app.
