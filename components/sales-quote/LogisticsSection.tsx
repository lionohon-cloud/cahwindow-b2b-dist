'use client';

import { calcLogistics } from '@/lib/sales-calc';

interface Props {
  zone: 'A' | 'B' | 'C';
  setZone: (z: 'A' | 'B' | 'C') => void;
  maxProductTotal: number;  // 3사 중 최대 제품가 (물류비 기준)
}

const ZONE_LABELS: Record<'A' | 'B' | 'C', string> = {
  A: 'A권역 (기본)',
  B: 'B권역 (경상·강원·울산·부산)',
  C: 'C권역 (도서·원거리)',
};

const ZONE_DESC: Record<'A' | 'B' | 'C', string> = {
  A: '3,500,000원 이상: 8% / 미만: 200,000원',
  B: '4,000,000원 이상: 12% / 미만: 500,000원',
  C: '4,000,000원 이상: 17% / 미만: 700,000원',
};

const MGMT_BASE = Math.round(300_000 * 1.15); // 345,000

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

export default function LogisticsSection({ zone, setZone, maxProductTotal }: Props) {
  const logisticsAmt = calcLogistics(zone, maxProductTotal);
  const mgmtTotal    = MGMT_BASE + logisticsAmt;

  return (
    <div className="card">
      <div className="section-title">⑥ 관리비 · 물류비</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 기본 관리비 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>기본 관리비</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              300,000원 × 1.15 (할증)
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(MGMT_BASE)}원</div>
        </div>

        {/* 물류비 권역 */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>물류비 권역</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(['A', 'B', 'C'] as const).map((z) => (
              <label key={z} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                padding: '10px 14px', borderRadius: 8,
                border: `2px solid ${zone === z ? 'var(--color-blue)' : 'var(--color-border)'}`,
                background: zone === z ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="zone" value={z} checked={zone === z}
                  onChange={() => setZone(z)}
                  style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: zone === z ? 'var(--color-blue)' : 'var(--color-text)' }}>
                    {ZONE_LABELS[z]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {ZONE_DESC[z]}
                  </div>
                </div>
                {zone === z && maxProductTotal > 0 && (
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-blue)', whiteSpace: 'nowrap' }}>
                    {fmt(calcLogistics(z, maxProductTotal))}원
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 합계 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: '#f0f9ff', borderRadius: 8,
          border: '2px solid #bae6fd' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>관리비 합계</div>
            <div style={{ fontSize: 12, color: '#0369a1', marginTop: 2 }}>
              기본 {fmt(MGMT_BASE)} + 물류 {fmt(logisticsAmt)}
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0369a1' }}>
            {fmt(mgmtTotal)}원
          </div>
        </div>

      </div>
    </div>
  );
}
