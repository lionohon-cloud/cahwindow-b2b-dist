'use client';

import type { QuoteRequest, RequestStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';

const B2B_PROGRAM_URL = '/sales-quote';

interface Props {
  req: QuoteRequest;
  leaderName: string;
  onClose: () => void;
  onStatusChange: (status: RequestStatus) => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #f3f4f6', fontSize:13 }}>
      <span style={{ width:100, flexShrink:0, color:'var(--color-text-muted)', fontWeight:600 }}>{label}</span>
      <span style={{ flex:1 }}>{value}</span>
    </div>
  );
}

export default function RequestModal({ req, leaderName, onClose, onStatusChange }: Props) {
  const STATUS_NEXT: Record<string, RequestStatus | null> = {
    '대기': '확인', '확인': '완료', '완료': null,
  };
  const next = STATUS_NEXT[req.status];

  function badgeClass(s: string) {
    if (s === '대기') return 'badge badge-wait';
    if (s === '확인') return 'badge badge-confirm';
    return 'badge badge-done';
  }

  function openB2B() {
    window.open(`${B2B_PROGRAM_URL}?reqId=${req.request_id}`, '_blank');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="modal-title">{req.client_name}</span>
            <span className={badgeClass(req.status)}>{req.status}</span>
            <span style={{ fontSize:11, color:'var(--color-text-faint)', background:'#f3f4f6', padding:'1px 7px', borderRadius:10 }}>
              가견적 요청
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 거래처 정보 */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:'var(--color-text-muted)' }}>거래처 정보</div>
            <Row label="거래처명" value={req.client_name} />
            <Row label="대표자" value={req.client_ceo} />
            <Row label="담당자" value={req.client_contact} />
            <Row label="연락처" value={req.client_phone} />
            <Row label="이메일" value={req.client_email} />
            <Row label="사업자번호" value={req.client_biz_no} />
          </div>

          {/* 현장 정보 */}
          {(req.site_name || req.site_address) && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:'var(--color-text-muted)' }}>현장 정보</div>
              <Row label="현장명" value={req.site_name} />
              <Row label="주소" value={[req.site_address, req.site_detail].filter(Boolean).join(' ')} />
              <Row label="층수" value={req.site_floor ? `${req.site_floor}층` : null} />
              <Row label="시공 방식" value={req.const_type} />
              <Row label="건물 용도" value={req.res_type} />
              <Row label="희망 시공일" value={req.wish_date} />
            </div>
          )}

          {/* 품목 */}
          {req.items?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:'var(--color-text-muted)' }}>
                품목 ({req.items.length}개)
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>위치</th><th>품명</th><th>너비</th><th>높이</th><th>수량</th><th>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.loc || '-'}</td>
                        <td>{item.nm || '-'}</td>
                        <td>{item.w ? `${item.w}mm` : '-'}</td>
                        <td>{item.h ? `${item.h}mm` : '-'}</td>
                        <td>{item.qty}</td>
                        <td>{item.nt || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 등급 선택 */}
          {req.grades && Object.keys(req.grades).length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:'var(--color-text-muted)' }}>브랜드/등급</div>
              {Object.entries(req.grades).filter(([,v]) => v).map(([brand, grade]) => (
                <div key={brand} style={{ fontSize:13, padding:'4px 0' }}>
                  <strong>{brand}</strong> — {grade}
                </div>
              ))}
            </div>
          )}

          {req.memo && (
            <div style={{ padding:'10px 14px', background:'#f9fafb', borderRadius:6, fontSize:13, color:'var(--color-text-muted)' }}>
              <strong>메모:</strong> {req.memo}
            </div>
          )}

          {req.linked_quote_id && (
            <div style={{ marginTop:12, padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:6, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:'#16a34a', fontWeight:700 }}>✓ 배포완료</span>
              <span style={{ color:'var(--color-text-muted)' }}>연동 견적번호:</span>
              <span style={{ fontWeight:600, fontFamily:'monospace' }}>{req.linked_quote_id}</span>
            </div>
          )}
          <div style={{ marginTop:12, fontSize:12, color:'var(--color-text-faint)' }}>
            제출일시: {formatDateTime(req.submitted_at)} | 요청번호: {req.request_id}
          </div>
        </div>

        <div className="modal-footer">
          {next && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStatusChange(next)}>
              → {next}로 변경
            </button>
          )}
          <button type="button" className="btn btn-blue" onClick={openB2B}>
            📊 영업팀장용 견적 작성하기
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
