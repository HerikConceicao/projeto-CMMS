import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  clearSignedUrlCache,
  deletePhoto,
  fetchAttachmentsWithUrls,
  isDataUrl,
  storagePathFromSignedUrl,
  uploadPhoto,
  type AttachmentEntityType,
  type AttachmentWithUrl,
} from '../lib/photoStorage';
import { PhotoSyncAlert } from '../components/ui/PhotoSyncAlert';
import { useLocalStorage, type SetStoredValue } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/storageKeys';
import type {
  Asset,
  AssetCriticality,
  AssetStatus,
  Fabricante,
  FinancialSettings,
  Funcao,
  Modelo,
  OrderOfService,
  OSPriority,
  OSStatus,
  OSType,
  RoleCost,
  Setor,
  TipoEquipamento,
  TipoProblema,
  User,
} from '../types';

// Linha de public.users (snake_case) + o vínculo com auth.users, que não faz
// parte do shape `User` usado pelas telas.
interface DbUser extends User {
  authUserId: string | null;
}

function mapDbUser(row: Record<string, unknown>): DbUser {
  return {
    id: row.id as number,
    name: row.name as string,
    role: row.role as User['role'],
    status: row.status as User['status'],
    phone: row.phone as string,
    email: (row.email as string | null) ?? undefined,
    permissions: {
      openOS: row.perm_open_os as boolean,
      execOS: row.perm_exec_os as boolean,
      liberate: row.perm_liberate as boolean,
      assets: row.perm_assets as boolean,
      manageUsers: row.perm_manage_users as boolean,
      reports: row.perm_reports as boolean,
      viewIntelligence: row.perm_view_intelligence as boolean,
    },
    authUserId: (row.auth_user_id as string | null) ?? null,
  };
}

function toDbUser(u: Omit<User, 'id' | 'osCreated' | 'osOpen'>) {
  return {
    name: u.name,
    role: u.role,
    status: u.status,
    phone: u.phone,
    email: u.email ?? null,
    perm_open_os: u.permissions.openOS,
    perm_exec_os: u.permissions.execOS,
    perm_liberate: u.permissions.liberate,
    perm_assets: u.permissions.assets,
    perm_manage_users: u.permissions.manageUsers,
    perm_reports: u.permissions.reports,
    perm_view_intelligence: u.permissions.viewIntelligence ?? false,
  };
}

async function fetchUsers(): Promise<DbUser[]> {
  const { data, error } = await supabase.from('users').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapDbUser);
}

function authErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail (verifique sua caixa de entrada) antes de entrar.';
  }
  if (message.includes('User already registered')) {
    return 'Já existe uma conta com esse e-mail. Use "Entrar" em vez de criar uma nova.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  return message;
}

// ---- Resolução de FK por nome (Ativos) -------------------------------
// `Asset` guarda sector/type/manufacturer/model como NOME (texto), não como
// id — pra não precisar mudar o shape público do tipo nem as telas que o
// consomem. Essas funções fazem a ponte com as colunas *_id do banco,
// casando pelo nome contra as listas de pré-cadastro já carregadas no
// Context (agora vindas do banco, Fase 2 — ver seção abaixo).
interface NamedRef {
  id: number;
  name: string;
}

function resolveIdByName(name: string | undefined, list: NamedRef[]): number | null {
  if (!name) return null;
  const match = list.find((item) => item.name === name);
  if (!match) {
    console.warn(`Resolução de FK por nome falhou: "${name}" não encontrado na lista de referência.`);
    return null;
  }
  return match.id;
}

function nameFromId(id: number | null | undefined, list: NamedRef[]): string | undefined {
  if (id === null || id === undefined) return undefined;
  const match = list.find((item) => item.id === id);
  if (!match) {
    console.warn(`Resolução de nome por id falhou: id ${id} não encontrado na lista de referência.`);
    return undefined;
  }
  return match.name;
}

function resolveUserIdByName(name: string | undefined, users: User[]): number | null {
  if (!name) return null;
  const match = users.find((u) => u.name === name);
  if (!match) {
    console.warn(`Resolução de usuário por nome falhou: "${name}" não encontrado.`);
    return null;
  }
  return match.id;
}

function nameOrUndef(v: unknown): string | undefined {
  return v === null || v === undefined ? undefined : (v as string);
}

function numOrUndef(v: unknown): number | undefined {
  return v === null || v === undefined ? undefined : Number(v);
}

// Tag de inventário vazia (ativo "sem etiqueta") não pode virar string vazia
// repetida no banco — asset_number é `unique`. Gera um placeholder estável
// e que nunca colide com uma TAG real gerada por `generateAssetTag`
// (sempre termina em letra, então a regex `/(\d+)$/` nunca bate nele).
function placeholderAssetNumber(): string {
  return `SEM-TAG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}x`;
}

// ---- Ativos (Fase 4) --------------------------------------------------
// `AssetRefs` só precisa de {id, name} pra resolver FK por nome — por isso
// usa `NamedRef[]` (não os tipos públicos `Setor[]`/`TipoEquipamento[]`/...),
// o que permite passar tanto as linhas "cruas" do banco (pré-contagem) quanto
// as listas decoradas com `count` sem fricção de tipos.
interface AssetRefs {
  setores: NamedRef[];
  tipos: NamedRef[];
  fabricantes: NamedRef[];
  modelos: NamedRef[];
}

