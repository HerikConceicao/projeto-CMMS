import { supabase } from './supabaseClient';

// Fotos de ativos/OS ficam no Storage (bucket privado `cmms-photos`) e são
// referenciadas pela tabela `attachments` — ver db/policies.sql e
// db/migration-plan.md. Quem consome (Asset.photos, OrderOfService.reportPhotos/
// executionPhotos) vê apenas strings usáveis em <img src>: data URL (foto nova,
// ainda não enviada) ou URL assinada (foto já persistida).

export const PHOTO_BUCKET = 'cmms-photos';

export type AttachmentEntityType = 'asset' | 'os_report' | 'os_execution';

export interface AttachmentRow {
  id: number;
  entityType: AttachmentEntityType;
  entityId: number;
  storagePath: string;
  uploadedById: number | null;
  createdAt: string;
}

export interface AttachmentWithUrl extends AttachmentRow {
  url: string;
}

const MAX_LONG_SIDE = 1280;
const JPEG_QUALITY = 0.72;
// Foto JPEG já dentro do limite de dimensão e pequena não precisa ser
// recodificada (evita perda de qualidade em geração dupla).
const SKIP_RECOMPRESS_BYTES = 1024 * 1024;

const SIGNED_URL_TTL_SECONDS = 3600;
// Uma URL assinada em cache só é reaproveitada se ainda tiver pelo menos isto
// de validade — assim a URL (e o <img src>) fica estável entre refetches e só
// é renovada perto de expirar.
const SIGNED_URL_MIN_REMAINING_MS = 20 * 60 * 1000;
const SIGNED_URL_BATCH_SIZE = 200;
const ATTACHMENTS_PAGE_SIZE = 1000; // limite padrão de linhas por request do PostgREST

export function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

