'use client';

import type { ExtraItemEntry } from '@/types/sales-quote';
import { calcExtraTotal, calcBoyanbi } from '@/lib/sales-calc';

interface Props {
  extraItems: ExtraItemEntry[];
  setExtraItems: (items: ExtraItemEntry[]) => void;
  boyanFrames: number;
  setBoyanFrames: (n: number) => void;
}

function fmt(n: number) {
  return n ? n.toLocaleString('ko-KR') : '0';
}

const EX_MK = 1.15;

export default function ExtraItemsSection({
  extraItems, setExtraItems, boyanFrames, setBoyanFrames,
}: Props) {

  function updateItem(key: string, patch: Partial<ExtraItemEntry>) {
    setExtraItems(extraItems.map((it) => it.key === key ? { ...it, ...patch } : it));
  }

  const extraTotal = calcExtraTotal(extraItems);
  const boyanAmt   = calcBoyanbi(boyanFrames);
  const total      = extraTotal + boyanAmt;

  return (
    <div className="card">
      <div className="section-title">⑤ 추가항목</div>

      <div className="table-wrap">
        <table className="data-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: 160 }}>항목</th>
              <th style={{ width: 50 }}>단위</th>
              <th style={{ width: 100 }}>기준단가</th>
              <th style={{ width: 70 }}>할증단가</th>
              <th style={{ width: 70 }}>수량</th>
              <th style={{ width: 100, textAlign: 'right' }}>금액</th>
              <th style={{ width: 120 }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {extraItems.map((it) => {
              const unitPrice = Math.round(it.basePrice * EX_MK);
              const isActive = !it.isDirect || it.clientReq;
              const amt = isActive && it.qty ? unitPrice * it.qty : 0;

              return (
                <tr key={it.key} style={{ opacity: it.isDirect && !it.clientReq ? 0.55 : 1 }}>
                  {/* 항목명 */}
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{it.name}</td>

                  {/* 단위 */}
                  <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {it.unit}
                  </td>

                  {/* 기준단가 */}
                  <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {it.basePrice.toLocaleString('ko-KR')}
                  </td>

                  {/* 할증단가 */}
                  <td style={{ textAlign: 'right', fontSize: 12 }}>
                    {unitPrice.toLocaleString('ko-KR')}
                  </td>

                  {/* 수량 */}
                  <td>
                    <input className="input" type="text" inputMode="numeric"
                      disabled={it.isDirect && !it.clientReq}
                      style={{ padding: '4px 6px', fontSize: 13, textAlign: 'center' }}
                      value={it.qty || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        updateItem(it.key, { qty: raw === '' ? 0 : parseInt(raw, 10) });
                      }} />
                  </td>

                  {/* 금액 */}
                  <td style={{ textAlign: 'right', fontSize: 13, fontWeight: amt ? 600 : 400,
                    color: amt ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                    {it.isDirect && !it.clientReq ? (
                      <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>직불처리</span>
                    ) : (
                      `${fmt(amt)}원`
                    )}
                  </td>

                  {/* 비고 (직불처리 항목: 거래처 진행요청 체크) */}
                  <td>
                    {it.isDirect ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={it.clientReq}
                          onChange={(e) => updateItem(it.key, { clientReq: e.target.checked, qty: e.target.checked ? (it.qty || 1) : 0 })} />
                        <span>거래처 진행요청</span>
                      </label>
                    ) : null}
                  </td>
                </tr>
              );
            })}

            {/* 보양비 */}
            <tr style={{ background: '#fafafa' }}>
              <td style={{ fontWeight: 600, fontSize: 13 }}>보양비</td>
              <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>-</td>
              <td style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'right' }}>
                {boyanFrames <= 6 ? '90,000' : boyanFrames <= 12 ? '180,000' : '300,000'}
              </td>
              <td style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'right' }}>
                × 1.15
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input className="input" type="text" inputMode="numeric"
                    style={{ padding: '4px 6px', fontSize: 13, textAlign: 'center' }}
                    value={boyanFrames || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setBoyanFrames(raw === '' ? 0 : parseInt(raw, 10));
                    }}
                    placeholder="0" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>틀</span>
                </div>
              </td>
              <td style={{ textAlign: 'right', fontSize: 13, fontWeight: boyanAmt ? 600 : 400,
                color: boyanAmt ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                {boyanAmt ? `${boyanAmt.toLocaleString('ko-KR')}원` : '-'}
              </td>
              <td style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                {boyanFrames <= 6 ? '~6틀' : boyanFrames <= 12 ? '7~12틀' : '13틀~'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 합계 */}
      {total > 0 && (
        <div style={{ marginTop: 10, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>
          추가항목 합계: <span style={{ color: 'var(--color-blue)' }}>{total.toLocaleString('ko-KR')}원</span>
        </div>
      )}

      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
        ※ 직불처리 항목은 기본적으로 발주거래처와 시공팀 직불 처리됩니다. 거래처 진행요청 시 금액이 합산됩니다.
      </p>
    </div>
  );
}
