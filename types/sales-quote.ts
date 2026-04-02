// ─── 영업팀 전용 견적 타입 ──────────────────────────────────────────

export type ProductType =
  | '일반'    // 일반창 (단창/이중창, 2W/3W/4W)
  | '발코니'  // 발코니창 (단창/이중창, 2W/3W)
  | '공틀'    // 공틀일체 (2W/3W/4W)
  | 'fix'     // 고정창(Fix)
  | 'screen'  // 방충망
  | 'fixed'   // 고정가 제품 (터닝도어 등)
  | '기타';   // 직접입력

export interface SalesQuoteItem {
  id: number;
  loc: string;           // 위치
  pType: ProductType;    // 제품 유형
  isDouble: boolean;     // 이중창 여부 (일반/발코니에만 적용)
  winW: 2 | 3 | 4;       // 연동수
  fixedName?: string;    // 고정가 품명 (터닝도어 등)
  customNm?: string;     // 기타 직접입력 품명
  w: number;             // 너비 mm
  h: number;             // 높이 mm
  qty: number;
  nt?: string;           // 메모
  // 기타/고정가 품목 직접입력 가격 (qty 미적용)
  manualPrice?: { lx: number; hw: number; kcc: number };
  // 시공/철거/마감 옵션
  laborEnabled: boolean;   // 시공비 포함
  dmTypes: string[];        // 철거 유형 배열
  fnTypes: string[];        // 마감 유형 배열
  fnW?: number;             // 마감 너비 m (없으면 w/1000 사용)
}

// ─── 고정가 제품 (명세서 3.2) ─────────────────────────────────────
export const FIXED_PRODUCTS: ReadonlyArray<{
  name: string;
  price: number;
  labor: number;
}> = [
  { name: '터닝도어',          price: 550000, labor: 100000 },
  { name: '터닝도어(제품만)',   price: 550000, labor: 0      },
  { name: '슬림3연동(5T강화)',  price: 700000, labor: 150000 },
  { name: 'ABS도어',           price: 500000, labor: 100000 },
];

// ─── 철거/마감 옵션 목록 ─────────────────────────────────────────
export const DM_OPTIONS = ['AL', 'PVC', '세라믹', '시스템창', '돌와꾸', '목틀'] as const;
export const FN_OPTIONS = ['몰딩', '사춤', '타일', '브라켓'] as const;

// ─── 추가항목 (명세서 6.1~6.2) ──────────────────────────────────
export interface ExtraItemEntry {
  key: string;
  name: string;
  unit: string;
  basePrice: number;   // exMk 미적용 단가
  qty: number;
  isDirect: boolean;   // 직불처리 항목 여부
  clientReq: boolean;  // 직불처리 항목의 "거래처 진행요청" 체크 여부
}

export const DEFAULT_EXTRA_ITEMS: ExtraItemEntry[] = [
  { key: 'region',      name: '권역비(편도60km)', unit: '건', basePrice: 100000, qty: 0, isDirect: false, clientReq: false },
  { key: 'roundSasum',  name: '라운드사춤',        unit: '건', basePrice: 300000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'hariCut',     name: '하리절단',           unit: '건', basePrice: 120000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'railing',     name: '난간대',             unit: 'M',  basePrice: 100000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'bottomGalva', name: '하부갈바',            unit: 'M',  basePrice: 20000,  qty: 0, isDirect: true,  clientReq: false },
  { key: 'longDemo',    name: '장철거',             unit: '건', basePrice: 100000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'cabinet',     name: '상부장탈부착',        unit: '건', basePrice: 100000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'aircon',      name: '실외기철거',          unit: '건', basePrice: 100000, qty: 0, isDirect: true,  clientReq: false },
  { key: 'laundry',     name: '빨래건조대',          unit: '건', basePrice: 30000,  qty: 0, isDirect: true,  clientReq: false },
];

// ─── 저장 페이로드 ────────────────────────────────────────────────
export interface SalesQuotePayload {
  leaderId: string;
  leaderName?: string;
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
  constType: string;
  resType: string;
  wishDate?: string;
  items: SalesQuoteItem[];
  grades: Record<string, string>;
  zone: 'A' | 'B' | 'C';
  extraItems: ExtraItemEntry[];
  boyanFrames: number;
  memo?: string;
  linkedRequestId?: string;  // 연결할 원본 거래처 요청 ID
}