function newUuid(): string {
  // crypto.randomUUID só existe em contexto seguro (https/localhost); o
  // fallback cobre acesso via IP da rede local em http durante o desenvolvimento.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
    img.src = dataUrl;
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Redimensiona (lado maior ≤ 1280px) e recodifica como JPEG (qualidade ~0.72)
 * uma foto em data URL. Fotos de câmera de celular têm 3–8 MB; assim ficam em
 * algumas centenas de KB, preservando a cota do plano gratuito do Storage.
 */
export async function compressDataUrl(dataUrl: string): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const longSide = Math.max(img.width, img.height);

  if (longSide <= MAX_LONG_SIDE && dataUrl.startsWith('data:image/jpeg')) {
    const original = await dataUrlToBlob(dataUrl);
    if (original.size <= SKIP_RECOMPRESS_BYTES) return original;
  }

  const scale = Math.min(1, MAX_LONG_SIDE / longSide);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado neste navegador.');
  // JPEG não tem transparência — evita fundo preto em PNG/WebP com alpha.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir a imagem.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

function mapDbAttachment(row: Record<string, unknown>): AttachmentRow {
  return {
    id: row.id as number,
    entityType: row.entity_type as AttachmentEntityType,
    entityId: row.entity_id as number,
    storagePath: row.storage_path as string,
    uploadedById: (row.uploaded_by_id as number | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/** Envia a foto nova ao Storage e cria a linha em `attachments`. Lança em caso de falha. */
export async function uploadPhoto(
  entityType: AttachmentEntityType,
  entityId: number,
  dataUrl: string,
  uploadedById: number | null,
): Promise<AttachmentRow> {
  const blob = await compressDataUrl(dataUrl);
  const storagePath = `${entityType}/${entityId}/${newUuid()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) {
    console.error('Falha no upload da foto para o Storage:', uploadError);
    throw uploadError;
  }

  const { data, error: insertError } = await supabase
    .from('attachments')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      storage_path: storagePath,
      uploaded_by_id: uploadedById,
    })
    .select('*')
    .single();
  if (insertError || !data) {
    console.error('Falha ao registrar a foto em attachments:', insertError);
    // Não deixa objeto órfão no bucket se o registro não foi criado.
    const { error: cleanupError } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    if (cleanupError) console.error('Falha ao limpar objeto órfão do Storage:', cleanupError);
    throw insertError ?? new Error('Registro de anexo não retornado.');
  }
  return mapDbAttachment(data);
}

/** Todas as linhas de `attachments` (paginado: o PostgREST limita 1000 linhas por request). */
export async function fetchAttachments(): Promise<AttachmentRow[]> {
  const rows: AttachmentRow[] = [];
  for (let from = 0; ; from += ATTACHMENTS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .order('created_at')
      .order('id')
      .range(from, from + ATTACHMENTS_PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page.map(mapDbAttachment));
    if (page.length < ATTACHMENTS_PAGE_SIZE) break;
  }
  return rows;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}

/**
 * Converte linhas de `attachments` em linhas com URL assinada (1h), em lote
 * (`createSignedUrls`, sem request por foto). URLs ainda válidas por mais de 20
 * min são reaproveitadas do cache — a URL só muda perto de expirar. Linhas cuja
 * URL não pôde ser gerada são omitidas (com console.error).
 */
export async function fetchSignedUrls(rows: AttachmentRow[]): Promise<AttachmentWithUrl[]> {
  const now = Date.now();
  const missing = rows
    .map((r) => r.storagePath)
    .filter((path) => {
      const cached = signedUrlCache.get(path);
      return !cached || cached.expiresAt - now < SIGNED_URL_MIN_REMAINING_MS;
    });

  for (let i = 0; i < missing.length; i += SIGNED_URL_BATCH_SIZE) {
    const batch = missing.slice(i, i + SIGNED_URL_BATCH_SIZE);
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(batch, SIGNED_URL_TTL_SECONDS);
    if (error) {
      console.error('Falha ao gerar URLs assinadas das fotos:', error);
      throw error;
    }
    for (const item of data ?? []) {
      if (item.error || !item.path || !item.signedUrl) {
        console.error('Falha ao assinar URL de uma foto:', item.path, item.error);
        continue;
      }
      signedUrlCache.set(item.path, {
        url: item.signedUrl,
        expiresAt: now + SIGNED_URL_TTL_SECONDS * 1000,
      });
    }
  }

  const result: AttachmentWithUrl[] = [];
  for (const row of rows) {
    const cached = signedUrlCache.get(row.storagePath);
    if (cached) result.push({ ...row, url: cached.url });
  }
  return result;
}

/** Linhas + URLs assinadas numa chamada só (queryFn de `['attachments']`). */
export async function fetchAttachmentsWithUrls(): Promise<AttachmentWithUrl[]> {
  return fetchSignedUrls(await fetchAttachments());
}

/**
 * Extrai o storage_path de uma URL assinada deste bucket (o token da query muda
 * a cada assinatura, o path não). Retorna null para qualquer outra string.
 */
export function storagePathFromSignedUrl(url: string): string | null {
  try {
    const marker = `/object/sign/${PHOTO_BUCKET}/`;
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Remove a foto: primeiro a linha de `attachments` (o RLS só permite quem enviou
 * ou quem tem manage_users — sem permissão o delete afeta 0 linhas e lançamos
 * erro em vez de fingir sucesso), depois o objeto no Storage.
 */
export async function deletePhoto(row: AttachmentRow): Promise<void> {
  const { data, error } = await supabase.from('attachments').delete().eq('id', row.id).select('id');
  if (error) {
    console.error('Falha ao remover o registro da foto:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    const denied = new Error('Sem permissão para remover esta foto (só quem enviou ou um gestor de usuários).');
    console.error(denied.message, row);
    throw denied;
  }
  signedUrlCache.delete(row.storagePath);

  const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([row.storagePath]);
  if (storageError) {
    // A foto já sumiu da UI (linha apagada); sobra só um objeto órfão no bucket.
    console.error('Registro removido, mas falhou ao apagar o objeto no Storage:', row.storagePath, storageError);
  }
}
