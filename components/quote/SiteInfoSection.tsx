'use client';

import Script from 'next/script';
import { useCallback } from 'react';

interface Props {
  siteName: string; setSiteName: (v: string) => void;
  siteAddress: string; setSiteAddress: (v: string) => void;
  siteDetail: string; setSiteDetail: (v: string) => void;
  siteFloor: string; setSiteFloor: (v: string) => void;
  setSiteSido: (v: string) => void;
  constType: string; setConstType: (v: string) => void;
  resType: string; setResType: (v: string) => void;
  wishDate: string; setWishDate: (v: string) => void;
}

declare global {
  interface Window {
    daum?: { Postcode: new (opts: { oncomplete: (data: { address: string; sido: string }) => void }) => { open: () => void } };
  }
}

export default function SiteInfoSection({
  siteName, setSiteName, siteAddress, setSiteAddress,
  siteDetail, setSiteDetail, siteFloor, setSiteFloor,
  setSiteSido, constType, setConstType, resType, setResType,
  wishDate, setWishDate,
}: Props) {
  const openPostcode = useCallback(() => {
    if (!window.daum) return;
    new window.daum.Postcode({
      oncomplete(data) {
        setSiteAddress(data.address);
        setSiteSido(data.sido);
      },
    }).open();
  }, [setSiteAddress, setSiteSido]);

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <div className="card">
        <div className="section-title">② 현장 정보</div>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label>현장명</label>
            <input className="input" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="예) OO아파트 101동 202호" />
          </div>
          <div className="form-group">
            <label>층수 (승강기 기준)</label>
            <input className="input" type="number" min={1} value={siteFloor}
              onChange={(e) => setSiteFloor(e.target.value)} placeholder="예) 12" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>현장 주소</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={siteAddress} readOnly placeholder="우편번호 검색 클릭" style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost btn-sm" style={{ whiteSpace:'nowrap' }} onClick={openPostcode}>
              🔍 주소 검색
            </button>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>상세 주소</label>
          <input className="input" value={siteDetail} onChange={(e) => setSiteDetail(e.target.value)} placeholder="동·호수, 상세 위치" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시공 방식</label>
            <select className="select" value={constType} onChange={(e) => setConstType(e.target.value)}>
              <option>시공포함</option>
              <option>자재만</option>
            </select>
          </div>
          <div className="form-group">
            <label>건물 용도</label>
            <select className="select" value={resType} onChange={(e) => setResType(e.target.value)}>
              <option>거주세대</option>
              <option>비거주세대</option>
              <option>상업시설</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label>희망 시공일</label>
          <input className="input" type="date" value={wishDate} onChange={(e) => setWishDate(e.target.value)} />
        </div>
      </div>
    </>
  );
}
