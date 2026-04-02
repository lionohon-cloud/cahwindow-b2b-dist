'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { formatPhone, formatBizNo } from '@/lib/utils';
import type { SessionUser } from '@/types';
import type { SalesQuoteItem, ExtraItemEntry } from '@/types/sales-quote';
import { DEFAULT_EXTRA_ITEMS } from '@/types/sales-quote';
import { calcAllSalesPrices } from '@/lib/sales-calc';
import type { PdCostTable } from '@/lib/calc';
import type { SalesPrices } from '@/lib/sales-calc';
import LoginForm from '@/components/dashboard/LoginForm';
import SiteInfoSection from '@/components/quote/SiteInfoSection';
import BrandCards from '@/components/quote/BrandCards';
import SalesItemTable from '@/components/sales-quote/SalesItemTable';
import ExtraItemsSection from '@/components/sales-quote/ExtraItemsSection';
import LogisticsSection from '@/components/sales-quote/LogisticsSection';
import SalesPriceSummary from '@/components/sales-quote/SalesPriceSummary';

const DEFAULT_GRADES: Record<string, string> = { LX: '시그니처', 홈윈도우: '시그니처', KCC: '시그니처' };

function makeDefaultItem(): SalesQuoteItem {
  return { id: 1, loc: '', pType: '일반', isDouble: false, winW: 2, w: 0, h: 0, qty: 1, nt: '', laborEnabled: true, dmTypes: [], fnTypes: [] };
}

export default function SalesQuotePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" />
      </div>
    }>
      <SalesQuoteContent />
    </Suspense>
  );
}

function SalesQuoteContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get('reqId') ?? '';

  // ── 인증 ──
  const [user, setUser]   = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  // ── 가격 데이터 ──
  const [scaledCost, setScaledCost] = useState<PdCostTable | null>(null);
  const [bgMk, setBgMk]             = useState<Record<string, Record<string, number>>>({});
  const [prices, setPrices]         = useState<SalesPrices | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  // ── reqId 배너 ──
  const [reqBanner, setReqBanner] = useState<{ requestId: string; clientName: string } | null>(null);
  const [linkedRequestId, setLinkedRequestId] = useState<string>('');

  // ── 거래처 정보 ──
  const [clientName, setClientName]       = useState('');
  const [clientPhone, setClientPhone]     = useState('');
  const [clientCeo, setClientCeo]         = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail]     = useState('');
  const [clientBizNo, setClientBizNo]     = useState('');
  const [clientId, setClientId]           = useState('');

  // ── 현장 정보 ──
  const [siteName, setSiteName]       = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteDetail, setSiteDetail]   = useState('');
  const [siteFloor, setSiteFloor]     = useState('');
  const [siteSido, setSiteSido]       = useState('');
  const [constType, setConstType]     = useState('시공포함');
  const [resType, setResType]         = useState('거주세대');
  const [wishDate, setWishDate]       = useState('');
  const [memo, setMemo]               = useState('');

  // ── 품목/등급 ──
  const [items, setItems]   = useState<SalesQuoteItem[]>([makeDefaultItem()]);
  const [grades, setGrades] = useState<Record<string, string>>(DEFAULT_GRADES);

  // ── 추가항목/물류 ──
  const [extraItems, setExtraItems]   = useState<ExtraItemEntry[]>(DEFAULT_EXTRA_ITEMS.map((it) => ({ ...it })));
  const [boyanFrames, setBoyanFrames] = useState(0);
  const [zone, setZone]               = useState<'A' | 'B' | 'C'>('A');

  // ── 저장 ──
  const [saving, setSaving]     = useState(false);
  const [savedId, setSavedId]   = useState('');
  const [error, setError]       = useState('');

  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const constEnabled = constType === '시공포함';

  // ── 1. 세션 확인 ──
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session.user);
    setReady(true);
  }, []);

  // ── 2. 초기 데이터 로드 (로그인 후) ──
  useEffect(() => {
    if (!user) return;
    setInitLoading(true);
    fetch('/api/sales-quote/init', {
      headers: { 'x-leader-id': user.loginId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBgMk(data.adm?.bgMk ?? {});
          if (data.scaledCost) setScaledCost(data.scaledCost as PdCostTable);
        }
      })
      .finally(() => setInitLoading(false));
  }, [user]);

  // ── 3. reqId 파라미터 → 거래처 견적 자동 불러오기 ──
  useEffect(() => {
    if (!reqId || !user) return;
    fetch(`/api/sales-quote/load-request?reqId=${encodeURIComponent(reqId)}`, {
      headers: { 'x-leader-id': user.loginId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.request) return;
        const req = data.request;
        // 폼 채우기
        setClientName(req.client_name ?? '');
        setClientPhone(req.client_phone ?? '');
        setClientCeo(req.client_ceo ?? '');
        setClientContact(req.client_contact ?? '');
        setClientEmail(req.client_email ?? '');
        setClientBizNo(req.client_biz_no ?? '');
        setClientId(req.client_id ?? '');
        setSiteName(req.site_name ?? '');
        setSiteAddress(req.site_address ?? '');
        setSiteDetail(req.site_detail ?? '');
        setSiteFloor(req.site_floor ? String(req.site_floor) : '');
        setSiteSido(req.site_sido ?? '');
        setConstType(req.const_type ?? '시공포함');
        setResType(req.res_type ?? '거주세대');
        setWishDate(req.wish_date ?? '');
        setMemo(req.memo ?? '');
        // 품목: dist-request 의 QuoteItem → SalesQuoteItem 변환
        if (Array.isArray(req.items) && req.items.length) {
          const converted: SalesQuoteItem[] = req.items.map((it: {
            id?: number; loc?: string; nm?: string; w?: number; h?: number; qty?: number; nt?: string; manualPrice?: { lx: number; hw: number; kcc: number };
          }, idx: number) => ({
            id: (it.id ?? idx) + 100,
            loc: it.loc ?? '',
            pType: '일반' as const,
            isDouble: false,
            winW: 2 as const,
            customNm: it.nm,
            w: it.w ?? 0,
            h: it.h ?? 0,
            qty: it.qty ?? 1,
            nt: it.nt ?? '',
            laborEnabled: true,
            dmTypes: [],
            fnTypes: [],
            manualPrice: it.manualPrice,
          }));
          setItems(converted);
        }
        if (req.grades && typeof req.grades === 'object') {
          setGrades(req.grades as Record<string, string>);
        }
        setLinkedRequestId(req.request_id);
        setReqBanner({ requestId: req.request_id, clientName: req.client_name });
      });
  }, [reqId, user]);

  // ── 4. 가격 재계산 (디바운스 300ms) ──
  useEffect(() => {
    if (!scaledCost) return;
    if (calcTimer.current) clearTimeout(calcTimer.current);
    calcTimer.current = setTimeout(() => {
      const result = calcAllSalesPrices(
        items, grades, bgMk, scaledCost, [],
        zone, extraItems, boyanFrames, constEnabled,
      );
      setPrices(result);
    }, 300);
    return () => { if (calcTimer.current) clearTimeout(calcTimer.current); };
  }, [items, grades, bgMk, scaledCost, zone, extraItems, boyanFrames, constEnabled]);

  // ── 저장 ──
  const handleSave = useCallback(async () => {
    if (!user) return;
    if (!clientName.trim()) { setError('거래처명을 입력해 주세요.'); return; }
    const validItems = items.filter((i) => i.pType);
    if (!validItems.length) { setError('품목을 1개 이상 입력해 주세요.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/sales-quote/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-leader-id': user.loginId },
        body: JSON.stringify({
          leaderId: user.loginId,
          leaderName: user.name,
          clientName: clientName.trim(),
          clientPhone, clientCeo, clientContact, clientEmail,
          clientBizNo: clientBizNo.replace(/-/g, ''),
          clientId: clientId || undefined,
          siteName, siteAddress, siteDetail,
          siteFloor: siteFloor ? Number(siteFloor) : undefined,
          siteSido, constType, resType,
          wishDate: wishDate || undefined,
          items: validItems, grades, zone, extraItems, boyanFrames,
          memo: memo || undefined,
          linkedRequestId: linkedRequestId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSavedId(data.requestId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 오류');
    } finally {
      setSaving(false);
    }
  }, [user, clientName, clientPhone, clientCeo, clientContact, clientEmail, clientBizNo,
      clientId, siteName, siteAddress, siteDetail, siteFloor, siteSido, constType, resType,
      wishDate, memo, items, grades, zone, extraItems, boyanFrames, linkedRequestId]);

  // ── 렌더링 ──
  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={(u) => setUser(u)} />;
  }

  if (savedId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>견적 저장 완료!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
            견적 번호: <strong style={{ color: 'var(--color-text)' }}>{savedId}</strong>
          </p>
          {linkedRequestId && (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#065f46', marginBottom: 16 }}>
              원본 거래처 요청 <strong>{linkedRequestId}</strong> 상태가 완료로 처리되었습니다.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => {
              setSavedId(''); setLinkedRequestId(''); setReqBanner(null);
              setClientName(''); setItems([makeDefaultItem()]); setMemo('');
              setExtraItems(DEFAULT_EXTRA_ITEMS.map((it) => ({ ...it })));
            }}>
              새 견적 작성
            </button>
            <button className="btn btn-blue" onClick={() => window.location.href = '/dashboard'}>
              대시보드로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedBrands = Object.entries(grades).filter(([, g]) => !!g).map(([b]) => b);
  const maxProdTotal = prices
    ? Math.max(prices.productTotals.lx, prices.productTotals.hw, prices.productTotals.kcc, 0)
    : 0;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>

      {/* ─ 헤더 ─ */}
      <header style={{
        background: '#fff', borderBottom: '2.5px solid #1a1a1a',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.3px' }}>청암홈윈도우 B2B</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>영업팀 견적 작성</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {user.name} · {user.team}
          </span>
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => { clearSession(); setUser(null); }}>
            로그아웃
          </button>
        </div>
      </header>

      {/* ─ 가견적 요청 배너 (reqId 로드 시) ─ */}
      {reqBanner && (
        <div style={{
          background: '#fff7ed', borderBottom: '2px solid #fb923c',
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#9a3412' }}>
              가견적 요청 불러옴 — {reqBanner.clientName}
            </div>
            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>
              요청번호: <strong>{reqBanner.requestId}</strong> · 거래처에서 제출한 기초 견적자료입니다. 내용을 확인하고 수정 후 저장해 주세요.
            </div>
          </div>
          <button type="button"
            onClick={() => setReqBanner(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9a3412' }}>
            ✕
          </button>
        </div>
      )}

      {/* ─ 초기 로딩 ─ */}
      {initLoading && (
        <div style={{ textAlign: 'center', padding: '12px', fontSize: 13, color: 'var(--color-text-muted)', background: '#f9fafb' }}>
          <span className="spinner" style={{ width: 14, height: 14 }} /> 단가표 로드 중...
        </div>
      )}

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ① 거래처 정보 */}
        <div className="card">
          <div className="section-title">① 거래처 정보</div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label>거래처명 <span style={{ color: 'var(--color-red)' }}>*</span></label>
              <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="예) 한솔인테리어" />
            </div>
            <div className="form-group">
              <label>사업자등록번호</label>
              <input className="input" value={clientBizNo} onChange={(e) => setClientBizNo(formatBizNo(e.target.value))} placeholder="000-00-00000" />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label>대표자</label>
              <input className="input" value={clientCeo} onChange={(e) => setClientCeo(e.target.value)} placeholder="홍길동" />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <input className="input" value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="담당자명" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>연락처</label>
              <input className="input" value={clientPhone} onChange={(e) => setClientPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" />
            </div>
            <div className="form-group">
              <label>이메일</label>
              <input className="input" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="example@company.com" />
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

        {/* ③ 브랜드/등급 선택 */}
        <BrandCards
          grades={grades}
          setGrades={setGrades}
          prices={prices ? {
            itemPrices: [],
            totals: prices.productTotals,
            couponDisc: prices.couponDisc,
            supplyAmt: prices.supplyAmt,
            vat: prices.vat,
            final: prices.final,
          } : null}
          coupons={[]}
        />

        {/* ④ 품목 입력 (단창/이중창 선택 포함) */}
        <SalesItemTable
          items={items}
          setItems={setItems}
          itemPrices={prices?.itemPrices}
          selectedBrands={selectedBrands}
          constEnabled={constEnabled}
        />

        {/* ⑤ 추가항목 */}
        <ExtraItemsSection
          extraItems={extraItems}
          setExtraItems={setExtraItems}
          boyanFrames={boyanFrames}
          setBoyanFrames={setBoyanFrames}
        />

        {/* ⑥ 관리비·물류비 */}
        <LogisticsSection
          zone={zone}
          setZone={setZone}
          maxProductTotal={maxProdTotal}
        />

        {/* ⑦ 견적 금액 요약 */}
        <SalesPriceSummary prices={prices} grades={grades} />

        {/* ⑧ 메모 */}
        <div className="card">
          <div className="section-title">⑧ 메모 (선택)</div>
          <textarea className="input" value={memo} onChange={(e) => setMemo(e.target.value)}
            placeholder="특이사항, 요청사항 등을 자유롭게 입력해 주세요." rows={3} />
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: 'var(--color-red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* 저장 버튼 */}
        <button className="btn btn-primary btn-full btn-lg"
          onClick={handleSave} disabled={saving}>
          {saving
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> 저장 중...</>
            : linkedRequestId ? '💾 견적 저장 (요청 완료 처리)' : '💾 영업팀 견적 저장'}
        </button>

      </div>
    </div>
  );
}
