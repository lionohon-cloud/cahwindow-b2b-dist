import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

function genCouponId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CPN-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// GET /api/admin/coupons — 전체 목록
export async function GET() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, coupons: data ?? [] });
}

// POST /api/admin/coupons — 쿠폰 생성
export async function POST(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { name, type, rate, amt, condition, valid_from, valid_until, is_active } = body;

  if (!name?.trim()) return NextResponse.json({ success: false, error: '쿠폰명 필수' }, { status: 400 });
  if (!['rate', 'amt'].includes(type)) return NextResponse.json({ success: false, error: '할인 방식 오류' }, { status: 400 });

  const { data, error } = await supabase.from('coupons').insert({
    coupon_id:   genCouponId(),
    name:        name.trim(),
    type,
    rate:        type === 'rate' ? Number(rate) : 0,
    amt:         type === 'amt'  ? Number(amt)  : 0,
    condition:   condition?.trim() || null,
    valid_from:  valid_from  || null,
    valid_until: valid_until || null,
    is_active:   is_active ?? true,
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, coupon: data });
}

// PATCH /api/admin/coupons — 쿠폰 수정 (body에 id 포함)
export async function PATCH(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { id, name, type, rate, amt, condition, valid_from, valid_until, is_active } = body;
  if (!id) return NextResponse.json({ success: false, error: 'id 필수' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name        !== undefined) updates.name        = name.trim();
  if (type        !== undefined) updates.type        = type;
  if (type === 'rate' && rate !== undefined) { updates.rate = Number(rate); updates.amt = 0; }
  if (type === 'amt'  && amt  !== undefined) { updates.amt  = Number(amt);  updates.rate = 0; }
  if (condition   !== undefined) updates.condition   = condition?.trim() || null;
  if (valid_from  !== undefined) updates.valid_from  = valid_from  || null;
  if (valid_until !== undefined) updates.valid_until = valid_until || null;
  if (is_active   !== undefined) updates.is_active   = is_active;

  const { error } = await supabase.from('coupons').update(updates).eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/coupons?id= — 쿠폰 삭제
export async function DELETE(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id 필수' }, { status: 400 });

  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
