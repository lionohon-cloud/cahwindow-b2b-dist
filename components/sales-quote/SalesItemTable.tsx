'use client';

import { useState } from 'react';
import type { SalesQuoteItem } from '@/types/sales-quote';
import { FIXED_PRODUCTS, DM_OPTIONS, FN_OPTIONS } from '@/types/sales-quote';
import type { SalesItemPrice } from '@/lib/sales-calc';
import { calcJP } from '@/lib/calc';

// ─── 품목 카탈로그 (명세서 3.1 기준 16컬럼) ──────────────────────
interface CatalogEntry {
  value: string;
  label: string;
  pType: SalesQuoteItem['pType'];
  isDouble: boolean;
  winW: 2 | 3 | 4;
  fixedName?: string;
  fixedPrice?: number;
  fixedLabor?: number;
  group: string;
}

const CATALOG: CatalogEntry[] = [
  // 일반창
  { value: '일반단창_2W',     label: '일반단창_2W',     pType: '일반',  isDouble: false, winW: 2, group: '일반창' },
  { value: '일반이중창_2W',   label: '일반이중창_2W',   pType: '일반',  isDouble: true,  winW: 2, group: '일반창' },
  { value: '일반단창_3W',     label: '일반단창_3W',     pType: '일반',  isDouble: false, winW: 3, group: '일반창' },
  { value: '일반이중창_3W',   label: '일반이중창_3W',   pType: '일반',  isDouble: true,  winW: 3, group: '일반창' },
  { value: '일반단창_4W',     label: '일반단창_4W',     pType: '일반',  isDouble: false, winW: 4, group: '일반창' },
  { value: '일반이중창_4W',   label: '일반이중창_4W',   pType: '일반',  isDouble: true,  winW: 4, group: '일반창' },
  // 발코니창
  { value: '발코니단창_2W',   label: '발코니단창_2W',   pType: '발코니', isDouble: false, winW: 2, group: '발코니창' },
  { value: '발코니이중창_2W', label: '발코니이중창_2W', pType: '발코니', isDouble: true,  winW: 2, group: '발코니창' },
  { value: '발코니단창_3W',   label: '발코니단창_3W',   pType: '발코니', isDouble: false, winW: 3, group: '발코니창' },
  { value: '발코니이중창_3W', label: '발코니이중창_3W', pType: '발코니', isDouble: true,  winW: 3, group: '발코니창' },
  // 공틀일체
  { value: '공틀일체_2W',     label: '공틀일체_2W',     pType: '공틀',  isDouble: false, winW: 2, group: '공틀일체' },
  { value: '공틀일체_3W',     label: '공틀일체_3W',     pType: '공틀',  isDouble: false, winW: 3, group: '공틀일체' },
  { value: '공틀일체_4W',     label: '공틀일체_4W',     pType: '공틀',  isDouble: false, winW: 4, group: '공틀일체' },
  // 기타 창호
  { value: 'fix',             label: '고정창(Fix)',       pType: 'fix',   isDouble: false, winW: 2, group: '기타창호' },
  { value: 'screen',          label: '방충망',             pType: 'screen', isDouble: false, winW: 2, group: '기타창호' },
  // 고정가 제품
  ...FIXED_PRODUCTS.map((fp) => ({
    value:      `fixed_${fp.name}`,
    label:      fp.name,
    pType:      'fixed' as const,
    isDouble:   false,
    winW:       2 as const,
    fixedName:  fp.name,
    fixedPrice: fp.price,
    fixedLabor: fp.labor,
    group:      '고정가',
  })),
  // 기타 직접입력
  { value: '기타', label: '기타(직접입력)', pType: '기타', isDouble: false, winW: 2, group: '기타' },
];

const GROUPS = ['일반창', '발코니창', '공틀일체', '기타창호', '고정가', '기타'];

const BRAND_COLOR: Record<string, string> = {
  LX: '#c41230', 홈윈도우: '#1a1a1a', KCC: '#1d4ed8',
};
const BRAND_KEY: Record<string, 'lx' | 'hw' | 'kcc'> = {
  LX: 'lx', 홈윈도우: 'hw', KCC: 'kcc',
};

