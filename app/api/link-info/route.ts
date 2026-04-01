import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leaderId = searchParams.get('leader');
  const clientId = searchParams.get('client');

  if (!leaderId) {
    return NextResponse.json({ success: false, error: 'leader 파라미터 필요' }, { status: 400 });
  }

  try {
    // 거래처 정보 조회
    let clientData = null;
    if (clientId) {
      const { data } = await supabase
        .from('b2b_clients')
        .select('*')
        .eq('client_id', clientId)
        .eq('registered_by', leaderId)
        .single();
      if (data) {
        clientData = {
          id: data.client_id,
          name: data.name,
          bizNo: data.biz_no ?? null,
          ceo: data.ceo ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
        };
      }
    }

    // 쿠폰 설정 조회
    let coupons: Array<{ id: string; name: string; rate: number; amt: number }> = [];
    if (clientId) {
      const { data: couponSettings } = await supabase
        .from('coupon_settings')
        .select('*')
        .eq('leader_id', leaderId)
        .eq('client_id', clientId)
        .eq('enabled', true);

      coupons = (couponSettings ?? []).map((c) => ({
        id: c.coupon_id,
        name: c.coupon_name ?? c.coupon_id,
        rate: 0,
        amt: 0,
      }));
    }

    // config 테이블에서 adm 설정 로드
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'adm')
      .single();

    const adm = configRow?.value ?? { b2bMarkup: 145, bgMk: {}, distDefault: {} };

    // leader 정보는 클라이언트 세션에서 오므로 여기서는 null 반환
    // (대시보드 로그인 시 세션에 저장된 정보 활용)
    return NextResponse.json({
      success: true,
      leader: null,
      client: clientData,
      coupons,
      adm: {
        // B2B 할증률은 절대 클라이언트에 노출하지 않음
        bgMk: adm.bgMk ?? {},
        distDefault: adm.distDefault ?? {},
      },
    });
  } catch (err) {
    console.error('[link-info]', err);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
