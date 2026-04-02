'use client';

import { useState, useEffect } from 'react';
import { getSession, clearSession } from '@/lib/auth';
import type { SessionUser } from '@/types';
import LoginForm from '@/components/dashboard/LoginForm';
import RequestList from '@/components/dashboard/RequestList';
import ClientManager from '@/components/dashboard/ClientManager';
import LinkManager from '@/components/dashboard/LinkManager';
import CouponSettings from '@/components/dashboard/CouponSettings';
import AdminPanel from '@/components/dashboard/AdminPanel';

const BASE_TABS = ['견적요청', '거래처관리', '배포링크', '쿠폰설정'] as const;
type BaseTab = typeof BASE_TABS[number];
type Tab = BaseTab | 'Admin';

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('견적요청');

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session.user);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={(u) => setUser(u)} />;
  }

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* 헤더 */}
      <header style={{ background:'#fff', borderBottom:'2.5px solid #1a1a1a', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:56, position:'sticky', top:0, zIndex:20 }}>
        <div style={{ fontWeight:900, fontSize:16, letterSpacing:'-0.3px' }}>청암홈윈도우 B2B</div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:13, color:'var(--color-text-muted)' }}>
            {user.name} · {user.team}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { clearSession(); setUser(null); }}>
            로그아웃
          </button>
        </div>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px 16px' }}>
        {/* 탭 */}
        <div className="tabs" style={{ marginBottom:24 }}>
          {BASE_TABS.map((t) => (
            <button key={t} type="button" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === '견적요청' && '📋 '}
              {t === '거래처관리' && '🏢 '}
              {t === '배포링크' && '🔗 '}
              {t === '쿠폰설정' && '🎟 '}
              {t}
            </button>
          ))}
          {user.team === 'admin' && (
            <button type="button" className={`tab ${tab === 'Admin' ? 'active' : ''}`} onClick={() => setTab('Admin')}>
              ⚙️ Admin
            </button>
          )}
        </div>

        {/* 탭 콘텐츠 */}
        {tab === '견적요청' && (
          <RequestList leaderId={user.loginId} leaderName={user.name} />
        )}
        {tab === '거래처관리' && (
          <ClientManager leaderId={user.loginId} leaderName={user.name} />
        )}
        {tab === '배포링크' && (
          <LinkManager leaderId={user.loginId} leaderName={user.name} />
        )}
        {tab === '쿠폰설정' && (
          <CouponSettings leaderId={user.loginId} />
        )}
        {tab === 'Admin' && user.team === 'admin' && (
          <AdminPanel leaderId={user.loginId} />
        )}
      </div>
    </div>
  );
}
