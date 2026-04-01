// ─── 사용자 / 세션 ───────────────────────────────────────────────
export interface SessionUser {
  loginId: string;
  name: string;
  team: string;
  phone: string;
}

export interface Session {
  user: SessionUser;
  expiry: number; // Unix ms
}

// ─── 거래처 ───────────────────────────────────────────────────────
export interface B2BClient {
  id: string;
  client_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  biz_no: string | null;
  address: string | null;
  memo: string | null;
  ceo: string | null;
  email: string | null;
  biz_type: string | null;
  fax: string | null;
  registered_by: string;
  sales_rep: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 배포링크 ─────────────────────────────────────────────────────
export interface DistLink {
  id: string;
  link_id: string;
  leader_id: string;
  leader_name: string | null;
  client_id: string | null;
  client_name: string | null;
  link_url: string;
  is_active: boolean;
  created_at: string;
}

// ─── 쿠폰 ────────────────────────────────────────────────────────
export interface Coupon {
  id: string;
  name: string;
  rate: number; // % 할인율
  amt: number;  // 정액 할인
}

export interface CouponSetting {
  id: string;
  leader_id: string;
  client_id: string;
  coupon_id: string;
  coupon_name: string | null;
  enabled: boolean;
  updated_at: string;
}

// ─── 품목 ────────────────────────────────────────────────────────
export interface QuoteItem {
  id: number;
  loc: string;   // 위치
  nm: string;    // 품명
  w: number;     // 너비 (mm)
  h: number;     // 높이 (mm)
  qty: number;   // 수량
  nt?: string;   // 메모
}

// ─── 견적요청 ─────────────────────────────────────────────────────
export type RequestStatus = '대기' | '확인' | '완료';

export interface QuoteRequest {
  id: string;
  request_id: string;
  leader_id: string;
  leader_name: string | null;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_ceo: string | null;
  client_contact: string | null;
  client_email: string | null;
  client_biz_no: string | null;
  site_name: string | null;
  site_address: string | null;
  site_detail: string | null;
  site_floor: number | null;
  site_sido: string | null;
  const_type: string;
  res_type: string;
  wish_date: string | null;
  items: QuoteItem[];
  grades: Record<string, string>;
  options: Record<string, unknown>;
  coupons: string[];
  memo: string | null;
  status: RequestStatus;
  source: string;
  submitted_at: string;
  updated_at: string;
  linked_quote_id: string | null;
}

// ─── API 응답 ─────────────────────────────────────────────────────
export interface LinkInfoResponse {
  success: boolean;
  leader: { name: string; phone: string; team: string } | null;
  client: {
    id: string;
    name: string;
    bizNo: string | null;
    ceo: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  coupons: Coupon[];
  adm: {
    // b2bMarkup 은 서버 전용 — 이 응답에 포함되지 않음
    bgMk: Record<string, Record<string, number>>;
    distDefault: Record<string, unknown>;
  };
  // b2bMarkup 적용 완료 단가표 (서버에서 스케일링, 배율값 미포함)
  scaledCost: Record<string, Record<string, unknown[][]>> | null;
}

export interface SubmitRequestPayload {
  leaderId: string;
  clientName: string;
  clientPhone?: string;
  clientCeo?: string;
  clientContact?: string;
  clientEmail?: string;
  clientBizNo?: string;
  clientId?: string;
  siteName?: string;
  siteAddress?: string;
  siteDetail?: string;
  siteFloor?: number;
  siteSido?: string;
  constType?: string;
  resType?: string;
  wishDate?: string;
  items: QuoteItem[];
  grades: Record<string, string>;
  options?: Record<string, unknown>;
  coupons?: string[];
  memo?: string;
}
