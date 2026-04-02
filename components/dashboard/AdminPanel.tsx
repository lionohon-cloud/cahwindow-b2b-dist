'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminCoupon {
  id: string;
  coupon_id: string;
  name: string;
  type: 'rate' | 'amt';
  rate: number;
  amt: number;
  condition: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  name: '', type: 'rate' as 'rate' | 'amt', rate: 0, amt: 0,
  condition: '', valid_from: '', valid_until: '', is_active: true,
};

interface Props { leaderId: string; }

export default function AdminPanel({ leaderId }: Props) {
  // ── 부가율 ──
  const [markup, setMarkup]           = useState<number | null>(null);
  const [markupInput, setMarkupInput] = useState('');
  const [markupSaving, setMarkupSaving] = useState(false);
  const [markupMsg, setMarkupMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  // ── 쿠폰 ──
  const [coupons, setCoupons]         = useState<AdminCoupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formSaving, setFormSaving]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [toast, setToast]             = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  // ── 부가율 로드 ──
  useEffect(() => {
    fetch('/api/admin/markup')
      .then((r) => r.json())
      .then((d) => { if (d.success) { setMarkup(d.b2bMarkup); setMarkupInput(String(d.b2bMarkup)); } });
  }, []);

  // ── 쿠폰 로드 ──
  const loadCoupons = useCallback(async () => {
    setCouponLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', { headers: { 'x-leader-id': leaderId } });
      const d = await res.json();
      if (d.success) setCoupons(d.coupons);
    } finally { setCouponLoading(false); }
  }, [leaderId]);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  // ── 부가율 저장 ──
  async function saveMarkup() {
    const val = parseInt(markupInput, 10);
    if (isNaN(val) || val < 100 || val > 300) {
      setMarkupMsg({ text: '100~300 사이 정수를 입력해 주세요.', ok: false });
      return;
    }
    setMarkupSaving(true);
    setMarkupMsg(null);
    try {
      const res = await fetch('/api/admin/markup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-leader-id': leaderId },
        body: JSON.stringify({ b2bMarkup: val }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      setMarkup(val);
      setMarkupMsg({ text: `부가율이 ${val}%로 변경되었습니다.`, ok: true });
      setTimeout(() => setMarkupMsg(null), 3000);
    } catch (e) {
      setMarkupMsg({ text: e instanceof Error ? e.message : '저장 오류', ok: false });
    } finally { setMarkupSaving(false); }
  }

  // ── 쿠폰 폼 제출 ──
  async function handleCouponSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('쿠폰명을 입력해 주세요.'); return; }
    if (form.type === 'rate' && (form.rate <= 0 || form.rate > 100)) {
      setFormError('정률 할인은 1~100 사이 값이어야 합니다.'); return;
    }
    if (form.type === 'amt' && form.amt <= 0) {
      setFormError('정액 할인 금액을 입력해 주세요.'); return;
    }
    setFormError(''); setFormSaving(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-leader-id': leaderId },
        body: JSON.stringify(editId ? { id: editId, ...form } : form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      resetForm();
      loadCoupons();
      showToast(editId ? '쿠폰이 수정되었습니다.' : '쿠폰이 등록되었습니다.');
    } catch (e) { setFormError(e instanceof Error ? e.message : '저장 오류'); }
    finally { setFormSaving(false); }
  }

  function resetForm() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setFormError(''); }

  // ── 쿠폰 삭제 ──
  async function deleteCoupon(id: string, name: string) {
    if (!confirm(`"${name}" 쿠폰을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/coupons?id=${id}`, {
      method: 'DELETE', headers: { 'x-leader-id': leaderId },
    });
    const d = await res.json();
    if (d.success) { loadCoupons(); showToast('쿠폰이 삭제되었습니다.'); }
  }

  // ── 활성/비활성 토글 ──
  async function toggleActive(c: AdminCoupon) {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-leader-id': leaderId },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    });
    loadCoupons();
  }

  function startEdit(c: AdminCoupon) {
    setEditId(c.id);
    setForm({
      name: c.name, type: c.type, rate: c.rate, amt: c.amt,
      condition: c.condition ?? '', valid_from: c.valid_from ?? '',
      valid_until: c.valid_until ?? '', is_active: c.is_active,
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      {/* ── 부가율 설정 ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📊 부가율 설정</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          GAS 단가표 기준 배율입니다. 저장 즉시 모든 거래처 견적에 반영됩니다.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>현재 적용 중:</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-text)' }}>
              {markup !== null ? `${markup}%` : '—'}
            </span>
          </div>
          <input
            className="input" type="number" min={100} max={300}
            value={markupInput}
            onChange={(e) => setMarkupInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveMarkup(); }}
            style={{ width: 90 }}
            placeholder="145"
          />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveMarkup} disabled={markupSaving}>
            {markupSaving ? '저장 중...' : '저장'}
          </button>
        </div>
        {markupMsg && (
          <div style={{ marginTop: 10, fontSize: 13, color: markupMsg.ok ? '#16a34a' : 'var(--color-red)' }}>
            {markupMsg.text}
          </div>
        )}
      </div>

      {/* ── 쿠폰 관리 ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🎟 쿠폰 관리</div>
          <button
            type="button" className="btn btn-primary btn-sm"
            onClick={() => { if (showForm && !editId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
          >
            {showForm && !editId ? '취소' : '+ 쿠폰 추가'}
          </button>
        </div>

        {/* ── 추가/수정 폼 ── */}
        {showForm && (
          <form
            onSubmit={handleCouponSubmit}
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--color-text-muted)' }}>
              {editId ? '쿠폰 수정' : '새 쿠폰 추가'}
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>쿠폰 이름 *</label>
                <input
                  className="input" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예) 신규 거래처 할인권"
                />
              </div>
              <div className="form-group">
                <label>할인 방식</label>
                <select
                  className="select" value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'rate' | 'amt', rate: 0, amt: 0 }))}
                >
                  <option value="rate">정률 (%)</option>
                  <option value="amt">정액 (원)</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>{form.type === 'rate' ? '할인율 (%)' : '할인 금액 (원)'}</label>
                <input
                  className="input" type="number" min={0}
                  value={(form.type === 'rate' ? form.rate : form.amt) || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 0;
                    setForm((f) => f.type === 'rate' ? { ...f, rate: v } : { ...f, amt: v });
                  }}
                  placeholder={form.type === 'rate' ? '예) 5' : '예) 50000'}
                />
              </div>
              <div className="form-group">
                <label>조건 설명</label>
                <input
                  className="input" value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  placeholder="예) 최초 거래 후 1개월간"
                />
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>유효기간 시작일</label>
                <input className="input" type="date" value={form.valid_from}
                  onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>유효기간 종료일</label>
                <input className="input" type="date" value={form.valid_until}
                  onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <input
                type="checkbox" id="is_active_chk" checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="is_active_chk" style={{ fontSize: 13, cursor: 'pointer' }}>활성 상태</label>
            </div>
            {formError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--color-red)', marginBottom: 12 }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={formSaving}>
                {formSaving ? '저장 중...' : (editId ? '수정 완료' : '등록')}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>취소</button>
            </div>
          </form>
        )}

        {/* ── 쿠폰 목록 ── */}
        {couponLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
        ) : coupons.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}><p>등록된 쿠폰이 없습니다.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>쿠폰명</th>
                  <th style={{ width: 110 }}>할인</th>
                  <th>조건</th>
                  <th style={{ width: 180 }}>유효기간</th>
                  <th style={{ width: 72 }}>상태</th>
                  <th style={{ width: 108 }}></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{c.coupon_id}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1d4ed8' }}>
                      {c.type === 'rate' ? `${c.rate}%` : `${Number(c.amt).toLocaleString()}원`}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.condition || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {c.valid_from || c.valid_until
                        ? `${c.valid_from ?? '?'} ~ ${c.valid_until ?? '?'}`
                        : '기간 제한 없음'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: c.is_active ? '#16a34a' : 'var(--color-text-faint)', padding: 0 }}
                      >
                        {c.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>수정</button>
                        <button
                          type="button" className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-red)' }}
                          onClick={() => deleteCoupon(c.id, c.name)}
                        >삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
