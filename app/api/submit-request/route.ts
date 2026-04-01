import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRequestId } from '@/lib/utils';
import type { SubmitRequestPayload } from '@/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequestPayload = await req.json();

    const {
      leaderId, clientName, clientPhone, clientCeo, clientContact,
      clientEmail, clientBizNo, clientId,
      siteName, siteAddress, siteDetail, siteFloor, siteSido,
      constType, resType, wishDate,
      items, grades, options, coupons, memo,
    } = body;

    if (!leaderId || !clientName || !items?.length) {
      return NextResponse.json(
        { success: false, error: '필수값 누락 (leaderId, clientName, items)' },
        { status: 400 }
      );
    }

    const requestId = await generateRequestId(clientName, clientBizNo ?? '');

    const { error } = await supabase.from('quote_requests').insert({
      request_id: requestId,
      leader_id: leaderId,
      client_id: clientId ?? null,
      client_name: clientName,
      client_phone: clientPhone ?? null,
      client_ceo: clientCeo ?? null,
      client_contact: clientContact ?? null,
      client_email: clientEmail ?? null,
      client_biz_no: clientBizNo ?? null,
      site_name: siteName ?? null,
      site_address: siteAddress ?? null,
      site_detail: siteDetail ?? null,
      site_floor: siteFloor ?? null,
      site_sido: siteSido ?? null,
      const_type: constType ?? '시공포함',
      res_type: resType ?? '거주세대',
      wish_date: wishDate ?? null,
      items,
      grades: grades ?? {},
      options: options ?? {},
      coupons: coupons ?? [],
      memo: memo ?? null,
      status: '대기',
      source: 'dist-request',
    });

    if (error) throw error;

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error('[submit-request]', err);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
