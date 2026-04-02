'use client';

import type { SalesPrices } from '@/lib/sales-calc';

interface Props {
  prices: SalesPrices | null;
  grades: Record<string, string>;
}

const BRANDS = ['LX', '홈윈도우', 'KCC'] as const;
const BRAND_COLOR: Record<string, string> = {
  LX: '#c41230', 홈윈도우: '#1a1a1a', KCC: '#1d4ed8',
};
const BRAND_KEY: Record<string, 'lx' | 'hw' | 'kcc'> = {
  LX: 'lx', 홈윈도우: 'hw', KCC: 'kcc',
};

function fmt(n: number | undefined) {
  if (!n) return '-';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

function Row({ label, values, bold, highlight, small }: {
  label: string;
  values: (string | number)[];
  bold?: boolean;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <tr style={{ background: highlight ? '#f0f9ff' : undefined }}>
      <td style={{
        padding: '8px 12px', fontSize: small ? 12 : 13,
        fontWeight: bold ? 700 : 400,
        color: small ? 'var(--color-text-muted)' : 'var(--color-text)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          padding: '8px 12px', textAlign: 'right',
          fontSize: small ? 12 : 14,
          fontWeight: bold ? 700 : 400,
          color: highlight ? '#0369a1' : 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {typeof v === 'number' ? fmt(v) : v}
        </td>
      ))}
    </tr>
  );
}

export default function SalesPriceSummary({ prices, grades }: Props) {
  if (!prices) {
    return (
      <div className="card">
        <div className="section-title">⑦ 견적 금액 요약</div>
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
            품목과 등급을 선택하면 가격이 계산됩니다.
          </div>
        </div>
      </div>
    );
  }

  const p = prices;
  const anyDisc = p.couponDisc.lx > 0 || p.couponDisc.hw > 0 || p.couponDisc.kcc > 0;

  return (
    <div className="card">
      <div className="section-title">⑦ 견적 금액 요약</div>

      <div className="table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                width: '30%', borderBottom: '2px solid var(--color-border)' }}>
                항목
              </th>
              {BRANDS.map((b) => (
                <th key={b} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700,
                  color: BRAND_COLOR[b], borderBottom: '2px solid var(--color-border)' }}>
                  {b}
                  {grades[b] ? <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>({grades[b]})</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="제품 합계"
              values={BRANDS.map((b) => p.productTotals[BRAND_KEY[b]])}
            />
            <Row label="시공비" small
              values={BRANDS.map(() => p.laborTotal || '-')}
            />
            <Row label="철거비" small
              values={BRANDS.map(() => p.demoTotal || '-')}
            />
            <Row label="마감비" small
              values={BRANDS.map(() => p.finishTotal || '-')}
            />
            <Row label="추가항목" small
              values={BRANDS.map(() => p.extraTotal || '-')}
            />
            <Row label={`관리비 (기본 ${p.mgmtBase.toLocaleString()})`} small
              values={BRANDS.map(() => p.mgmtTotal)}
            />
            <tr style={{ background: '#f9fafb' }}>
              <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14,
                borderBottom: '2px solid var(--color-border)' }}>
                견적금액
              </td>
              {BRANDS.map((b) => (
                <td key={b} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700,
                  fontSize: 14, borderBottom: '2px solid var(--color-border)' }}>
                  {fmt(p.quoteAmt[BRAND_KEY[b]])}
                </td>
              ))}
            </tr>
            {anyDisc && (
              <Row label="할인권 할인"
                values={BRANDS.map((b) => p.couponDisc[BRAND_KEY[b]] ? `-${p.couponDisc[BRAND_KEY[b]].toLocaleString('ko-KR')}원` : '-')}
              />
            )}
            <Row label="공급가"
              values={BRANDS.map((b) => p.supplyAmt[BRAND_KEY[b]])}
              bold
            />
            <Row label="부가세 (10%)" small
              values={BRANDS.map((b) => p.vat[BRAND_KEY[b]])}
            />
          </tbody>
          <tfoot>
            <tr style={{ background: '#eff6ff' }}>
              <td style={{ padding: '12px', fontWeight: 800, fontSize: 16, color: '#1d4ed8' }}>
                최종가 (VAT 포함)
              </td>
              {BRANDS.map((b) => (
                <td key={b} style={{ padding: '12px', textAlign: 'right',
                  fontWeight: 800, fontSize: 16, color: '#1d4ed8' }}>
                  {fmt(p.final[BRAND_KEY[b]])}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 물류비 표시 */}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
        * 물류비 {p.logisticsAmt.toLocaleString('ko-KR')}원 포함 (제품 원가 최대값 기준)
      </div>
    </div>
  );
}
