'use client';

import type { QuoteItem } from '@/types';
import type { ItemPrice } from '@/lib/calc';
import { calcJP, PRODUCT_OPTIONS } from '@/lib/calc';

interface Props {
  items: QuoteItem[];
  setItems: (items: QuoteItem[]) => void;
  itemPrices?: ItemPrice[];          // 산식 결과 (없으면 가격 열 숨김)
  selectedBrands?: string[];         // 선택된 브랜드 (LX, 홈윈도우, KCC)
}

let _nid = 2;


const BRAND_COLOR: Record<string, string> = {
  LX:     '#c41230',
  홈윈도우: '#1a1a1a',
  KCC:    '#1d4ed8',
};

const BRAND_PRICE_KEY: Record<string, 'lx' | 'hw' | 'kcc'> = {
  LX:     'lx',
  홈윈도우: 'hw',
  KCC:    'kcc',
};

function fmtKRW(n: number) {
  if (!n) return '-';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

export default function ItemTable({ items, setItems, itemPrices, selectedBrands = [] }: Props) {
  const showPrice = !!itemPrices?.length;

  function addRow() {
    setItems([...items, { id: _nid++, loc: '', nm: '', w: 0, h: 0, qty: 1, nt: '' }]);
  }

  function removeRow(id: number) {
    const next = items.filter((i) => i.id !== id);
    setItems(next.length ? next : [{ id: _nid++, loc: '', nm: '', w: 0, h: 0, qty: 1, nt: '' }]);
  }

  function update(id: number, field: keyof QuoteItem, value: string | number) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function updateManualPrice(id: number, key: 'lx' | 'hw' | 'kcc', value: number) {
    setItems(items.map((i) => i.id === id
      ? { ...i, manualPrice: { lx: 0, hw: 0, kcc: 0, ...i.manualPrice, [key]: value } }
      : i
    ));
  }

  // 가격 표시 브랜드: 선택된 브랜드 중 최대 3개
  const priceBrands = selectedBrands.filter((b) => BRAND_PRICE_KEY[b]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>⑤ 품목 입력</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>+ 행 추가</button>
      </div>

      <div className="table-wrap">
        <table className="data-table" style={{ minWidth: showPrice && priceBrands.length ? 800 : 640 }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>위치</th>
              <th style={{ width: 160 }}>품명</th>
              <th style={{ width: 80 }}>너비(mm)</th>
              <th style={{ width: 80 }}>높이(mm)</th>
              <th style={{ width: 50 }}>수량</th>
              <th style={{ width: 60 }}>자평</th>
              {showPrice && priceBrands.map((b) => (
                <th key={b} style={{ width: 110, color: BRAND_COLOR[b] }}>{b}</th>
              ))}
              <th>메모</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isCustom = item.nm === '기타';
              const jp = isCustom ? 0 : calcJP(item.w, item.h);
              const ip = itemPrices?.[idx];
              return (
                <tr key={item.id}>
                  {/* 위치 */}
                  <td>
                    <input className="input" style={{ padding: '5px 7px' }}
                      value={item.loc}
                      onChange={(e) => update(item.id, 'loc', e.target.value)}
                      placeholder="거실" />
                  </td>

                  {/* 품명 */}
                  <td>
                    {item.nm.includes('발코니') && item.h >= 1900 && (
                      <div style={{ fontSize:10, background:'#fef3c7', color:'#92400e', borderRadius:3, padding:'1px 5px', marginBottom:3, display:'inline-block' }}>
                        사춤 자동적용
                      </div>
                    )}
                    {isCustom ? (
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button type="button"
                          title="품목 선택으로 돌아가기"
                          onClick={() => update(item.id, 'nm', '')}
                          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', padding: '4px 6px', fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          ←
                        </button>
                        <input className="input" style={{ padding: '5px 7px', flex: 1 }}
                          value={item.customNm ?? ''}
                          onChange={(e) => update(item.id, 'customNm', e.target.value)}
                          placeholder="품명 직접입력" />
                      </div>
                    ) : (
                      <select className="select" style={{ padding: '5px 7px' }}
                        value={item.nm}
                        onChange={(e) => update(item.id, 'nm', e.target.value)}>
                        {PRODUCT_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o || '-- 선택 --'}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* 너비 */}
                  <td>
                    {isCustom ? (
                      <span style={{ display: 'block', textAlign: 'center', color: 'var(--color-text-faint)' }}>-</span>
                    ) : (
                      <input className="input" type="text" inputMode="numeric" pattern="[0-9]*" style={{ padding: '5px 7px' }}
                        value={item.w || ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          update(item.id, 'w', raw === '' ? 0 : parseInt(raw, 10));
                        }} />
                    )}
                  </td>

                  {/* 높이 */}
                  <td>
                    {isCustom ? (
                      <span style={{ display: 'block', textAlign: 'center', color: 'var(--color-text-faint)' }}>-</span>
                    ) : (
                      <input className="input" type="text" inputMode="numeric" pattern="[0-9]*" style={{ padding: '5px 7px' }}
                        value={item.h || ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          update(item.id, 'h', raw === '' ? 0 : parseInt(raw, 10));
                        }} />
                    )}
                  </td>

                  {/* 수량 */}
                  <td>
                    <input className="input" type="text" inputMode="numeric" style={{ padding: '5px 7px' }}
                      value={item.qty || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        update(item.id, 'qty', raw === '' ? 0 : parseInt(raw, 10));
                      }}
                      onBlur={() => { if (!item.qty || item.qty < 1) update(item.id, 'qty', 1); }} />
                  </td>

                  {/* 자평 */}
                  <td style={{ textAlign: 'center', fontWeight: 600, color: jp ? 'var(--color-text)' : 'var(--color-text-faint)', fontSize: 13 }}>
                    {isCustom ? '-' : (jp || '-')}
                  </td>

                  {/* 가격 열 */}
                  {showPrice && priceBrands.map((b) => {
                    const key = BRAND_PRICE_KEY[b];
                    if (isCustom) {
                      const val = item.manualPrice?.[key] ?? 0;
                      return (
                        <td key={b} style={{ padding: '3px 4px' }}>
                          <input className="input" type="text" inputMode="numeric" style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12, color: BRAND_COLOR[b] }}
                            value={val || ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              updateManualPrice(item.id, key, raw === '' ? 0 : parseInt(raw, 10));
                            }}
                            placeholder="직접입력" />
                        </td>
                      );
                    }
                    const amt = ip?.[key] ?? 0;
                    return (
                      <td key={b} style={{ textAlign: 'right', fontSize: 12, color: amt ? BRAND_COLOR[b] : 'var(--color-text-faint)' }}>
                        {fmtKRW(amt)}
                      </td>
                    );
                  })}

                  {/* 메모 */}
                  <td>
                    <input className="input" style={{ padding: '5px 7px' }}
                      value={item.nt ?? ''}
                      onChange={(e) => update(item.id, 'nt', e.target.value)}
                      placeholder="메모" />
                  </td>

                  {/* 삭제 */}
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeRow(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: 16 }}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-faint)' }}>
        ※ 규격을 모르실 경우 0으로 두고 메모란에 내용을 입력해 주세요.
        {showPrice && ' 가격은 참고용 가견적이며 실제 금액과 다를 수 있습니다.'}
      </p>
    </div>
  );
}