function fmt(n: number) {
  return n ? Math.round(n).toLocaleString('ko-KR') : '-';
}

let _nid = 2;

interface Props {
  items: SalesQuoteItem[];
  setItems: (items: SalesQuoteItem[]) => void;
  itemPrices?: SalesItemPrice[];
  selectedBrands?: string[];
  constEnabled: boolean;
}

export default function SalesItemTable({
  items, setItems, itemPrices, selectedBrands = [], constEnabled,
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const showPrice = !!itemPrices?.length;
  const priceBrands = selectedBrands.filter((b) => BRAND_KEY[b]);

  function addRow() {
    const newItem: SalesQuoteItem = {
      id: _nid++, loc: '', pType: '일반', isDouble: false, winW: 2,
      w: 0, h: 0, qty: 1, nt: '', laborEnabled: constEnabled,
      dmTypes: [], fnTypes: [],
    };
    setItems([...items, newItem]);
  }

  function removeRow(id: number) {
    const next = items.filter((i) => i.id !== id);
    if (!next.length) {
      const newItem: SalesQuoteItem = {
        id: _nid++, loc: '', pType: '일반', isDouble: false, winW: 2,
        w: 0, h: 0, qty: 1, nt: '', laborEnabled: constEnabled,
        dmTypes: [], fnTypes: [],
      };
      setItems([newItem]);
    } else {
      setItems(next);
    }
  }

  function update<K extends keyof SalesQuoteItem>(id: number, field: K, value: SalesQuoteItem[K]) {
    setItems(items.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function updateManualPrice(id: number, key: 'lx' | 'hw' | 'kcc', value: number) {
    setItems(items.map((i) => i.id === id
      ? { ...i, manualPrice: { lx: 0, hw: 0, kcc: 0, ...i.manualPrice, [key]: value } }
      : i));
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDm(id: number, type: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = item.dmTypes.includes(type)
      ? item.dmTypes.filter((t) => t !== type)
      : [...item.dmTypes, type];
    update(id, 'dmTypes', next);
  }

  function toggleFn(id: number, type: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = item.fnTypes.includes(type)
      ? item.fnTypes.filter((t) => t !== type)
      : [...item.fnTypes, type];
    update(id, 'fnTypes', next);
  }

  // 제품 선택 시 item 필드 일괄 업데이트
  function selectProduct(id: number, catalogValue: string) {
    const entry = CATALOG.find((c) => c.value === catalogValue);
    if (!entry) return;
    setItems(items.map((i) => {
      if (i.id !== id) return i;
      const base: Partial<SalesQuoteItem> = {
        pType: entry.pType,
        isDouble: entry.isDouble,
        winW: entry.winW,
        fixedName: entry.fixedName,
        customNm: undefined,
      };
      if (entry.pType === 'fixed' && entry.fixedPrice !== undefined) {
        base.manualPrice = {
          lx:  entry.fixedPrice,
          hw:  entry.fixedPrice,
          kcc: entry.fixedPrice,
        };
      } else if (entry.pType !== '기타') {
        base.manualPrice = undefined;
      }
      return { ...i, ...base };
    }));
  }

  // 현재 item에 해당하는 catalog value 계산
  function getCatalogValue(item: SalesQuoteItem): string {
    if (item.pType === 'fixed') return `fixed_${item.fixedName ?? ''}`;
    if (item.pType === '기타') return '기타';
    if (item.pType === 'fix') return 'fix';
    if (item.pType === 'screen') return 'screen';
    const dbl = item.isDouble ? '이중창' : '단창';
    return `${item.pType}${dbl}_${item.winW}W`;
  }

  const colSpan = 6 + priceBrands.length + (showPrice ? 3 : 0) + 2; // 위치+품명+W+H+qty+자평 + 브랜드가격들 + 시공/철거/마감 + 확장/삭제

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>④ 품목 입력</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>+ 행 추가</button>
      </div>

      <div className="table-wrap">
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>위치</th>
              <th style={{ width: 180 }}>품명</th>
              <th style={{ width: 72 }}>너비mm</th>
              <th style={{ width: 72 }}>높이mm</th>
              <th style={{ width: 48 }}>수량</th>
              <th style={{ width: 48 }}>자평</th>
              {priceBrands.map((b) => (
                <th key={b} style={{ width: 100, color: BRAND_COLOR[b], fontSize: 12 }}>{b}</th>
              ))}
              {showPrice && (
                <>
                  <th style={{ width: 80, color: '#6b7280', fontSize: 12 }}>시공</th>
                  <th style={{ width: 80, color: '#2563eb', fontSize: 12 }}>철거</th>
                  <th style={{ width: 80, color: '#059669', fontSize: 12 }}>마감</th>
                </>
              )}
              <th style={{ width: 32 }}></th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isFixed = item.pType === 'fixed';
              const isCustom = item.pType === '기타';
              const noSize = isFixed;
              const jp = noSize ? 0 : calcJP(item.w, item.h);
              const ip = itemPrices?.[idx];
              const isExp = expanded.has(item.id);
              const catalogVal = getCatalogValue(item);

              return [
                // ── 메인 행 ──
                <tr key={`row-${item.id}`}>
                  {/* 위치 */}
                  <td>
                    <input className="input" style={{ padding: '4px 6px', fontSize: 13 }}
                      value={item.loc}
                      onChange={(e) => update(item.id, 'loc', e.target.value)}
                      placeholder="거실" />
                  </td>

                  {/* 품명 */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <select className="select" style={{ padding: '4px 6px', fontSize: 12 }}
                        value={catalogVal}
                        onChange={(e) => selectProduct(item.id, e.target.value)}>
                        <option value="">-- 선택 --</option>
                        {GROUPS.map((g) => {
                          const opts = CATALOG.filter((c) => c.group === g);
                          if (!opts.length) return null;
                          return (
                            <optgroup key={g} label={`── ${g} ──`}>
                              {opts.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      {/* 기타: 품명 직접입력 */}
                      {isCustom && (
                        <input className="input" style={{ padding: '4px 6px', fontSize: 12 }}
                          value={item.customNm ?? ''}
                          onChange={(e) => update(item.id, 'customNm', e.target.value)}
                          placeholder="품명 직접입력" />
                      )}
                    </div>
                  </td>

                  {/* 너비 */}
                  <td>
                    {noSize ? (
                      <span style={{ display: 'block', textAlign: 'center', color: 'var(--color-text-faint)' }}>-</span>
                    ) : (
                      <input className="input" type="text" inputMode="numeric" style={{ padding: '4px 6px', fontSize: 13 }}
                        value={item.w || ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          update(item.id, 'w', raw === '' ? 0 : parseInt(raw, 10));
                        }} />
                    )}
                  </td>

                  {/* 높이 */}
                  <td>
                    {noSize ? (
                      <span style={{ display: 'block', textAlign: 'center', color: 'var(--color-text-faint)' }}>-</span>
                    ) : (
                      <input className="input" type="text" inputMode="numeric" style={{ padding: '4px 6px', fontSize: 13 }}
                        value={item.h || ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          update(item.id, 'h', raw === '' ? 0 : parseInt(raw, 10));
                        }} />
                    )}
                  </td>

                  {/* 수량 */}
                  <td>
                    <input className="input" type="text" inputMode="numeric" style={{ padding: '4px 6px', fontSize: 13, textAlign: 'center' }}
                      value={item.qty || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        update(item.id, 'qty', raw === '' ? 0 : parseInt(raw, 10));
                      }}
                      onBlur={() => { if (!item.qty || item.qty < 1) update(item.id, 'qty', 1); }} />
                  </td>

                  {/* 자평 */}
                  <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 13,
                    color: jp ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                    {noSize ? '-' : (jp || '-')}
                  </td>

                  {/* 브랜드별 제품가 */}
                  {priceBrands.map((b) => {
                    const key = BRAND_KEY[b];
                    if (isCustom || isFixed) {
                      const val = item.manualPrice?.[key] ?? 0;
                      return (
                        <td key={b} style={{ padding: '3px 4px' }}>
                          <input className="input" type="text" inputMode="numeric"
                            style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12, color: BRAND_COLOR[b] }}
                            value={val || ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              updateManualPrice(item.id, key, raw === '' ? 0 : parseInt(raw, 10));
                            }}
                            placeholder={isFixed ? String(item.manualPrice?.[key] ?? 0) : '직접입력'} />
                        </td>
                      );
                    }
                    const amt = ip?.[key] ?? 0;
                    return (
                      <td key={b} style={{ textAlign: 'right', fontSize: 12,
                        color: amt ? BRAND_COLOR[b] : 'var(--color-text-faint)' }}>
                        {fmt(amt)}
                      </td>
                    );
                  })}

                  {/* 시공/철거/마감 합계 */}
                  {showPrice && (
                    <>
                      <td style={{ textAlign: 'right', fontSize: 12, color: ip?.labor ? '#374151' : 'var(--color-text-faint)' }}>
                        {fmt(ip?.labor ?? 0)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: ip?.demo ? '#2563eb' : 'var(--color-text-faint)' }}>
                        {fmt(ip?.demo ?? 0)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: ip?.finish ? '#059669' : 'var(--color-text-faint)' }}>
                        {fmt(ip?.finish ?? 0)}
                      </td>
                    </>
                  )}

                  {/* 옵션 토글 */}
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" title="시공/철거/마감 옵션"
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        background: isExp ? 'var(--color-blue)' : 'none',
                        border: `1px solid ${isExp ? 'var(--color-blue)' : 'var(--color-border)'}`,
                        borderRadius: 4, cursor: 'pointer', padding: '3px 6px',
                        fontSize: 11, color: isExp ? '#fff' : 'var(--color-text-muted)',
                      }}>
                      {isExp ? '▲' : '▼'}
                    </button>
                  </td>

                  {/* 삭제 */}
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeRow(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-faint)', fontSize: 16, lineHeight: 1 }}>
                      ✕
                    </button>
                  </td>
                </tr>,

                // ── 옵션 확장 행 ──
                isExp && (
                  <tr key={`opt-${item.id}`}>
                    <td colSpan={colSpan} style={{ background: '#f8fafc', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>

                        {/* 시공비 포함 토글 */}
                        {constEnabled && item.pType !== 'fixed' && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={item.laborEnabled}
                              onChange={(e) => update(item.id, 'laborEnabled', e.target.checked)} />
                            <span style={{ fontWeight: 600 }}>시공비 포함</span>
                          </label>
                        )}

                        {/* 철거 유형 */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
                            철거
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {DM_OPTIONS.map((dm) => (
                              <label key={dm} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox"
                                  checked={item.dmTypes.includes(dm)}
                                  onChange={() => toggleDm(item.id, dm)} />
                                {dm}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 마감 유형 */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 4 }}>
                            마감
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            {FN_OPTIONS.map((fn) => (
                              <label key={fn} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox"
                                  checked={item.fnTypes.includes(fn)}
                                  onChange={() => toggleFn(item.id, fn)} />
                                {fn}
                              </label>
                            ))}
                            {(item.fnTypes.includes('사춤') || item.fnTypes.includes('타일') || item.fnTypes.includes('브라켓')) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>W(m):</span>
                                <input className="input" type="text" inputMode="decimal"
                                  style={{ width: 60, padding: '3px 6px', fontSize: 12 }}
                                  value={item.fnW ?? ''}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    update(item.id, 'fnW', isNaN(v) ? undefined : v);
                                  }}
                                  placeholder={item.w ? String(+(item.w / 1000).toFixed(2)) : '0.00'} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 메모 */}
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                            메모
                          </div>
                          <input className="input" style={{ fontSize: 12, padding: '4px 6px' }}
                            value={item.nt ?? ''}
                            onChange={(e) => update(item.id, 'nt', e.target.value)}
                            placeholder="메모 (선택)" />
                        </div>

                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-faint)' }}>
        ※ ▼ 버튼으로 시공·철거·마감 옵션을 설정할 수 있습니다.
        {showPrice && ' 가격은 선택된 등급 기준이며 참고용입니다.'}
      </p>
    </div>
  );
}
