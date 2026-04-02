import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

// GET /api/sales-quote/load-request?reqId=한솔-7890-01
// 거래처 견적 요청 불러오기 (reqId 파라미터)
// 인증: x-leader-id 헤더
export async function GET(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reqId = searchParams.get('reqId');
  if (!reqId) {
    return NextResponse.json({ success: false, error: 'reqId 파라미터 필요' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('request_id', reqId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: '요청을 찾을 수 없습니다' },
      { status: 404 },
    );
  }

  // 상태 '대기' → '확인' 자동 전환
  if (data.status === '대기') {
    await supabase
      .from('quote_requests')
      .update({ status: '확인', updated_at: new Date().toISOString() })
      .eq('request_id', reqId);
  }

  return NextResponse.json({ success: true, request: data });
}