async function fetchAssetRows(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('assets').select('*').order('id');
  if (error) throw error;
  return data ?? [];
}

function mapDbAsset(
  row: Record<string, unknown>,
  refs: AssetRefs,
  users: User[],
  photos: string[] | undefined,
): Asset {
  const reportedById = row.reported_by_id as number | null;
  return {
    id: row.id as number,
    name: row.name as string,
    sector: nameFromId(row.sector_id as number | null, refs.setores) ?? '',
    assetNumber: row.asset_number as string,
    reportedBy: reportedById != null ? users.find((u) => u.id === reportedById)?.name : undefined,
    type: nameFromId(row.type_id as number | null, refs.tipos),
    manufacturer: nameFromId(row.manufacturer_id as number | null, refs.fabricantes),
    model: nameFromId(row.model_id as number | null, refs.modelos),
    serialNumber: nameOrUndef(row.serial_number),
    locationDetails: nameOrUndef(row.location_details),
    criticality: (row.criticality as AssetCriticality | null) ?? undefined,
    healthScore: numOrUndef(row.health_score),
    residualValue: numOrUndef(row.residual_value),
    // URLs assinadas vindas de `attachments` (ver photoStorage.ts); undefined até chegarem.
    photos,
    status: row.status as AssetStatus,
    date: row.registered_at as string,
    // osCount (derivado) fica indefinido por ora, mesmo precedente de
    // osCreated/osOpen em `users` na Fase 1 — ver migration-plan.md.
    osCount: undefined,
    noTag: row.no_tag as boolean,
  };
}

function toDbAssetFields(a: Omit<Asset, 'id' | 'osCount' | 'reportedBy'>, refs: AssetRefs) {
  return {
    name: a.name,
    sector_id: resolveIdByName(a.sector, refs.setores),
    asset_number: a.assetNumber.trim() ? a.assetNumber.trim() : placeholderAssetNumber(),
    no_tag: a.noTag ?? false,
    type_id: resolveIdByName(a.type, refs.tipos),
    manufacturer_id: resolveIdByName(a.manufacturer, refs.fabricantes),
    model_id: resolveIdByName(a.model, refs.modelos),
    serial_number: a.serialNumber ?? null,
    location_details: a.locationDetails ?? null,
    criticality: a.criticality ?? null,
    health_score: a.healthScore ?? null,
    residual_value: a.residualValue ?? null,
    status: a.status,
    registered_at: a.date,
  };
}

// ---- Ordens de Serviço (Fase 5) --------------------------------------
async function fetchOrderOfServiceRows(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('orders_of_service').select('*').order('id');
  if (error) throw error;
  return data ?? [];
}

function mapDbOrderOfService(
  row: Record<string, unknown>,
  users: User[],
  reportPhotos: string[] | undefined,
  executionPhotos: string[] | undefined,
): OrderOfService {
  const createdById = row.created_by_id as number | null;
  const releasedById = row.released_by_id as number | null;
  return {
    id: row.id as number,
    assetId: row.asset_id as number,
    assetName: row.asset_name_snapshot as string,
    assetNumber: row.asset_number_snapshot as string,
    sector: row.sector_snapshot as string,
    priority: row.priority as OSPriority,
    status: row.status as OSStatus,
    createdAt: row.created_at as string,
    createdBy: (createdById != null ? users.find((u) => u.id === createdById)?.name : undefined) ?? 'Desconhecido',
    assignedTo: numOrUndef(row.assigned_to_id),
    type: row.type as OSType,
    estimatedTime: nameOrUndef(row.estimated_time),
    description: row.description as string,
    attendedAt: nameOrUndef(row.attended_at),
    reportPhotos,
    isMachineStopped: row.is_machine_stopped as boolean,
    horimeterStart: numOrUndef(row.horimeter_start),
    horimeterEnd: numOrUndef(row.horimeter_end),
    executionReport: nameOrUndef(row.execution_report),
    executionPhotos,
    closedAt: nameOrUndef(row.closed_at),
    releasedBy: releasedById != null ? users.find((u) => u.id === releasedById)?.name : undefined,
    laborCost: numOrUndef(row.labor_cost),
    partsCost: numOrUndef(row.parts_cost),
    releaseRejectionReason: nameOrUndef(row.release_rejection_reason),
  };
}

// created_by_id é NOT NULL e nunca muda após a abertura da OS — por isso
// não entra aqui; é setado só no insert (currentUser.id, ver setOrdersOfService).
function toDbOrderOfServiceFields(
  os: Omit<OrderOfService, 'id' | 'createdAt' | 'createdBy'>,
  users: User[],
) {
  return {
    asset_id: os.assetId,
    asset_name_snapshot: os.assetName,
    asset_number_snapshot: os.assetNumber,
    sector_snapshot: os.sector,
    priority: os.priority,
    status: os.status,
    type: os.type,
    assigned_to_id: os.assignedTo ?? null,
    // releasedBy é sempre o nome de exibição de quem liberou/baixou a OS —
    // na tela de Liberação é sempre o currentUser, mas na baixa manual
    // (CloseOSModal) pode ser outro usuário escolhido num <select>, então
    // resolvemos por nome contra `users` em vez de assumir currentUser.
    released_by_id: resolveUserIdByName(os.releasedBy, users),
    estimated_time: os.estimatedTime ?? null,
    description: os.description,
    attended_at: os.attendedAt ?? null,
    is_machine_stopped: os.isMachineStopped,
    horimeter_start: os.horimeterStart ?? null,
    horimeter_end: os.horimeterEnd ?? null,
    execution_report: os.executionReport ?? null,
    release_rejection_reason: os.releaseRejectionReason ?? null,
    labor_cost: os.laborCost ?? null,
    parts_cost: os.partsCost ?? null,
    closed_at: os.closedAt ?? null,
  };
}

