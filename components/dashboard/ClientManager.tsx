'use client';

import { useState, useEffect, useCallback } from 'react';
import type { B2BClient } from '@/types';
import { formatPhone, formatBizNo, formatDate, copyToClipboard } from '@/lib/utils';

interface Props {
  leaderId: string;
  leaderName: string;
}

const EMPTY_FORM = { name:'', ceo:'', contact_person:'', phone:'', email:'', biz_no:'', address:'', memo:'' };

export default function ClientManager({ leaderId, leaderName }: Props) {
  const [clients, setClients] = useState<B2BClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', { headers: { 'x-leader-id': leaderId } });
      const data = await res.json();
      if (data.success) setClients(data.clients);
    } finally { setLoading(false); }
  }, [leaderId]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('거래처명을 입력해 주세요.'); return; }
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-leader-id': leaderId,
          'x-leader-name': leaderName,
        },
        body: JSON.stringify({ ...form, biz_no: form.biz_no.replace(/-/g, '') }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
      showToast('거래처가 등록되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록 오류');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button type="button" className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
          {showForm ? '취소' : '+ 거래처 등록'}
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="section-title">신규 거래처 등록</div>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div className="form-row">
              <div className="form-group">
                <label>거래처명 <span style={{color:'var(--color-red)'}}>*</span></label>
                <input className="input" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} />
              </div>
              <div className="form-group">
                <label>사업자번호</label>
                <input className="input" value={form.biz_no}
                  onChange={(e) => setForm({...form, biz_no:formatBizNo(e.target.value)})} placeholder="000-00-00000" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>대표자</label>
                <input className="input" value={form.ceo} onChange={(e) => setForm({...form, ceo:e.target.value})} />
              </div>
              <div className="form-group">
                <label>담당자</label>
                <input className="input" value={form.contact_person} onChange={(e) => setForm({...form, contact_person:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>연락처</label>
                <input className="input" value={form.phone}
                  onChange={(e) => setForm({...form, phone:formatPhone(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>주소</label>
              <input className="input" value={form.address} onChange={(e) => setForm({...form, address:e.target.value})} />
            </div>
            <div className="form-group">
              <label>메모</label>
              <input className="input" value={form.memo} onChange={(e) => setForm({...form, memo:e.target.value})} />
            </div>
            {error && (
              <div style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, color:'var(--color-red)', fontSize:13 }}>
                {error}
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>취소</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 거래처 목록 */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏢</div>
          <p>등록된 거래처가 없습니다.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래처명</th><th>대표자</th><th>담당자</th><th>연락처</th><th>사업자번호</th><th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight:600 }}>{c.name}</td>
                  <td>{c.ceo || '-'}</td>
                  <td>{c.contact_person || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.biz_no ? formatBizNo(c.biz_no) : '-'}</td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
