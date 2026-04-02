import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
  const { data } = await supabase.from('config').select('value').eq('key', 'adm').single();
  const b2bMarkup = (data?.value as Record<string, unknown>)?.b2bMarkup ?? 145;
  return NextResponse.json({ success: true, b2bMarkup });
}

export async function POST(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const b2bMarkup = Number(body.b2bMarkup);
  if (!Number.isFinite(b2bMarkup) || b2bMarkup < 100 || b2bMarkup > 300) {
    return NextResponse.json({ success: false, error: '부가율은 100~300 사이 값이어야 합니다.' }, { status: 400 });
  }

  const { data: current } = await supabase.from('config').select('value').eq('key', 'adm').single();
  const currentVal = (current?.value as Record<string, unknown>) ?? {};

  const { error } = await supabase.from('config').upsert(
    { key: 'adm', value: { ...currentVal, b2bMarkup }, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, b2bMarkup });
}
