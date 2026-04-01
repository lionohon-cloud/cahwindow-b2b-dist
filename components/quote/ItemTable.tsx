'use client';

import type { QuoteItem } from '@/types';
import type { ItemPrice } from '@/lib/calc';
import { calcJP } from '@/lib/calc';

interface Props {
  items: QuoteItem[];
  setItems: (items: QuoteItem[]) => void;
  itemPrices?: ItemPrice[];          // 산식 결과 (없으면 가격 열 숨김)
  selectedBrands?: string[];         // 선택된 브랜드 (LX, 홈윈도우, KCC)
}

let _nid = 2;

const PRODUCT_OPTIONS = [
  '', '일반창(미서기)', '시스템창', '발코니창', '미닫이문', '여닫이문',
  '슬라이딩도어', '고정창', '환기창', '기타',
];

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

  // 가격 표시 브랜드: 선택된 브랜드 중 최대 3개
  const priceBrands = selectedBrands.filter((b) => BRAND_PRICE_KEY[b]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>④ 품목 입력</div>
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
              const jp = calcJP(item.w, item.h);
              const ip = itemPrices?.[idx];
              return (
                <tr key={item.id}>
                  <td>
                    <input className="input" style={{ padding: '5px 7px' }}
                      value={item.loc}
                      onChange={(e) => update(item.id, 'loc', e.target.value)}
                      placeholder="거실" />
                  </td>
                  <td>
                    <select className="select" style={{ padding: '5px 7px' }}
                      value={item.nm}
                      onChange={(e) => update(item.id, 'nm', e.target.value)}>
                      {PRODUCT_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o || '-- 선택 --'}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="input" type="number" min={0} style={{ padding: '5px 7px' }}
                      value={item.w || ''}
                      onChange={(e) => update(item.id, 'w', Number(e.target.value))} />
                  </td>
                  <td>
                    <input className="input" type="number" min={0} style={{ padding: '5px 7px' }}
                      value={item.h || ''}
                      onChange={(e) => update(item.id, 'h', Number(e.target.value))} />
                  </td>
                  <td>
                    <input className="input" type="number" min={1} style={{ padding: '5px 7px' }}
                      value={item.qty || ''}
                      onChange={(e) => update(item.id, 'qty', Number(e.target.value))}
                      onBlur={(e) => { if (!Number(e.target.value) || Number(e.target.value) < 1) update(item.id, 'qty', 1); }} />
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: jp ? 'var(--color-text)' : 'var(--color-text-faint)', fontSize: 13 }}>
                    {jp || '-'}
                  </td>
                  {showPrice && priceBrands.map((b) => {
                    const key = BRAND_PRICE_KEY[b];
                    const amt = ip?.[key] ?? 0;
                    return (
                      <td key={b} style={{ textAlign: 'right', fontSize: 12, color: amt ? BRAND_COLOR[b] : 'var(--color-text-faint)' }}>
                        {fmtKRW(amt)}
                      </td>
                    );
                  })}
                  <td>
                    <input className="input" style={{ padding: '5px 7px' }}
                      value={item.nt ?? ''}
                      onChange={(e) => update(item.id, 'nt', e.target.value)}
                      placeholder="메모" />
                  </td>
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
