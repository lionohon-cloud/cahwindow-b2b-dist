'use client';

import { useState, useEffect, useCallback } from 'react';
import type { B2BClient, CouponSetting } from '@/types';

interface Props {
  leaderId: string;
}

export default function CouponSettings({ leaderId }: Props) {
  const [clients, setClients] = useState<B2BClient[]>([]);
  const [settings, setSettings] = useState<CouponSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientRes] = await Promise.all([
        fetch('/api/clients', { headers: { 'x-leader-id': leaderId } }),
      ]);
      const clientData = await clientRes.json();
      if (clientData.success) setClients(clientData.clients);
      // Phase 2에서 쿠폰 목록 API 추가 예정
    } finally { setLoading(false); }
  }, [leaderId]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 2500);
  }

  return (
    <div>
      {loading ? (
        <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="section-title">쿠폰 설정</div>
          <div style={{ padding:'16px 0', color:'var(--color-text-muted)', fontSize:13 }}>
            <p style={{ marginBottom:8 }}>
              거래처별 쿠폰 적용 여부를 설정합니다. 활성화된 쿠폰은 거래처 견적요청 시 선택 가능합니다.
            </p>
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, padding:'10px 14px', fontSize:13, color:'#92400e' }}>
              ⚙️ 쿠폰 상세 설정은 Phase 2에서 구현 예정입니다.
            </div>
          </div>
          {clients.length > 0 && (
            <div className="table-wrap" style={{ marginTop:16 }}>
              <table className="data-table">
                <thead>
                  <tr><th>거래처</th><th>기본할인권</th></tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight:600 }}>{c.name}</td>
                      <td>
                        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                          <input type="checkbox" disabled style={{ accentColor:'var(--color-green)' }} />
                          <span style={{ fontSize:12, color:'var(--color-text-faint)' }}>Phase 2 적용</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
