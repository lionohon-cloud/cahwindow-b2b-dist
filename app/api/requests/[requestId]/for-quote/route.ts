import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: '견적요청을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 대기 → 확인으로 자동 전환
  if (data.status === '대기') {
    await supabase
      .from('quote_requests')
      .update({ status: '확인', updated_at: new Date().toISOString() })
      .eq('request_id', requestId);
  }

  // GAS setState() 포맷으로 변환
  const payload = {
    success: true,
    requestId: data.request_id,
    clientInfo: {
      name:        data.client_name    ?? '',
      ceo:         data.client_ceo     ?? '',
      contact:     data.client_contact ?? '',
      phone:       data.client_phone   ?? '',
      email:       data.client_email   ?? '',
      bizNo:       data.client_biz_no  ?? '',
    },
    siteInfo: {
      name:      data.site_name    ?? '',
      address:   data.site_address ?? '',
      detail:    data.site_detail  ?? '',
      floor:     data.site_floor   ?? '',
      sido:      data.site_sido    ?? '',
      constType: data.const_type   ?? '시공포함',
      resType:   data.res_type     ?? '거주세대',
      wishDate:  data.wish_date    ?? '',
    },
    items:  data.items  ?? [],
    grades: data.grades ?? {},
    memo:   data.memo   ?? '',
    metadata: {
      leaderId:       data.leader_id,
      leaderName:     data.leader_name   ?? '',
      linkedQuoteId:  data.linked_quote_id ?? null,
      status:         data.status,
      submittedAt:    data.submitted_at,
    },
  };

  return NextResponse.json(payload);
}
