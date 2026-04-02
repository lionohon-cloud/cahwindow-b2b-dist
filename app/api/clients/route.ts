import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateClientId, generateLinkId, buildDistUrl } from '@/lib/utils';

export const runtime = 'edge';

// GET /api/clients?leader={id}
export async function GET(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('b2b_clients')
    .select('*')
    .eq('registered_by', leaderId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, clients: data });
}

// POST /api/clients — 거래처 등록
export async function POST(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  const leaderName = decodeURIComponent(req.headers.get('x-leader-name') ?? '');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const body = await req.json();
  const { name, ceo, contact_person, phone, email, biz_no, address, memo } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: '거래처명 필수' }, { status: 400 });
  }

  // 중복 확인
  const { data: existing } = await supabase
    .from('b2b_clients')
    .select('id')
    .eq('registered_by', leaderId)
    .eq('name', name)
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: '이미 등록된 거래처명' }, { status: 409 });
  }

  const clientId = generateClientId();

  // 거래처 등록
  const { error: clientError } = await supabase.from('b2b_clients').insert({
    client_id: clientId,
    name,
    ceo: ceo ?? null,
    contact_person: contact_person ?? null,
    phone: phone ?? null,
    email: email ?? null,
    biz_no: biz_no ?? null,
    address: address ?? null,
    memo: memo ?? null,
    registered_by: leaderId,
    sales_rep: leaderName,
  });
  if (clientError) throw clientError;

  // 배포링크 자동 생성
  const linkId = generateLinkId();
  const linkUrl = buildDistUrl(leaderId, clientId);

  await supabase.from('dist_links').insert({
    link_id: linkId,
    leader_id: leaderId,
    leader_name: leaderName,
    client_id: clientId,
    client_name: name,
    link_url: linkUrl,
    is_active: true,
  });

  // 쿠폰 설정 초기화 (enabled=false 행 없이 필요 시 생성)
  // Phase 2에서 쿠폰 목록 확정 후 확장
  await supabase.from('coupon_settings').upsert(
    [{ leader_id: leaderId, client_id: clientId, coupon_id: 'CPN-001', coupon_name: '기본할인권', enabled: false }],
    { onConflict: 'leader_id,client_id,coupon_id' }
  );

  return NextResponse.json({ success: true, clientId, linkUrl });
}
