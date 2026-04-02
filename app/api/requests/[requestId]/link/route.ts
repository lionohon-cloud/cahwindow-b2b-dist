import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const { quoteId } = await req.json();

  if (!quoteId) {
    return NextResponse.json({ success: false, error: 'quoteId 필요' }, { status: 400 });
  }

  const { error } = await supabase
    .from('quote_requests')
    .update({
      linked_quote_id: quoteId,
      status: '완료',
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
