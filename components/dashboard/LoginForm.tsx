'use client';

import { useState } from 'react';
import { login } from '@/lib/auth';
import type { SessionUser } from '@/types';

interface Props {
  onLogin: (user: SessionUser) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) { setError('아이디와 비밀번호를 입력해 주세요.'); return; }
    setError(''); setLoading(true);
    try {
      const user = await login(loginId.trim(), password);
      onLogin(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontWeight:900, fontSize:22, letterSpacing:'-0.5px' }}>청암홈윈도우</div>
          <div style={{ fontSize:14, color:'var(--color-text-muted)', marginTop:4 }}>B2B 배포 관리 시스템</div>
        </div>
        <div className="card" style={{ padding:28 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label>아이디</label>
              <input className="input" value={loginId} autoComplete="username"
                onChange={(e) => setLoginId(e.target.value)} placeholder="아이디 입력" />
            </div>
            <div className="form-group">
              <label>비밀번호</label>
              <input className="input" type="password" value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" />
            </div>
            {error && (
              <div style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, color:'var(--color-red)', fontSize:13 }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:4 }}>
              {loading ? <><span className="spinner" style={{width:16,height:16}} /> 로그인 중...</> : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
