'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { QuoteItem, LinkInfoResponse } from '@/types';
import { formatPhone, formatBizNo } from '@/lib/utils';
import { calcAllPrices } from '@/lib/calc';
import type { PdCostTable, QuotePrices } from '@/lib/calc';
import ItemTable from '@/components/quote/ItemTable';
import BrandCards from '@/components/quote/BrandCards';
import SiteInfoSection from '@/components/quote/SiteInfoSection';
import SpecTable from '@/components/quote/SpecTable';

const DEFAULT_GRADES: Record<string, string> = { LX: '시그니처', 홈윈도우: '시그니처', KCC: '시그니처' };

export default function QuotePage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}><span className="spinner" /></div>}>
      <QuoteContent />
    </Suspense>
  );
}

function QuoteContent() {
  const searchParams = useSearchParams();
  const leaderId = searchParams.get('leader') ?? '';
  const clientId = searchParams.get('client') ?? '';

  const [linkInfo, setLinkInfo]     = useState<LinkInfoResponse | null>(null);
  const [scaledCost, setScaledCost] = useState<PdCostTable | null>(null);
  const [prices, setPrices]         = useState<QuotePrices | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitted, setSubmitted]   = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // 폼 상태
  const [clientName, setClientName]       = useState('');
  const [clientPhone, setClientPhone]     = useState('');
  const [clientCeo, setClientCeo]         = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail]     = useState('');
  const [clientBizNo, setClientBizNo]     = useState('');
  const [constType, setConstType]         = useState('시공포함');
  const [resType, setResType]             = useState('거주세대');
  const [siteName, setSiteName]           = useState('');
  const [siteAddress, setSiteAddress]     = useState('');
  const [siteDetail, setSiteDetail]       = useState('');
  const [siteFloor, setSiteFloor]         = useState('');
  const [siteSido, setSiteSido]           = useState('');
  const [wishDate, setWishDate]           = useState('');
  const [memo, setMemo]                   = useState('');
  const [items, setItems]   = useState<QuoteItem[]>([
    { id: 1, loc: '', nm: '', w: 0, h: 0, qty: 1, nt: '' },
  ]);
  const [grades, setGrades] = useState<Record<string, string>>(DEFAULT_GRADES);

  // #9 #11 철거 (기본값: 체크)
  const [needsDemolition, setNeedsDemolition] = useState(true);
  // #10 보양
  const [needsBoyang, setNeedsBoyang]         = useState(false);
  // #12 인테리어 진행 여부
  const [interiorType, setInteriorType]       = useState('거주창호만');
  const [interiorNote, setInteriorNote]       = useState('');

  // 가격 재계산 디바운스 타이머
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (!leaderId) { setLoading(false); return; }

    fetch(`/api/link-info?leader=${leaderId}&client=${clientId}`)
      .then((r) => r.json())
      .then((data: LinkInfoResponse) => {
        setLinkInfo(data);
        if (data.client) {
          setClientName(data.client.name);
          setClientBizNo(data.client.bizNo ?? '');
          setClientCeo(data.client.ceo ?? '');
          setClientPhone(data.client.phone ?? '');
          setClientEmail(data.client.email ?? '');
        }
        if (data.scaledCost) {
          setScaledCost(data.scaledCost as PdCostTable);
        }
      })
      .finally(() => setLoading(false));
  }, [leaderId, clientId]);

  // 품목·등급 변경 시 가격 재계산 (디바운스 300ms)
  useEffect(() => {
    if (!scaledCost) return;
    if (calcTimer.current) clearTimeout(calcTimer.current);
    calcTimer.current = setTimeout(() => {
      const bgMk   = linkInfo?.adm?.bgMk ?? {};
      const cpns   = (linkInfo?.coupons ?? []).map((c) => ({ rate: c.rate, amt: c.amt }));
      const result = calcAllPrices(items, grades, bgMk, scaledCost, cpns);
      setPrices(result);
    }, 300);
    return () => { if (calcTimer.current) clearTimeout(calcTimer.current); };
  }, [items, grades, scaledCost, linkInfo]);

  const handleSubmit = useCallback(async () => {
    if (!clientName.trim()) { setError('거래처명을 입력해 주세요.'); return; }
    const validItems = items.filter((i) => i.nm.trim());
    if (!validItems.length) { setError('품목을 1개 이상 입력해 주세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId, clientId: clientId || undefined,
          clientName: clientName.trim(), clientPhone, clientCeo,
          clientContact, clientEmail,
          clientBizNo: clientBizNo.replace(/-/g, ''),
          siteName, siteAddress, siteDetail,
          siteFloor: siteFloor ? Number(siteFloor) : undefined,
          siteSido, constType, resType,
          wishDate: wishDate || undefined,
          items: validItems, grades, memo,
          options: {
            needsDemolition,
            needsBoyang,
            boyangQty: needsBoyang ? validQty : 0,
            interiorType: interiorType === '비고' ? (interiorNote.trim() || '비고') : interiorType,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSubmittedId(data.requestId);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 오류');
    } finally {
      setSubmitting(false);
    }
  }, [clientName, clientPhone, clientCeo, clientContact, clientEmail, clientBizNo,
      siteName, siteAddress, siteDetail, siteFloor, siteSido, constType, resType,
      wishDate, memo, items, grades, leaderId, clientId]);

  if (!leaderId) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div className="card" style={{ maxWidth: 400, textAlign:'center' }}>
          <p style={{ fontSize:32, marginBottom:12 }}>⚠️</p>
          <p style={{ fontWeight:700, marginBottom:8 }}>유효하지 않은 링크입니다.</p>
          <p style={{ color:'var(--color-text-muted)', fontSize:13 }}>영업담당자에게 올바른 링크를 요청해 주세요.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div className="card" style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
          <p style={{ fontSize:40, marginBottom:12 }}>✅</p>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>가견적 신청 완료!</h2>
          <p style={{ color:'var(--color-text-muted)', marginBottom:16 }}>
            요청번호: <strong style={{ color:'var(--color-text)' }}>{submittedId}</strong>
          </p>
          <div style={{ background:'var(--color-green-light)', border:'1px solid #6ee7b7', borderRadius:8, padding:'14px 16px', fontSize:13, color:'#065f46', textAlign:'left' }}>
            <p style={{ margin:0, fontWeight:600 }}>📞 담당자 연락처</p>
            <p style={{ margin:'6px 0 0', fontSize:13 }}>
              {linkInfo?.leader?.name ?? '담당자'} — {linkInfo?.leader?.phone ?? '연락 예정'}
            </p>
            <p style={{ margin:'6px 0 0', fontSize:12 }}>영업담당자가 확인 후 연락드릴 예정입니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const isReadonly     = !!clientId;
  const selectedBrands = Object.entries(grades).filter(([, g]) => !!g).map(([b]) => b);

  // 추가 요금 계산
  const validQty      = items.filter((i) => i.nm.trim()).reduce((s, i) => s + i.qty, 0);
  const demolitionFee = needsDemolition ? 200_000 : 0;
  const boyangFee     = needsBoyang ? validQty * 20_000 : 0;

  return (
    <div style={{ minHeight:'100vh', paddingBottom:40 }}>
      {/* 헤더 */}
      <header style={{ background:'#fff', borderBottom:'2.5px solid #1a1a1a', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontWeight:900, fontSize:16, letterSpacing:'-0.3px' }}>청암홈윈도우</div>
          <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:2 }}>B2B 가견적 신청서</div>
        </div>
        {linkInfo?.leader && (
          <div style={{ fontSize:12, color:'var(--color-text-muted)', textAlign:'right' }}>
            <div style={{ fontWeight:600 }}>{linkInfo.leader.name}</div>
            <div>{linkInfo.leader.phone}</div>
          </div>
        )}
      </header>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ① 거래처 정보 */}
        <div className="card">
          <div className="section-title">① 거래처 정보</div>
          <div className="form-row" style={{ marginBottom:10 }}>
            <div className="form-group">
              <label>거래처명 <span style={{ color:'var(--color-red)' }}>*</span></label>
              <input className="input" value={clientName} readOnly={isReadonly}
                onChange={(e) => setClientName(e.target.value)} placeholder="예) 한솔인테리어" />
            </div>
            <div className="form-group">
              <label>사업자등록번호</label>
              <input className="input" value={clientBizNo} readOnly={isReadonly}
                onChange={(e) => setClientBizNo(formatBizNo(e.target.value))} placeholder="000-00-00000" />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom:10 }}>
            <div className="form-group">
              <label>대표자</label>
              <input className="input" value={clientCeo} readOnly={isReadonly}
                onChange={(e) => setClientCeo(e.target.value)} placeholder="홍길동" />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <input className="input" value={clientContact}
                onChange={(e) => setClientContact(e.target.value)} placeholder="담당자명" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>연락처</label>
              <input className="input" value={clientPhone}
                onChange={(e) => setClientPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" />
            </div>
            <div className="form-group">
              <label>이메일</label>
              <input className="input" type="email" value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)} placeholder="example@company.com" />
            </div>
          </div>
        </div>

        {/* ② 현장 정보 */}
        <SiteInfoSection
          siteName={siteName} setSiteName={setSiteName}
          siteAddress={siteAddress} setSiteAddress={setSiteAddress}
          siteDetail={siteDetail} setSiteDetail={setSiteDetail}
          siteFloor={siteFloor} setSiteFloor={setSiteFloor}
          setSiteSido={setSiteSido}
          constType={constType} setConstType={setConstType}
          resType={resType} setResType={setResType}
          wishDate={wishDate} setWishDate={setWishDate}
        />

        {/* ③ 시공 옵션 */}
        <div className="card">
          <div className="section-title">③ 시공 옵션</div>

          {/* #11 철거 */}
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={needsDemolition} onChange={(e) => setNeedsDemolition(e.target.checked)}
              style={{ width:18, height:18, cursor:'pointer', accentColor:'var(--color-primary)' }} />
            <span>
              <span style={{ fontWeight:600, fontSize:14 }}>창호 철거가 필요한가요?</span>
              <span style={{ marginLeft:8, fontSize:12, color:'var(--color-text-muted)' }}>
                기본 철거비 200,000원 {needsDemolition ? '포함' : '미포함'}
              </span>
            </span>
          </label>

          {/* #10 보양 */}
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={needsBoyang} onChange={(e) => setNeedsBoyang(e.target.checked)}
              style={{ width:18, height:18, cursor:'pointer', accentColor:'var(--color-primary)' }} />
            <span>
              <span style={{ fontWeight:600, fontSize:14 }}>보양이 필요한가요?</span>
              <span style={{ marginLeft:8, fontSize:12, color:'var(--color-text-muted)' }}>
                틀당 20,000원
                {needsBoyang && validQty > 0 && ` × ${validQty}틀 = ${(validQty * 20000).toLocaleString('ko-KR')}원`}
              </span>
            </span>
          </label>

          {/* #12 인테리어 진행 여부 */}
          <div>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>인테리어 진행 여부</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {(['거주창호만', '인테리어 예정', '비거주창호만', '비고'] as const).map((opt) => (
                <button key={opt} type="button"
                  onClick={() => setInteriorType(opt)}
                  style={{
                    padding:'6px 16px', borderRadius:20, fontSize:13, cursor:'pointer', transition:'all .15s',
                    border: `2px solid ${interiorType === opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: interiorType === opt ? 'var(--color-primary)' : '#fff',
                    color: interiorType === opt ? '#fff' : 'var(--color-text)',
                    fontWeight: interiorType === opt ? 700 : 500,
                  }}>
                  {opt}
                </button>
              ))}
            </div>
            {interiorType === '비고' && (
              <input className="input" style={{ marginTop:10 }} value={interiorNote}
                onChange={(e) => setInteriorNote(e.target.value)} placeholder="인테리어 관련 내용을 직접 입력해 주세요" />
            )}
          </div>
        </div>

        {/* ④ 브랜드 / 등급 선택 + 가견적 금액 */}
        <BrandCards
          grades={grades}
          setGrades={setGrades}
          prices={prices}
          coupons={linkInfo?.coupons}
          demolitionFee={demolitionFee}
          boyangFee={boyangFee}
        />

        {/* ⑤ 품목 */}
        <ItemTable
          items={items}
          setItems={setItems}
          itemPrices={prices?.itemPrices}
          selectedBrands={selectedBrands}
        />

        {/* 창호 사양 비교표 */}
        <SpecTable grades={grades} />

        {/* ⑤ 메모 */}
        <div className="card">
          <div className="section-title">⑥ 메모 (선택)</div>
          <textarea className="input" value={memo} onChange={(e) => setMemo(e.target.value)}
            placeholder="요청사항, 특이사항 등 자유롭게 입력해 주세요." rows={3} />
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, color:'var(--color-red)', fontSize:13 }}>
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button className="btn btn-primary btn-full btn-lg"
          onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><span className="spinner" style={{ width:16, height:16 }} /> 제출 중...</> : '📋 가견적 신청하기'}
        </button>

      </div>
    </div>
  );
}
