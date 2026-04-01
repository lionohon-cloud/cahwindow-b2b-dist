'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuoteRequest, RequestStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import RequestModal from './RequestModal';

const STATUS_FILTERS = ['전체', '대기', '확인', '완료'] as const;

interface Props {
  leaderId: string;
  leaderName: string;
}

export default function RequestList({ leaderId, leaderName }: Props) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      const res = await fetch(`/api/requests?${params}`, {
        headers: { 'x-leader-id': leaderId },
      });
      const data = await res.json();
      if (data.success) { setRequests(data.requests); setTotal(data.total); }
    } finally {
      setLoading(false);
    }
  }, [leaderId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(req: QuoteRequest, newStatus: RequestStatus) {
    await fetch(`/api/requests/${req.request_id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-leader-id': leaderId },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
    setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
  }

  function badgeClass(s: string) {
    if (s === '대기') return 'badge badge-wait';
    if (s === '확인') return 'badge badge-confirm';
    return 'badge badge-done';
  }

  return (
    <div>
      {/* 필터 */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f} type="button"
            className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(f)}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:13, color:'var(--color-text-muted)', alignSelf:'center' }}>
          총 {total}건
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>견적요청이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {requests.map((req) => (
            <div key={req.id} className="card" style={{ cursor:'pointer', padding:'14px 16px' }}
              onClick={() => setSelected(req)}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{req.client_name}</span>
                    <span className={badgeClass(req.status)}>{req.status}</span>
                    <span style={{ fontSize:11, color:'var(--color-text-faint)', background:'#f3f4f6', padding:'1px 7px', borderRadius:10 }}>
                      가견적 요청
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--color-text-muted)' }}>
                    {req.site_name && <span>{req.site_name} · </span>}
                    품목 {req.items?.length ?? 0}개
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--color-text-faint)', whiteSpace:'nowrap' }}>
                  {formatDateTime(req.submitted_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <RequestModal
          req={selected}
          leaderName={leaderName}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => changeStatus(selected, s)}
        />
      )}
    </div>
  );
}
