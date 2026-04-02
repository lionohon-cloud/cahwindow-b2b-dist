// ─── 영업팀 전용 산식 ─────────────────────────────────────────────────
// 기존 lib/calc.ts 의 핵심 산식을 활용하면서 시공/철거/마감/물류비 확장

import { calcJP, BRAND_COST_KEY, BRAND_BGM_KEY, GRADE_COST_KEY, GRADE_BGM_KEY } from '@/lib/calc';
import type { PdCostTable } from '@/lib/calc';
import type { SalesQuoteItem, ExtraItemEntry } from '@/types/sales-quote';
import { FIXED_PRODUCTS } from '@/types/sales-quote';

// ─── 열 인덱스 계산 (명세서 3.1 기준 16컬럼) ─────────────────────
// 헤더: 자평(0), Fix(1), 망추가(2),
//   일반단창_2W(3), 일반이중창_2W(4), 공틀일체_2W(5),
//   발코니단창_2W(6), 발코니이중창_2W(7),
//   일반단창_3W(8), 일반이중창_3W(9), 공틀일체_3W(10),
//   발코니단창_3W(11), 발코니이중창_3W(12),
//   일반단창_4W(13), 일반이중창_4W(14), 공틀일체_4W(15)
export function getColIdx(
  pType: string,
  isDouble: boolean,
  winW: 2 | 3 | 4,
): number {
  if (pType === 'fix') return 1;
  if (pType === 'screen') return 2;
  if (pType === '일반') {
    if (winW === 2) return isDouble ? 4 : 3;
    if (winW === 3) return isDouble ? 9 : 8;
    if (winW === 4) return isDouble ? 14 : 13;
  }
  if (pType === '발코니') {
    if (winW === 2) return isDouble ? 7 : 6;
    if (winW === 3) return isDouble ? 12 : 11;
    // 발코니 4연동 없음
  }
  if (pType === '공틀') {
    if (winW === 2) return 5;
    if (winW === 3) return 10;
    if (winW === 4) return 15;
  }
  return -1;
}

export function getProductLabel(
  pType: string,
  isDouble: boolean,
  winW: 2 | 3 | 4,
  fixedName?: string,
  customNm?: string,
): string {
  if (pType === 'fixed') return fixedName ?? '고정가';
  if (pType === '기타') return customNm ?? '기타';
  if (pType === 'fix') return '고정창(Fix)';
  if (pType === 'screen') return '방충망';
  if (pType === '공틀') return `공틀일체_${winW}W`;
  const dbl = isDouble ? '이중창' : '단창';
  return `${pType}${dbl}_${winW}W`;
}

// ─── 시공비 (명세서 4.4) ─────────────────────────────────────────
const LABOR_MK = 1.15;
export function calcLabor(jp: number, qty: number, isDouble: boolean): number {
  if (!jp) return 0;
  const rate = isDouble ? 4600 : 3600;
  return Math.round(jp * rate * LABOR_MK) * qty;
}

// ─── 철거비 (명세서 4.5) ─────────────────────────────────────────
const DM_RATES: Record<string, number> = {
  AL: 10000, PVC: 20000, 세라믹: 100000,
  시스템창: 100000, 돌와꾸: 50000, 목틀: 20000,
};
const DM_MK = 1.15;
export function calcDemolition(types: string[], qty: number): number {
  if (!types.length) return 0;
  const sum = types.reduce((s, t) => s + (DM_RATES[t] ?? 0), 0);
  return Math.round(sum * DM_MK) * qty;
}

// ─── 마감비 (명세서 4.6) ─────────────────────────────────────────
const FN_MK = 1.15;
export function calcFinish(
  types: string[],
  qty: number,
  wMm: number,
  fnW?: number,
): number {
  if (!types.length) return 0;
  const W = fnW ?? wMm / 1000; // m
  let total = 0;
  if (types.includes('몰딩')) total += 50000;
  if (types.includes('사춤')) total += Math.round(W * 15000);
  if (types.includes('타일')) total += Math.round(W * 25000);
  if (types.includes('브라켓')) total += Math.ceil(wMm / (500 * 10)) * 3000;
  return Math.round(total * FN_MK) * qty;
}

