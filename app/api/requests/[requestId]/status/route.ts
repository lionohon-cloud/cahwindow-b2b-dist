import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const { requestId } = await params;
  const { status } = await req.json();

  const validStatuses = ['대기', '확인', '완료'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ success: false, error: '유효하지 않은 상태값' }, { status: 400 });
  }

  const { error } = await supabase
    .from('quote_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('request_id', requestId)
    .eq('leader_id', leaderId);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
