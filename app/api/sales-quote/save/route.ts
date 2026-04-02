import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalesQuoteId } from '@/lib/utils';
import type { SalesQuotePayload } from '@/types/sales-quote';

export const runtime = 'edge';

// POST /api/sales-quote/save
// 영업팀 견적 저장
// 인증: x-leader-id 헤더
export async function POST(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  try {
    const body: SalesQuotePayload = await req.json();
    const {
      leaderName,
      clientName, clientPhone, clientCeo, clientContact,
      clientEmail, clientBizNo, clientId,
      siteName, siteAddress, siteDetail, siteFloor, siteSido,
      constType, resType, wishDate,
      items, grades, zone, extraItems, boyanFrames, memo,
      linkedRequestId,
    } = body;

    if (!clientName?.trim() || !items?.length) {
      return NextResponse.json(
        { success: false, error: '필수값 누락 (clientName, items)' },
        { status: 400 },
      );
    }

    const requestId = await generateSalesQuoteId(
      clientName,
      clientBizNo ?? '',
      linkedRequestId,
    );

    const { error } = await supabase.from('quote_requests').insert({
      request_id: requestId,
      leader_id:  leaderId,
      leader_name: leaderName ?? null,
      client_id:   clientId ?? null,
      client_name: clientName.trim(),
      client_phone:   clientPhone   ?? null,
      client_ceo:     clientCeo     ?? null,
      client_contact: clientContact ?? null,
      client_email:   clientEmail   ?? null,
      client_biz_no:  clientBizNo   ?? null,
      site_name:    siteName    ?? null,
      site_address: siteAddress ?? null,
      site_detail:  siteDetail  ?? null,
      site_floor:   siteFloor   ?? null,
      site_sido:    siteSido    ?? null,
      const_type: constType ?? '시공포함',
      res_type:   resType   ?? '거주세대',
      wish_date:  wishDate  ?? null,
      items,
      grades: grades ?? {},
      options: { zone, extraItems, boyanFrames },
      coupons: [],
      memo: memo ?? null,
      status: '완료',
      source: 'sales-quote',
      linked_quote_id: linkedRequestId ?? null,
    });

    if (error) throw error;

    // 원본 거래처 요청 → 완료 처리 + linked_quote_id 연결
    if (linkedRequestId) {
      await supabase
        .from('quote_requests')
        .update({
          status: '완료',
          linked_quote_id: requestId,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', linkedRequestId);
    }

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error('[sales-quote/save]', err);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
