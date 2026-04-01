'use client';

import type { QuoteItem } from '@/types';

interface Props {
  items: QuoteItem[];
  setItems: (items: QuoteItem[]) => void;
}

let _nid = 2;

const PRODUCT_OPTIONS = [
  '', '일반창(미서기)', '시스템창', '발코니창', '미닫이문', '여닫이문',
  '슬라이딩도어', '고정창', '환기창', '기타',
];

export default function ItemTable({ items, setItems }: Props) {
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

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>④ 품목 입력</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>+ 행 추가</button>
      </div>

      <div className="table-wrap">
        <table className="data-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>위치</th>
              <th style={{ width: 160 }}>품명</th>
              <th style={{ width: 80 }}>너비(mm)</th>
              <th style={{ width: 80 }}>높이(mm)</th>
              <th style={{ width: 60 }}>수량</th>
              <th>메모</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
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
                    value={item.qty}
                    onChange={(e) => update(item.id, 'qty', Math.max(1, Number(e.target.value)))} />
                </td>
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
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-faint)' }}>
        ※ 규격을 모르실 경우 0으로 두고 메모란에 내용을 입력해 주세요.
      </p>
    </div>
  );
}
