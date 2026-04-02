'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DistLink } from '@/types';
import { formatDate, copyToClipboard } from '@/lib/utils';

interface Props {
  leaderId: string;
  leaderName: string;
}

export default function LinkManager({ leaderId, leaderName }: Props) {
  const [commonLink, setCommonLink] = useState<DistLink | null>(null);
  const [clientLinks, setClientLinks] = useState<DistLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/links', { headers: { 'x-leader-id': leaderId } });
      const data = await res.json();
      if (data.success) {
        setCommonLink(data.commonLink);
        setClientLinks(data.clientLinks);
      }
    } finally { setLoading(false); }
  }, [leaderId]);

  useEffect(() => { load(); }, [load]);

  async function createCommonLink() {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'x-leader-id': leaderId, 'x-leader-name': encodeURIComponent(leaderName) },
    });
    const data = await res.json();
    if (data.success) { setCommonLink(data.link); showToast('공통 링크가 생성되었습니다.'); }
  }

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 2500);
  }

  async function copy(url: string) {
    await copyToClipboard(url);
    showToast('링크가 클립보드에 복사되었습니다.');
  }

  return (
    <div>
      {loading ? (
        <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div>
      ) : (
        <>
          {/* 공통 링크 */}
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📢 공통 배포 링크</div>
            <p style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:12 }}>
              모든 거래처에 공용으로 사용할 수 있는 링크입니다. 거래처 정보를 직접 입력하게 됩니다.
            </p>
            {commonLink ? (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input className="input" value={commonLink.link_url} readOnly style={{ flex:1, fontSize:12 }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(commonLink.link_url)}>
                  📋 복사
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={createCommonLink}>
                + 공통 링크 생성
              </button>
            )}
          </div>

          {/* 거래처별 전용 링크 */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🔗 거래처 전용 링크</div>
            <p style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:12 }}>
              거래처 등록 시 자동 생성됩니다. 거래처 정보가 자동으로 채워집니다.
            </p>
            {clientLinks.length === 0 ? (
              <div className="empty-state" style={{ padding:'24px 0' }}>
                <p>등록된 거래처의 전용 링크가 없습니다. 거래처를 먼저 등록해 주세요.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>거래처명</th><th>링크</th><th>생성일</th><th style={{width:60}}></th></tr>
                  </thead>
                  <tbody>
                    {clientLinks.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight:600 }}>{l.client_name}</td>
                        <td style={{ maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'var(--color-text-muted)' }}>
                          {l.link_url}
                        </td>
                        <td>{formatDate(l.created_at)}</td>
                        <td>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(l.link_url)}>
                            복사
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
