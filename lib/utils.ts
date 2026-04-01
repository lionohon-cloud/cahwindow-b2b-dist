import { supabase } from './supabase';

// ─── 견적요청 ID 생성 ──────────────────────────────────────────────
// 형식: {거래처명}-{사업자번호뒤4자리}-{순번2자리}
// 예: 한솔인테리어-7890-01
export async function generateRequestId(
  clientName: string,
  bizNo: string
): Promise<string> {
  const biz4 = bizNo.replace(/[^0-9]/g, '').slice(-4) || '0000';
  const base = `${clientName}-${biz4}`;

  const { data } = await supabase
    .from('quote_requests')
    .select('request_id')
    .like('request_id', `${base}-%`)
    .order('request_id', { ascending: false })
    .limit(1);

  const lastSeq =
    data?.[0]?.request_id
      ? parseInt(data[0].request_id.split('-').pop() || '0', 10)
      : 0;
  const seq = String(lastSeq + 1).padStart(2, '0');
  return `${base}-${seq}`;
}

// ─── 배포링크 ID ───────────────────────────────────────────────────
// 형식: LINK-YYYYMMDD-NNN
export function generateLinkId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nnn = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `LINK-${date}-${nnn}`;
}

// ─── 거래처 ID ─────────────────────────────────────────────────────
// 형식: CLT-YYYYMMDD-NNN
export function generateClientId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nnn = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `CLT-${date}-${nnn}`;
}

// ─── 전화번호 포맷 ─────────────────────────────────────────────────
export function formatPhone(v: string): string {
  const n = v.replace(/[^0-9]/g, '');
  if (n.startsWith('02')) {
    if (n.length <= 9) return n.replace(/(\d{2})(\d{3,4})(\d{4})/, '$1-$2-$3');
    return n.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (n.length === 11) return n.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (n.length === 10) return n.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  return v;
}

// ─── 사업자번호 포맷 ───────────────────────────────────────────────
export function formatBizNo(v: string): string {
  const n = v.replace(/[^0-9]/g, '');
  if (n.length === 10) return n.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  return v;
}

// ─── 날짜 포맷 ─────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10).replace(/-/g, '.') : '';
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── 배포 링크 URL 생성 ────────────────────────────────────────────
export function buildDistUrl(
  leaderId: string,
  clientId?: string | null
): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cahwindow-b2b-dist.pages.dev');
  return clientId
    ? `${base}/quote?leader=${leaderId}&client=${clientId}`
    : `${base}/quote?leader=${leaderId}`;
}

// ─── 클립보드 복사 ─────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
