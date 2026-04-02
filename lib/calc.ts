// ─── 산식 핵심 ──────────────────────────────────────────────────────
// B2B_Client_Quote.html 의 JavaScript 산식을 TypeScript로 이식
// b2bMarkup 은 서버 전용 — 이 파일에 등장하지 않음
// ─────────────────────────────────────────────────────────────────────

// PD.h 컬럼 헤더 (인덱스 = costTable 행의 열 번호)
export const PD_HEADER = [
  '자평',      // 0  — jp 기준값 (가격 아님)
  'Fix',       // 1  — 고정창
  '망충망',    // 2
  '일반_2W',   // 3
  '일반_2W',   // 4  (변형)
  '공장_2W',   // 5
  '발코니_2W', // 6
  '발코니_2W', // 7  (변형)
  '일반_3W',   // 8
  '일반_3W',   // 9  (변형)
  '공장_3W',   // 10
  '발코니_3W', // 11
  '발코니_3W', // 12 (변형)
  '일반_4W',   // 13
  '일반_4W',   // 14 (변형)
  '공장_4W',   // 15
] as const;

// B2B 품명 → PD_HEADER 열 인덱스 매핑
const NM_TO_COL: Record<string, number> = {
  '일반창(미서기)': 3,
  '시스템창':       6,
  '발코니창':       6,
  '미닫이문':       3,
  '여닫이문':       6,
  '슬라이딩도어':   6,
  '고정창':         1,
  '환기창':         1,
};

// 브랜드 표시명 → PD_COST 키
export const BRAND_COST_KEY: Record<string, string> = {
  LX:     'lx',
  홈윈도우: 'hw',
  KCC:    'hcc',
};

// 브랜드 표시명 → bgMk 객체 키
export const BRAND_BGM_KEY: Record<string, string> = {
  LX:     'LX',
  홈윈도우: 'HOME',
  KCC:    'KCC',
};

// 등급 표시명 → PD_COST 등급 키
export const GRADE_COST_KEY: Record<string, string> = {
  '프레스티지': 'PRESTIGE',
  '시그니처':   'SIGNATURE',
  '에코lite':  'ECO',
  'GR':        'PRESTIGE',  // GR은 PRESTIGE 가격표 사용
};

// bgMk 등급 키 (GR은 별도 bgMk 키 존재)
export const GRADE_BGM_KEY: Record<string, string> = {
  '프레스티지': 'PRESTIGE',
  '시그니처':   'SIGNATURE',
  '에코lite':  'ECO',
  'GR':        'GR',
};

// ─── 타입 ─────────────────────────────────────────────────────────
// PD_COST 구조: brand → grade → 행 배열 (행[0]=jp임계값, 행[n]=가격)
export type PdCostTable = Record<string, Record<string, number[][]>>;

export interface ItemPrice {
  jp:  number;
  lx:  number;  // 홈윈도우/LX 단가 × 수량
  hw:  number;  // 홈윈도우 단가 × 수량
  kcc: number;  // KCC 단가 × 수량
}

export interface QuotePrices {
  itemPrices:  ItemPrice[];
  totals:      { lx: number; hw: number; kcc: number };
  couponDisc:  { lx: number; hw: number; kcc: number };
  supplyAmt:   { lx: number; hw: number; kcc: number };
  vat:         { lx: number; hw: number; kcc: number };
  final:       { lx: number; hw: number; kcc: number };
}

// ─── 핵심 함수 ────────────────────────────────────────────────────

/** 자평 계산 (w×h mm² → 자평) */
export function calcJP(w: number, h: number): number {
  if (!w || !h) return 0;
  return Math.ceil((w * h) / 90000);
}

/**
 * 가격표 조회 — scaledCost(b2bMarkup 적용 완료본) 기준
 * @returns 가격 (0 = 미적용, -1 = 범위 초과)
 */
function lookupPrice(
  scaledCost: PdCostTable,
  brandKey: string,   // 'lx' | 'hw' | 'hcc'
  gradeKey: string,   // 'PRESTIGE' | 'SIGNATURE' | 'ECO'
  colIdx: number,     // PD_HEADER 열 인덱스
  jp: number,
): number {
  if (!jp || colIdx < 0) return 0;
  const brandData = scaledCost[brandKey];
  if (!brandData) return 0;
  const rows = brandData[gradeKey] ?? brandData['PRESTIGE'];
  if (!rows?.length) return 0;
  for (const row of rows) {
    if (row[0] >= jp) return row[colIdx] ?? 0;
  }
  return -1; // jp가 최대값 초과
}

/**
 * 품목 1개 × 브랜드 1개 가격 계산
 * scaledCost = b2bMarkup 이미 반영된 가격표
 * bgMk = { LX:{PRESTIGE:120,SIGNATURE:100,...}, HOME:{...}, KCC:{...} }
 */