// ─── 물류비 (명세서 7.2) ─────────────────────────────────────────
export function calcLogistics(zone: 'A' | 'B' | 'C', productTotal: number): number {
  const cfg = {
    A: { threshold: 3_500_000, rate: 0.08,  minFee: 200_000 },
    B: { threshold: 4_000_000, rate: 0.12,  minFee: 500_000 },
    C: { threshold: 4_000_000, rate: 0.17,  minFee: 700_000 },
  };
  const { threshold, rate, minFee } = cfg[zone];
  return productTotal >= threshold ? Math.round(productTotal * rate) : minFee;
}

// ─── 보양비 (명세서 6.3) ─────────────────────────────────────────
const EX_MK = 1.15;
export function calcBoyanbi(frames: number): number {
  if (!frames) return 0;
  let base = 0;
  if (frames <= 6) base = 90_000;
  else if (frames <= 12) base = 180_000;
  else base = 300_000;
  return Math.round(base * EX_MK);
}

// ─── 추가항목 합계 (명세서 6.1, exMk=1.15) ──────────────────────
export function calcExtraTotal(items: ExtraItemEntry[]): number {
  return items.reduce((sum, it) => {
    if (it.isDirect && !it.clientReq) return sum; // 직불처리 — 거래처 진행요청 없으면 0
    if (!it.qty) return sum;
    return sum + Math.round(it.basePrice * EX_MK) * it.qty;
  }, 0);
}

// ─── 가격표 조회 (scaledCost = b2bMarkup 이미 적용) ─────────────
function lookupPrice(
  scaledCost: PdCostTable,
  brandKey: string,
  gradeKey: string,
  colIdx: number,
  jp: number,
): number {
  if (!jp || colIdx < 0) return 0;
  const rows = scaledCost[brandKey]?.[gradeKey] ?? scaledCost[brandKey]?.['PRESTIGE'];
  if (!rows?.length) return 0;
  for (const row of rows) {
    if (row[0] >= jp) return (row[colIdx] as number) ?? 0;
  }
  return -1; // jp 범위 초과
}

// ─── 결과 타입 ────────────────────────────────────────────────────
export interface SalesItemPrice {
  jp: number;
  lx: number;
  hw: number;
  kcc: number;
  labor: number;   // 시공비 (브랜드 무관)
  demo: number;    // 철거비
  finish: number;  // 마감비
}

export interface SalesPrices {
  itemPrices: SalesItemPrice[];
  productTotals: { lx: number; hw: number; kcc: number };
  laborTotal: number;
  demoTotal: number;
  finishTotal: number;
  extraTotal: number;      // 추가항목 + 보양비
  logisticsAmt: number;
  mgmtBase: number;        // 345,000
  mgmtTotal: number;       // mgmtBase + logisticsAmt
  couponDisc: { lx: number; hw: number; kcc: number };
  quoteAmt: { lx: number; hw: number; kcc: number };  // 견적금액
  supplyAmt: { lx: number; hw: number; kcc: number };
  vat: { lx: number; hw: number; kcc: number };
  final: { lx: number; hw: number; kcc: number };
}

