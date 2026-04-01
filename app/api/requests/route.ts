import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

function getLeaderFromHeader(req: NextRequest): string | null {
  return req.headers.get('x-leader-id');
}

export async function GET(req: NextRequest) {
  const leaderId = getLeaderFromHeader(req);
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('quote_requests')
    .select('*', { count: 'exact' })
    .eq('leader_id', leaderId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== '전체') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, requests: data, total: count ?? 0 });
}