function calcOneItemBrand(
  nm: string,
  w: number,
  h: number,
  qty: number,
  brandDisplay: string,  // 'LX' | '홈윈도우' | 'KCC'
  gradeDisplay: string,  // '프레스티지' | '시그니처' | '에코lite' | 'GR'
  bgMk: Record<string, Record<string, number>>,
  scaledCost: PdCostTable,
): { jp: number; unitPrice: number; total: number } {
  const jp = calcJP(w, h);
  const colIdx = NM_TO_COL[nm] ?? -1;
  if (!jp || colIdx < 0) return { jp, unitPrice: 0, total: 0 };

  const brandKey  = BRAND_COST_KEY[brandDisplay] ?? '';
  const gradeKey  = GRADE_COST_KEY[gradeDisplay] ?? 'SIGNATURE';
  const bgmBrand  = BRAND_BGM_KEY[brandDisplay] ?? '';
  const bgmGrade  = GRADE_BGM_KEY[gradeDisplay] ?? 'SIGNATURE';

  let price = lookupPrice(scaledCost, brandKey, gradeKey, colIdx, jp);
  if (price <= 0) return { jp, unitPrice: 0, total: 0 };

  // bgMk 적용: 등급 프리미엄 배율
  const mk = bgMk?.[bgmBrand]?.[bgmGrade] ?? 100;
  price = Math.round(price * mk / 100);

  return { jp, unitPrice: price, total: price * qty };
}

/**
 * 쿠폰 할인액 계산
 */
function applyCouponDisc(
  productTotal: number,
  coupons: Array<{ rate: number; amt: number }>,
): number {
  if (!coupons.length || productTotal <= 0) return 0;
  let remain = productTotal;
  for (const c of coupons) {
    if (c.amt > 0) remain = Math.max(0, remain - c.amt);
    if (c.rate > 0) remain = Math.round(remain * (100 - c.rate) / 100);
  }
  return productTotal - remain;
}

/**
 * 전 품목 × 3사 가격 일괄 계산
 * @param items       - 품목 배열
 * @param grades      - { LX: '시그니처', 홈윈도우: '시그니처', KCC: '시그니처' }
 * @param bgMk        - adm.bgMk
 * @param scaledCost  - /api/cost-data 가 반환한 b2bMarkup 적용 가격표
 * @param coupons     - 적용 쿠폰 배열
 */
export function calcAllPrices(
  items: Array<{ nm: string; w: number; h: number; qty: number; manualPrice?: { lx: number; hw: number; kcc: number } }>,
  grades: Record<string, string>,
  bgMk: Record<string, Record<string, number>>,
  scaledCost: PdCostTable,
  coupons: Array<{ rate: number; amt: number }> = [],
): QuotePrices {
  const gradeLX  = grades['LX']    || '시그니처';
  const gradeHW  = grades['홈윈도우'] || '시그니처';
  const gradeKCC = grades['KCC']   || '시그니처';

  const totals = { lx: 0, hw: 0, kcc: 0 };
  const itemPrices: ItemPrice[] = items.map((it) => {
    // 기타 품목: 직접입력 가격 사용
    if (it.nm === '기타') {
      const lx  = it.manualPrice?.lx  ?? 0;
      const hw  = it.manualPrice?.hw  ?? 0;
      const kcc = it.manualPrice?.kcc ?? 0;
      totals.lx  += lx;
      totals.hw  += hw;
      totals.kcc += kcc;
      return { jp: 0, lx, hw, kcc };
    }
    const lxR  = calcOneItemBrand(it.nm, it.w, it.h, it.qty, 'LX',    gradeLX,  bgMk, scaledCost);
    const hwR  = calcOneItemBrand(it.nm, it.w, it.h, it.qty, '홈윈도우', gradeHW,  bgMk, scaledCost);
    const kccR = calcOneItemBrand(it.nm, it.w, it.h, it.qty, 'KCC',   gradeKCC, bgMk, scaledCost);
    totals.lx  += lxR.total;
    totals.hw  += hwR.total;
    totals.kcc += kccR.total;
    return { jp: lxR.jp || hwR.jp || kccR.jp, lx: lxR.total, hw: hwR.total, kcc: kccR.total };
  });

  const couponDisc = {
    lx:  applyCouponDisc(totals.lx,  coupons),
    hw:  applyCouponDisc(totals.hw,  coupons),
    kcc: applyCouponDisc(totals.kcc, coupons),
  };
  const supplyAmt = {
    lx:  totals.lx  - couponDisc.lx,
    hw:  totals.hw  - couponDisc.hw,
    kcc: totals.kcc - couponDisc.kcc,
  };
  const vat = {
    lx:  Math.round(supplyAmt.lx  * 0.1),
    hw:  Math.round(supplyAmt.hw  * 0.1),
    kcc: Math.round(supplyAmt.kcc * 0.1),
  };
  const final = {
    lx:  supplyAmt.lx  + vat.lx,
    hw:  supplyAmt.hw  + vat.hw,
    kcc: supplyAmt.kcc + vat.kcc,
  };

  return { itemPrices, totals, couponDisc, supplyAmt, vat, final };
}

/** 숫자 → 한국 통화 포맷 */
export function fmtKRW(n: number): string {
  if (!n) return '0';
  return Math.round(n).toLocaleString('ko-KR');
}
