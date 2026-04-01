import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateLinkId, buildDistUrl } from '@/lib/utils';

export const runtime = 'edge';

// GET /api/links — 배포링크 목록
export async function GET(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('dist_links')
    .select('*')
    .eq('leader_id', leaderId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // 공통 링크(client_id=null)와 전용 링크 분리
  const commonLink = data?.find((l) => !l.client_id) ?? null;
  const clientLinks = data?.filter((l) => l.client_id) ?? [];

  return NextResponse.json({ success: true, commonLink, clientLinks });
}

// POST /api/links — 공통 링크 생성 (없을 때)
export async function POST(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  const leaderName = req.headers.get('x-leader-name') ?? '';
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  // 이미 공통 링크가 있으면 반환
  const { data: existing } = await supabase
    .from('dist_links')
    .select('*')
    .eq('leader_id', leaderId)
    .is('client_id', null)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, link: existing });
  }

  const linkId = generateLinkId();
  const linkUrl = buildDistUrl(leaderId);

  const { data, error } = await supabase
    .from('dist_links')
    .insert({
      link_id: linkId,
      leader_id: leaderId,
      leader_name: leaderName,
      client_id: null,
      client_name: null,
      link_url: linkUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, link: data });
}