// ─── 전체 견적 계산 ───────────────────────────────────────────────
export function calcAllSalesPrices(
  items: SalesQuoteItem[],
  grades: Record<string, string>,
  bgMk: Record<string, Record<string, number>>,
  scaledCost: PdCostTable,
  coupons: Array<{ rate: number; amt: number }>,
  zone: 'A' | 'B' | 'C',
  extraItems: ExtraItemEntry[],
  boyanFrames: number,
  constEnabled: boolean,   // constType === '시공포함'
): SalesPrices {
  const gradeLX  = grades['LX']     || '시그니처';
  const gradeHW  = grades['홈윈도우'] || '시그니처';
  const gradeKCC = grades['KCC']    || '시그니처';

  const productTotals = { lx: 0, hw: 0, kcc: 0 };
  let laborTotal = 0, demoTotal = 0, finishTotal = 0;

  const itemPrices: SalesItemPrice[] = items.map((item) => {
    const jp = calcJP(item.w, item.h);
    let lx = 0, hw = 0, kcc = 0;
    let labor = 0;

    if (item.pType === 'fixed' && item.fixedName) {
      // 고정가 품목: manualPrice × qty
      lx  = (item.manualPrice?.lx  ?? 0) * item.qty;
      hw  = (item.manualPrice?.hw  ?? 0) * item.qty;
      kcc = (item.manualPrice?.kcc ?? 0) * item.qty;
      // 시공비: 고정금액 (laborEnabled 무관, constEnabled에만 종속)
      if (constEnabled) {
        const fp = FIXED_PRODUCTS.find((p) => p.name === item.fixedName);
        labor = (fp?.labor ?? 0) * item.qty;
      }
    } else if (item.pType === '기타') {
      // 기타 품목: manualPrice 직접입력 (qty 이미 반영)
      lx  = item.manualPrice?.lx  ?? 0;
      hw  = item.manualPrice?.hw  ?? 0;
      kcc = item.manualPrice?.kcc ?? 0;
      labor = constEnabled && item.laborEnabled ? calcLabor(jp, item.qty, item.isDouble) : 0;
    } else {
      // 시트 기반 품목
      const colIdx = getColIdx(item.pType, item.isDouble, item.winW);

      const calcBrand = (brandDisplay: string, gradeDisplay: string): number => {
        const brandKey = BRAND_COST_KEY[brandDisplay] ?? '';
        const gradeKey = GRADE_COST_KEY[gradeDisplay] ?? 'SIGNATURE';
        const bgmBrand = BRAND_BGM_KEY[brandDisplay] ?? '';
        const bgmGrade = GRADE_BGM_KEY[gradeDisplay] ?? 'SIGNATURE';
        let price = lookupPrice(scaledCost, brandKey, gradeKey, colIdx, jp);
        if (price <= 0) return 0;
        const mk = bgMk?.[bgmBrand]?.[bgmGrade] ?? 100;
        return Math.round(price * mk / 100) * item.qty;
      };

      lx  = calcBrand('LX',    gradeLX);
      hw  = calcBrand('홈윈도우', gradeHW);
      kcc = calcBrand('KCC',   gradeKCC);
      labor = constEnabled && item.laborEnabled ? calcLabor(jp, item.qty, item.isDouble) : 0;
    }

    const demo   = calcDemolition(item.dmTypes, item.qty);
    const finish = calcFinish(item.fnTypes, item.qty, item.w, item.fnW);

    productTotals.lx  += lx;
    productTotals.hw  += hw;
    productTotals.kcc += kcc;
    laborTotal  += labor;
    demoTotal   += demo;
    finishTotal += finish;

    return { jp, lx, hw, kcc, labor, demo, finish };
  });

  // 추가항목 + 보양비
  const extraTotal = calcExtraTotal(extraItems) + calcBoyanbi(boyanFrames);

  // 물류비 (3사 중 최대 제품가 기준)
  const maxProdTotal = Math.max(productTotals.lx, productTotals.hw, productTotals.kcc, 0);
  const logisticsAmt = calcLogistics(zone, maxProdTotal);
  const mgmtBase  = Math.round(300_000 * 1.15); // 345,000
  const mgmtTotal = mgmtBase + logisticsAmt;

  // 할인 (제품가에만 적용)
  const applyCouponDisc = (prodTotal: number): number => {
    if (!coupons.length || prodTotal <= 0) return 0;
    let remain = prodTotal;
    for (const c of coupons) {
      if (c.amt > 0) remain = Math.max(0, remain - c.amt);
      if (c.rate > 0) remain = Math.round(remain * (100 - c.rate) / 100);
    }
    return prodTotal - remain;
  };

  const couponDisc = {
    lx:  applyCouponDisc(productTotals.lx),
    hw:  applyCouponDisc(productTotals.hw),
    kcc: applyCouponDisc(productTotals.kcc),
  };

  const commonCost = laborTotal + demoTotal + finishTotal + extraTotal + mgmtTotal;

  const quoteAmt = {
    lx:  productTotals.lx  + commonCost,
    hw:  productTotals.hw  + commonCost,
    kcc: productTotals.kcc + commonCost,
  };

  const supplyAmt = {
    lx:  quoteAmt.lx  - couponDisc.lx,
    hw:  quoteAmt.hw  - couponDisc.hw,
    kcc: quoteAmt.kcc - couponDisc.kcc,
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

  return {
    itemPrices, productTotals, laborTotal, demoTotal, finishTotal,
    extraTotal, logisticsAmt, mgmtBase, mgmtTotal,
    couponDisc, quoteAmt, supplyAmt, vat, final,
  };
}