// ---- Fotos (Storage + attachments) -------------------------------------
// `photos`/`reportPhotos`/`executionPhotos` continuam sendo string[] usáveis em
// <img src>: data URL = foto nova ainda não enviada; URL assinada (http...) =
// foto já persistida em `attachments`. Ver src/lib/photoStorage.ts.
function photoKey(entityType: AttachmentEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

function groupPhotoUrls(rows: AttachmentWithUrl[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const key = photoKey(row.entityType, row.entityId);
    const list = grouped.get(key);
    if (list) list.push(row.url);
    else grouped.set(key, [row.url]);
  }
  return grouped;
}

function photosEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

interface PhotoSyncResult {
  attempted: boolean;
  uploadFailed: number;
  removeFailed: number;
}

// Reconcilia as fotos de uma entidade já gravada no banco (precisa do id real):
// data URL → upload + linha em attachments; foto persistida (URL assinada) que
// saiu do array → apaga; URL assinada que continua no array → não faz nada.
// Nunca lança: falhas são contadas (e logadas) para o chamador avisar o usuário.
async function syncEntityPhotos(
  entityType: AttachmentEntityType,
  entityId: number,
  prevPhotos: string[] | undefined,
  nextPhotos: string[] | undefined,
  rows: AttachmentWithUrl[],
  uploadedById: number | null,
): Promise<PhotoSyncResult> {
  const next = nextPhotos ?? [];
  const keptPaths = new Set(
    next.map((photo) => storagePathFromSignedUrl(photo)).filter((path): path is string => path !== null),
  );
  const removedPaths = new Set(
    (prevPhotos ?? [])
      .map((photo) => storagePathFromSignedUrl(photo))
      .filter((path): path is string => path !== null && !keptPaths.has(path)),
  );
  const toRemove = rows.filter(
    (row) => row.entityType === entityType && row.entityId === entityId && removedPaths.has(row.storagePath),
  );
  const toUpload = next.filter(isDataUrl);

  const result: PhotoSyncResult = {
    attempted: toRemove.length > 0 || toUpload.length > 0,
    uploadFailed: 0,
    removeFailed: 0,
  };

  const removals = await Promise.allSettled(toRemove.map((row) => deletePhoto(row)));
  result.removeFailed = removals.filter((r) => r.status === 'rejected').length;

  const uploads = await Promise.allSettled(
    toUpload.map((dataUrl) => uploadPhoto(entityType, entityId, dataUrl, uploadedById)),
  );
  result.uploadFailed = uploads.filter((r) => r.status === 'rejected').length;

  return result;
}

// ---- Pré-cadastros (Fase 2) --------------------------------------------
// Setores, Tipos de Equipamento, Fabricantes, Funções e Tipos de Problema são
// tabelas simples (id + name); Modelos tem também manufacturer_id (FK real
// pro banco, não por nome — `Modelo.manufacturerId` já era um id no tipo
// local, então não precisou de resolução por nome como em Ativos/OS).
// Os campos derivados do tipo público (`count`/`modelCount`) não existem
// como coluna (ver db/schema.sql, seção PRÉ-CADASTROS) — são recalculados
// mais abaixo a partir de `assets`, já carregado no Context, no mesmo
// espírito do `osCount` da Fase 4. Exceção: `funcoes`/`tipos_problema` não
// têm nenhuma relação real no modelo atual (nenhuma tela liga `User` a
// `Funcao`, nem `OrderOfService` a `TipoProblema`), então o `count` deles
// fica fixo em 0 — ver nota em migration-plan.md.
async function fetchRefTable(table: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

function mapRefRow(row: Record<string, unknown>): NamedRef {
  return { id: row.id as number, name: row.name as string };
}

function toRefFields(item: { name: string }) {
  return { name: item.name };
}

function mapDbModelo(row: Record<string, unknown>): Modelo {
  return {
    id: row.id as number,
    name: row.name as string,
    manufacturerId: row.manufacturer_id as number,
  };
}

function toDbModelo(m: { name: string; manufacturerId: number }) {
  return { name: m.name, manufacturer_id: m.manufacturerId };
}

// ---- Configurações Financeiras (Fase 3) --------------------------------
// `financial_settings` é um singleton (id = 1) que pode ainda não existir —
// nesse caso o orçamento é 0. `role_costs` vira `FinancialSettings.roles`;
// o id numérico do banco é exposto como string (`RoleCost.id` é string).
async function fetchFinancialSettingsRow(): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from('financial_settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchRoleCostRows(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('role_costs').select('*').order('id');
  if (error) throw error;
  return data ?? [];
}

function mapDbRoleCost(row: Record<string, unknown>): RoleCost {
  return {
    id: String(row.id),
    name: row.name as string,
    hourlyRate: Number(row.hourly_rate),
  };
}

function toDbRoleCost(r: { name: string; hourlyRate: number }) {
  return { name: r.name.trim(), hourly_rate: r.hourlyRate };
}

function financialErrorMessage(error: { code?: string } | null, action: string): string {
  // 23505 = unique_violation (role_costs.name é unique)
  if (error?.code === '23505') return 'Já existe uma função com esse nome.';
  return `Configurações financeiras: não foi possível ${action}.`;
}

interface AppContextValue {
  isDesktopMode: boolean;
  setIsDesktopMode: SetStoredValue<boolean>;

  setores: Setor[];
  setSetores: SetStoredValue<Setor[]>;

  tipos: TipoEquipamento[];
  setTipos: SetStoredValue<TipoEquipamento[]>;

  fabricantes: Fabricante[];
  setFabricantes: SetStoredValue<Fabricante[]>;

  modelos: Modelo[];
  setModelos: SetStoredValue<Modelo[]>;

  funcoes: Funcao[];
  setFuncoes: SetStoredValue<Funcao[]>;

  problemas: TipoProblema[];
  setProblemas: SetStoredValue<TipoProblema[]>;

  assets: Asset[];
  setAssets: SetStoredValue<Asset[]>;

  ordersOfService: OrderOfService[];
  setOrdersOfService: SetStoredValue<OrderOfService[]>;

  users: User[];
  setUsers: SetStoredValue<User[]>;

  financialSettings: FinancialSettings;
  setFinancialSettings: SetStoredValue<FinancialSettings>;

  currentUser: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signUpFirstAccess: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [isDesktopMode, setIsDesktopMode] = useLocalStorage(STORAGE_KEYS.isDesktopMode, false);

  // ---- Autenticação real (Supabase Auth) + tabela users (Fase 1) ----------
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) clearSignedUrlCache();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });
    return () => subscription.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: qualquer mudança nas tabelas do app (feita por qualquer aparelho)
  // invalida a query correspondente, e as telas abertas se atualizam sozinhas.
  // O Supabase Realtime respeita as políticas RLS de SELECT de cada tabela.
  const realtimeUserId = session?.user.id;
  useEffect(() => {
    if (!realtimeUserId) return;
    const tableToQueryKey: Record<string, string> = {
      orders_of_service: 'ordersOfService',
      assets: 'assets',
      attachments: 'attachments',
      users: 'users',
      setores: 'setores',
      tipos_equipamento: 'tipos_equipamento',
      fabricantes: 'fabricantes',
      modelos: 'modelos',
      funcoes: 'funcoes',
      tipos_problema: 'tipos_problema',
      financial_settings: 'financial_settings',
      role_costs: 'role_costs',
    };
    let channel = supabase.channel('cmms-db-changes');
    for (const table of Object.keys(tableToQueryKey)) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        void queryClient.invalidateQueries({ queryKey: [tableToQueryKey[table]] });
      });
    }
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[realtime] canal com problema:', status, err);
      }
    });
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeUserId]);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!session,
  });

  const rawUsers = usersQuery.data ?? [];
  const users: User[] = rawUsers.map(({ authUserId: _authUserId, ...u }) => u);
  const currentUser = session
    ? (rawUsers.find((u) => u.authUserId === session.user.id) ?? null)
    : null;

  const setUsers: SetStoredValue<User[]> = (updater) => {
    const prev = users;
    const next = updater instanceof Function ? updater(prev) : updater;

    const prevIds = new Set(prev.map((u) => u.id));
    const nextIds = new Set(next.map((u) => u.id));

    void (async () => {
      for (const u of prev) {
        if (!nextIds.has(u.id)) {
          await supabase.from('users').delete().eq('id', u.id);
        }
      }
      for (const u of next) {
        if (!prevIds.has(u.id)) {
          const { id: _discardedTempId, ...rest } = u;
          await supabase.from('users').insert(toDbUser(rest));
        } else {
          const before = prev.find((p) => p.id === u.id);
          if (before && JSON.stringify(before) !== JSON.stringify(u)) {
            await supabase.from('users').update(toDbUser(u)).eq('id', u.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    })();
  };

  // ---- Pré-cadastros (Fase 2) ---------------------------------------------
  // Queries "cruas" (sem contagem) — usadas tanto pra resolução de FK dos
  // Ativos (`assetRefs`, abaixo) quanto como base das listas decoradas com
  // `count`/`modelCount` expostas no Context (depois que `assets` existir).
  const setoresQuery = useQuery({
    queryKey: ['setores'],
    queryFn: () => fetchRefTable('setores'),
    enabled: !!session,
  });
  const tiposQuery = useQuery({
    queryKey: ['tipos_equipamento'],
    queryFn: () => fetchRefTable('tipos_equipamento'),
    enabled: !!session,
  });
  const fabricantesQuery = useQuery({
    queryKey: ['fabricantes'],
    queryFn: () => fetchRefTable('fabricantes'),
    enabled: !!session,
  });
  const modelosQuery = useQuery({
    queryKey: ['modelos'],
    queryFn: () => fetchRefTable('modelos'),
    enabled: !!session,
  });
  const funcoesQuery = useQuery({
    queryKey: ['funcoes'],
    queryFn: () => fetchRefTable('funcoes'),
    enabled: !!session,
  });
  const problemasQuery = useQuery({
    queryKey: ['tipos_problema'],
    queryFn: () => fetchRefTable('tipos_problema'),
    enabled: !!session,
  });

  const setoresRows: NamedRef[] = (setoresQuery.data ?? []).map(mapRefRow);
  const tiposRows: NamedRef[] = (tiposQuery.data ?? []).map(mapRefRow);
  const fabricantesRows: NamedRef[] = (fabricantesQuery.data ?? []).map(mapRefRow);
  const modelosRows: Modelo[] = (modelosQuery.data ?? []).map(mapDbModelo);
  const funcoesRows: NamedRef[] = (funcoesQuery.data ?? []).map(mapRefRow);
  const problemasRows: NamedRef[] = (problemasQuery.data ?? []).map(mapRefRow);

  // ---- Ativos (Fase 4) ---------------------------------------------------
  // Antes eram dois arrays em localStorage (provisionalAssets/validatedAssets);
  // agora é uma tabela só, filtrada por `status` nas telas que precisam da
  // distinção (ver AssetManagementScreen).
  const assetRefs: AssetRefs = {
    setores: setoresRows,
    tipos: tiposRows,
    fabricantes: fabricantesRows,
    modelos: modelosRows,
  };

  const assetsQuery = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssetRows,
    enabled: !!session,
  });

  // Fotos (Fase 4/5): uma query só para TODAS as linhas de `attachments` + URLs
  // assinadas em lote (sem request por ativo/OS). As URLs são reaproveitadas do
  // cache enquanto tiverem >20 min de validade, então os refetches (staleTime
  // curto, p/ fotos de outros dispositivos aparecerem) não trocam o <img src>;
  // o refetchInterval garante renovação antes das 1h de validade. Ativos/OS
  // renderizam sem esperar por ela (photos = undefined até chegar).
  const attachmentsQuery = useQuery({
    queryKey: ['attachments'],
    queryFn: fetchAttachmentsWithUrls,
    enabled: !!session,
    staleTime: 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
  const attachmentRows = attachmentsQuery.data;
  const photosByEntity = useMemo(() => groupPhotoUrls(attachmentRows ?? []), [attachmentRows]);

  // Avisos de falha ao salvar/remover fotos (exibidos por <PhotoSyncAlert/>).
  const [photoNotices, setPhotoNotices] = useState<string[]>([]);
  const pushPhotoNotice = (message: string) => setPhotoNotices((prev) => [...prev, message]);

  // Sincroniza as fotos de uma entidade e avisa o usuário se algo falhou.
  // Devolve true se tentou algo (para o chamador invalidar ['attachments']).
  const syncPhotos = async (
    entityType: AttachmentEntityType,
    entityId: number,
    subject: string,
    photoLabel: string,
    prevPhotos: string[] | undefined,
    nextPhotos: string[] | undefined,
  ): Promise<boolean> => {
    const result = await syncEntityPhotos(
      entityType,
      entityId,
      prevPhotos,
      nextPhotos,
      attachmentRows ?? [],
      currentUser?.id ?? null,
    );
    if (result.uploadFailed > 0) {
      pushPhotoNotice(
        `${subject}: o registro foi salvo, mas ${result.uploadFailed} ${photoLabel} não puderam ser enviadas e não foram salvas.`,
      );
    }
    if (result.removeFailed > 0) {
      pushPhotoNotice(
        `${subject}: ${result.removeFailed} ${photoLabel} não puderam ser removidas e continuarão aparecendo.`,
      );
    }
    return result.attempted;
  };

  const rawAssetRows = assetsQuery.data ?? [];
  const assets: Asset[] = rawAssetRows.map((row) =>
    mapDbAsset(row, assetRefs, users, photosByEntity.get(photoKey('asset', row.id as number))),
  );

  const setAssets: SetStoredValue<Asset[]> = (updater) => {
    const prev = assets;
    const next = updater instanceof Function ? updater(prev) : updater;

    const prevIds = new Set(prev.map((a) => a.id));
    const nextIds = new Set(next.map((a) => a.id));

    void (async () => {
      let photosTouched = false;
      // Exclusão de ativo: as fotos em attachments/Storage não são limpas ainda
      // (pendência — ver migration-plan.md).
      for (const a of prev) {
        if (!nextIds.has(a.id)) {
          await supabase.from('assets').delete().eq('id', a.id);
        }
      }
      for (const a of next) {
        if (!prevIds.has(a.id)) {
          const { id: _discardedTempId, osCount: _discardedOsCount, reportedBy: _discardedReportedBy, ...rest } = a;
          // O ativo recém-reportado é sempre reportado pelo usuário logado
          // (quem preenche ReportAssetScreen) — não dá pra derivar isso do
          // nome em `reportedBy`, então usamos currentUser.id direto aqui.
          const { data, error } = await supabase
            .from('assets')
            .insert({
              ...toDbAssetFields(rest, assetRefs),
              reported_by_id: currentUser?.id ?? null,
            })
            .select('id')
            .single();
          if (error || !data) {
            console.error('Falha ao inserir ativo:', error);
            if (a.photos && a.photos.length > 0) {
              pushPhotoNotice(`Ativo "${a.name}": não foi possível salvar o ativo, então as fotos também não foram salvas.`);
            }
            continue;
          }
          // O banco gera o id real; o id local (a.id) era só provisório.
          if (await syncPhotos('asset', data.id as number, `Ativo "${a.name}"`, 'fotos', undefined, a.photos)) {
            photosTouched = true;
          }
        } else {
          const before = prev.find((p) => p.id === a.id);
          if (!before) continue;
          const { photos: _beforePhotos, ...beforeFields } = before;
          const { photos: _nextPhotos, ...nextFields } = a;
          const photosChanged = !photosEqual(before.photos, a.photos);
          if (JSON.stringify(beforeFields) !== JSON.stringify(nextFields)) {
            // reported_by_id não entra aqui de propósito: o repórter original
            // nunca é reescrito numa atualização (só no insert, acima).
            const { error } = await supabase.from('assets').update(toDbAssetFields(a, assetRefs)).eq('id', a.id);
            if (error) {
              console.error('Falha ao atualizar ativo:', error);
              if (photosChanged) {
                pushPhotoNotice(`Ativo "${a.name}": não foi possível salvar as alterações, então as fotos também não foram salvas.`);
              }
              continue;
            }
          }
          if (photosChanged && (await syncPhotos('asset', a.id, `Ativo "${a.name}"`, 'fotos', before.photos, a.photos))) {
            photosTouched = true;
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (photosTouched) await queryClient.invalidateQueries({ queryKey: ['attachments'] });
    })();
  };

  // Listas decoradas com `count`/`modelCount`, calculadas agora que `assets`
  // já existe (ver comentário na definição de `fetchRefTable` acima).
  const setores: Setor[] = setoresRows.map((s) => ({
    ...s,
    count: assets.filter((a) => a.sector === s.name).length,
  }));
  const tipos: TipoEquipamento[] = tiposRows.map((t) => ({
    ...t,
    count: assets.filter((a) => a.type === t.name).length,
  }));
  const fabricantes: Fabricante[] = fabricantesRows.map((f) => ({
    ...f,
    count: assets.filter((a) => a.manufacturer === f.name).length,
    modelCount: modelosRows.filter((m) => m.manufacturerId === f.id).length,
  }));
  const modelos: Modelo[] = modelosRows;
  // Sem relação real no modelo atual (ver comentário acima) — `count` fica
  // fixo em 0, não bloqueando mais exclusão por esse motivo (antes a
  // exclusão de uma função "ocupada" era bloqueada por um número de seed
  // estático, nunca por um vínculo de verdade).
  const funcoes: Funcao[] = funcoesRows.map((f) => ({ ...f, count: 0 }));
  const problemas: TipoProblema[] = problemasRows.map((p) => ({ ...p, count: 0 }));

  const setSetores: SetStoredValue<Setor[]> = (updater) => {
    const prev = setores;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((s) => s.id));
    const nextIds = new Set(next.map((s) => s.id));
    void (async () => {
      for (const s of prev) {
        if (!nextIds.has(s.id)) {
          await supabase.from('setores').delete().eq('id', s.id);
        }
      }
      for (const s of next) {
        if (!prevIds.has(s.id)) {
          await supabase.from('setores').insert(toRefFields(s));
        } else {
          const before = prev.find((p) => p.id === s.id);
          if (before && before.name !== s.name) {
            await supabase.from('setores').update(toRefFields(s)).eq('id', s.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['setores'] });
    })();
  };

  const setTipos: SetStoredValue<TipoEquipamento[]> = (updater) => {
    const prev = tipos;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((t) => t.id));
    const nextIds = new Set(next.map((t) => t.id));
    void (async () => {
      for (const t of prev) {
        if (!nextIds.has(t.id)) {
          await supabase.from('tipos_equipamento').delete().eq('id', t.id);
        }
      }
      for (const t of next) {
        if (!prevIds.has(t.id)) {
          await supabase.from('tipos_equipamento').insert(toRefFields(t));
        } else {
          const before = prev.find((p) => p.id === t.id);
          if (before && before.name !== t.name) {
            await supabase.from('tipos_equipamento').update(toRefFields(t)).eq('id', t.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['tipos_equipamento'] });
    })();
  };

  const setFabricantes: SetStoredValue<Fabricante[]> = (updater) => {
    const prev = fabricantes;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((f) => f.id));
    const nextIds = new Set(next.map((f) => f.id));
    void (async () => {
      for (const f of prev) {
        if (!nextIds.has(f.id)) {
          await supabase.from('fabricantes').delete().eq('id', f.id);
        }
      }
      for (const f of next) {
        if (!prevIds.has(f.id)) {
          await supabase.from('fabricantes').insert(toRefFields(f));
        } else {
          const before = prev.find((p) => p.id === f.id);
          if (before && before.name !== f.name) {
            await supabase.from('fabricantes').update(toRefFields(f)).eq('id', f.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['fabricantes'] });
    })();
  };

  const setModelos: SetStoredValue<Modelo[]> = (updater) => {
    const prev = modelos;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((m) => m.id));
    const nextIds = new Set(next.map((m) => m.id));
    void (async () => {
      for (const m of prev) {
        if (!nextIds.has(m.id)) {
          await supabase.from('modelos').delete().eq('id', m.id);
        }
      }
      for (const m of next) {
        if (!prevIds.has(m.id)) {
          await supabase.from('modelos').insert(toDbModelo(m));
        } else {
          const before = prev.find((p) => p.id === m.id);
          if (before && (before.name !== m.name || before.manufacturerId !== m.manufacturerId)) {
            await supabase.from('modelos').update(toDbModelo(m)).eq('id', m.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['modelos'] });
    })();
  };

  const setFuncoes: SetStoredValue<Funcao[]> = (updater) => {
    const prev = funcoes;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((f) => f.id));
    const nextIds = new Set(next.map((f) => f.id));
    void (async () => {
      for (const f of prev) {
        if (!nextIds.has(f.id)) {
          await supabase.from('funcoes').delete().eq('id', f.id);
        }
      }
      for (const f of next) {
        if (!prevIds.has(f.id)) {
          await supabase.from('funcoes').insert(toRefFields(f));
        } else {
          const before = prev.find((p) => p.id === f.id);
          if (before && before.name !== f.name) {
            await supabase.from('funcoes').update(toRefFields(f)).eq('id', f.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['funcoes'] });
    })();
  };

  const setProblemas: SetStoredValue<TipoProblema[]> = (updater) => {
    const prev = problemas;
    const next = updater instanceof Function ? updater(prev) : updater;
    const prevIds = new Set(prev.map((p) => p.id));
    const nextIds = new Set(next.map((p) => p.id));
    void (async () => {
      for (const p of prev) {
        if (!nextIds.has(p.id)) {
          await supabase.from('tipos_problema').delete().eq('id', p.id);
        }
      }
      for (const p of next) {
        if (!prevIds.has(p.id)) {
          await supabase.from('tipos_problema').insert(toRefFields(p));
        } else {
          const before = prev.find((b) => b.id === p.id);
          if (before && before.name !== p.name) {
            await supabase.from('tipos_problema').update(toRefFields(p)).eq('id', p.id);
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['tipos_problema'] });
    })();
  };

  // ---- Ordens de Serviço (Fase 5) ----------------------------------------
  const osQuery = useQuery({
    queryKey: ['ordersOfService'],
    queryFn: fetchOrderOfServiceRows,
    enabled: !!session,
  });

  const rawOSRows = osQuery.data ?? [];
  const ordersOfService: OrderOfService[] = rawOSRows.map((row) =>
    mapDbOrderOfService(
      row,
      users,
      photosByEntity.get(photoKey('os_report', row.id as number)),
      photosByEntity.get(photoKey('os_execution', row.id as number)),
    ),
  );

  const setOrdersOfService: SetStoredValue<OrderOfService[]> = (updater) => {
    const prev = ordersOfService;
    const next = updater instanceof Function ? updater(prev) : updater;

    const prevIds = new Set(prev.map((o) => o.id));
    const nextIds = new Set(next.map((o) => o.id));

    void (async () => {
      let photosTouched = false;
      // Sincroniza os dois conjuntos de fotos de uma OS já gravada.
      const syncOSPhotos = async (osId: number, before: OrderOfService | undefined, after: OrderOfService) => {
        const subject = `OS #${osId}`;
        const report = await syncPhotos('os_report', osId, subject, 'fotos da falha', before?.reportPhotos, after.reportPhotos);
        const execution = await syncPhotos('os_execution', osId, subject, 'fotos da execução', before?.executionPhotos, after.executionPhotos);
        if (report || execution) photosTouched = true;
      };
      const hasPhotos = (os: OrderOfService) =>
        (os.reportPhotos?.length ?? 0) > 0 || (os.executionPhotos?.length ?? 0) > 0;

      // Exclusão de OS: as fotos em attachments/Storage não são limpas ainda
      // (pendência — ver migration-plan.md).
      for (const o of prev) {
        if (!nextIds.has(o.id)) {
          await supabase.from('orders_of_service').delete().eq('id', o.id);
        }
      }
      for (const o of next) {
        if (!prevIds.has(o.id)) {
          const { id: _discardedTempId, createdAt: _discardedCreatedAt, createdBy: _discardedCreatedBy, ...rest } = o;
          // Quem abre a OS é sempre o usuário logado (OpenOSScreen não deixa
          // escolher outro criador) — usamos currentUser.id direto, sem
          // tentar casar o nome de `createdBy` contra `users`.
          const { data, error } = await supabase
            .from('orders_of_service')
            .insert({
              ...toDbOrderOfServiceFields(rest, users),
              created_by_id: currentUser?.id ?? null,
            })
            .select('id')
            .single();
          if (error || !data) {
            console.error('Falha ao inserir OS:', error);
            if (hasPhotos(o)) {
              pushPhotoNotice('Não foi possível salvar a OS, então as fotos anexadas também não foram salvas.');
            }
            continue;
          }
          // O banco gera o id real; o id local (o.id) era só provisório.
          await syncOSPhotos(data.id as number, undefined, o);
        } else {
          const before = prev.find((p) => p.id === o.id);
          if (!before) continue;
          const { reportPhotos: _br, executionPhotos: _be, ...beforeFields } = before;
          const { reportPhotos: _nr, executionPhotos: _ne, ...nextFields } = o;
          const photosChanged =
            !photosEqual(before.reportPhotos, o.reportPhotos) ||
            !photosEqual(before.executionPhotos, o.executionPhotos);
          if (JSON.stringify(beforeFields) !== JSON.stringify(nextFields)) {
            // created_by_id não entra aqui de propósito: o criador original
            // nunca é reescrito numa atualização (só no insert, acima).
            const { error } = await supabase
              .from('orders_of_service')
              .update(toDbOrderOfServiceFields(o, users))
              .eq('id', o.id);
            if (error) {
              console.error('Falha ao atualizar OS:', error);
              if (photosChanged) {
                pushPhotoNotice(`OS #${o.id}: não foi possível salvar as alterações, então as fotos também não foram salvas.`);
              }
              continue;
            }
          }
          if (photosChanged) await syncOSPhotos(o.id, before, o);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['ordersOfService'] });
      if (photosTouched) await queryClient.invalidateQueries({ queryKey: ['attachments'] });
    })();
  };

  // ---- Configurações Financeiras (Fase 3) --------------------------------
  // Duas queries compostas no mesmo shape `FinancialSettings` de antes. Sem
  // linha em `financial_settings` / sem funções cadastradas: orçamento 0 e
  // lista vazia (nada de dados demo é inserido no banco pelo cliente).
  const financialSettingsQuery = useQuery({
    queryKey: ['financial_settings'],
    queryFn: fetchFinancialSettingsRow,
    enabled: !!session,
  });
  const roleCostsQuery = useQuery({
    queryKey: ['role_costs'],
    queryFn: fetchRoleCostRows,
    enabled: !!session,
  });

  const financialSettings: FinancialSettings = {
    budgetMensal: Number(financialSettingsQuery.data?.budget_mensal ?? 0),
    roles: (roleCostsQuery.data ?? []).map(mapDbRoleCost),
  };

  const setFinancialSettings: SetStoredValue<FinancialSettings> = (updater) => {
    const prev = financialSettings;
    const next = updater instanceof Function ? updater(prev) : updater;

    const prevIds = new Set(prev.roles.map((r) => r.id));
    const nextIds = new Set(next.roles.map((r) => r.id));

    void (async () => {
      const notices = new Set<string>();
      let settingsTouched = false;
      let rolesTouched = false;

      // O singleton pode ainda não existir → upsert (não update).
      if (next.budgetMensal !== prev.budgetMensal) {
        settingsTouched = true;
        const { error } = await supabase
          .from('financial_settings')
          .upsert({ id: 1, budget_mensal: next.budgetMensal, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (error) {
          console.error('Falha ao salvar orçamento mensal:', error);
          notices.add(financialErrorMessage(error, 'salvar o orçamento mensal'));
        }
      }

      // Só ids presentes em `prev` vêm do banco (numéricos). Funções novas
      // criadas na tela têm id gerado no cliente (slug) — nunca vão pro
      // banco: viram insert e o banco gera o id real.
      for (const r of prev.roles) {
        if (!nextIds.has(r.id) && /^\d+$/.test(r.id)) {
          rolesTouched = true;
          const { error } = await supabase.from('role_costs').delete().eq('id', Number(r.id));
          if (error) {
            console.error('Falha ao remover função:', error);
            notices.add(financialErrorMessage(error, 'remover a função'));
          }
        }
      }
      for (const r of next.roles) {
        if (!prevIds.has(r.id)) {
          rolesTouched = true;
          const { error } = await supabase.from('role_costs').insert(toDbRoleCost(r));
          if (error) {
            console.error('Falha ao inserir função:', error);
            notices.add(financialErrorMessage(error, 'salvar a função'));
          }
        } else if (/^\d+$/.test(r.id)) {
          const before = prev.roles.find((p) => p.id === r.id);
          if (before && (before.name !== r.name || before.hourlyRate !== r.hourlyRate)) {
            rolesTouched = true;
            const { error } = await supabase.from('role_costs').update(toDbRoleCost(r)).eq('id', Number(r.id));
            if (error) {
              console.error('Falha ao atualizar função:', error);
              notices.add(financialErrorMessage(error, 'atualizar a função'));
            }
          }
        }
      }

      // Falhas de salvamento aparecem no mesmo aviso fixo das fotos.
      notices.forEach((message) => pushPhotoNotice(message));
      if (settingsTouched) await queryClient.invalidateQueries({ queryKey: ['financial_settings'] });
      if (rolesTouched) await queryClient.invalidateQueries({ queryKey: ['role_costs'] });
    })();
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signUpFirstAccess = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const logout = () => {
    void supabase.auth.signOut();
  };
  // ---------------------------------------------------------------------

  const value: AppContextValue = {
    isDesktopMode,
    setIsDesktopMode,
    setores,
    setSetores,
    tipos,
    setTipos,
    fabricantes,
    setFabricantes,
    modelos,
    setModelos,
    funcoes,
    setFuncoes,
    problemas,
    setProblemas,
    assets,
    setAssets,
    ordersOfService,
    setOrdersOfService,
    users,
    setUsers,
    financialSettings,
    setFinancialSettings,
    currentUser,
    authLoading,
    login,
    signUpFirstAccess,
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <PhotoSyncAlert messages={photoNotices} onDismiss={() => setPhotoNotices([])} />
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de um <AppProvider>');
  }
  return context;
}
