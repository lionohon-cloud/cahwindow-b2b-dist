'use client';

import type { QuotePrices } from '@/lib/calc';
import { fmtKRW } from '@/lib/calc';

const BRAND_GRADES: Record<string, string[]> = {
  LX:     ['프레스티지', '시그니처', '에코lite'],
  홈윈도우: ['프레스티지', '시그니처', '에코lite'],
  KCC:    ['프레스티지', '시그니처', '에코lite'],
};

const BRAND_COLORS: Record<string, string> = {
  LX:     '#c41230',
  홈윈도우: '#1a1a1a',
  KCC:    '#1d4ed8',
};

const BRAND_LABELS: Record<string, string> = {
  LX:     'LX하우시스',
  홈윈도우: 'HOME WINDOW',
  KCC:    'KCC Homecc',
};

// 브랜드별 prices 결과 키 매핑
const BRAND_PRICE_KEY: Record<string, 'lx' | 'hw' | 'kcc'> = {
  LX:     'lx',
  홈윈도우: 'hw',
  KCC:    'kcc',
};

interface Props {
  grades: Record<string, string>;
  setGrades: (g: Record<string, string>) => void;
  prices?: QuotePrices | null;         // 산식 결과 (없으면 가격 숨김)
  coupons?: Array<{ name: string; rate: number; amt: number }>;
}

export default function BrandCards({ grades, setGrades, prices, coupons = [] }: Props) {
  const hasCoupon = coupons.length > 0;

  return (
    <div className="card">
      <div className="section-title">③ 브랜드 / 등급 선택</div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        원하시는 브랜드와 등급을 선택해 주세요. 복수 선택 가능합니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(BRAND_GRADES).map(([brand, gradeList]) => {
          const color    = BRAND_COLORS[brand];
          const selected = grades[brand] ?? '';
          const priceKey = BRAND_PRICE_KEY[brand];
          const final    = prices?.final[priceKey] ?? 0;
          const supply   = prices?.supplyAmt[priceKey] ?? 0;
          const vat      = prices?.vat[priceKey] ?? 0;
          const disc     = prices?.couponDisc[priceKey] ?? 0;
          const showPrice = !!prices && !!selected;

          return (
            <div key={brand} style={{ borderRadius: 10, overflow: 'hidden', border: `2px solid ${selected ? color : 'var(--color-border)'}`, transition: 'border-color .15s' }}>
              {/* 헤더 */}
              <div style={{ background: selected ? color : '#f8f9fa', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: selected ? '#fff' : color }}>
                  {BRAND_LABELS[brand]}
                </span>
                {showPrice && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: selected ? '#fff' : color }}>
                    {fmtKRW(final)}원 <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>(VAT포함)</span>
                  </span>
                )}
              </div>

              {/* 등급 버튼 */}
              <div style={{ padding: '10px 16px', background: '#fff' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: showPrice ? 10 : 0 }}>
                  {gradeList.map((grade) => {
                    const isOn = selected === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setGrades({ ...grades, [brand]: isOn ? '' : grade })}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 20,
                          border: `2px solid ${isOn ? color : 'var(--color-border)'}`,
                          background: isOn ? color : '#fff',
                          color: isOn ? '#fff' : 'var(--color-text)',
                          fontSize: 13,
                          fontWeight: isOn ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>

                {/* 가격 상세 */}
                {showPrice && final > 0 && (
                  <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 12px', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>가견적 금액</span>
                      <span style={{ fontWeight: 600 }}>{fmtKRW(supply + disc)}원</span>
                    </div>
                    {disc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                          쿠폰 할인
                          {hasCoupon && (
                            <span style={{ marginLeft: 6, fontSize: 11, background: '#f5f3ff', color: '#7c3aed', borderRadius: 4, padding: '1px 6px' }}>
                              {coupons.map((c) => c.name).join(' + ')}
                            </span>
                          )}
                        </span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>-{fmtKRW(disc)}원</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>공급가액</span>
                      <span>{fmtKRW(supply)}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>부가세 (10%)</span>
                      <span>{fmtKRW(vat)}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid var(--color-border)` }}>
                      <span style={{ fontWeight: 700 }}>예상 합계 (VAT포함)</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color }}>{fmtKRW(final)}원</span>
                    </div>
                  </div>
                )}

                {showPrice && final === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>
                    품목 규격을 입력하면 예상 금액이 표시됩니다.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {Object.values(grades).every((v) => !v) && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-faint)' }}>
          ※ 등급 미선택 시 담당자가 별도 확인합니다.
        </p>
      )}

      {prices && (
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-faint)' }}>
          ※ 위 금액은 참고용 가견적입니다. 현장 조건·시공 방식에 따라 실제 금액이 달라질 수 있습니다.
        </p>
      )}
    </div>
  );
}
