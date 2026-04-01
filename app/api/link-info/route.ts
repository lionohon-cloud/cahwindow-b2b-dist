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
    const b2bMarkup: number = (adm.b2bMarkup as number) ?? 145;
    const scale = b2bMarkup / 100;

    // GAS 단가표 가져오기 + b2bMarkup 서버 적용
    let scaledCost: Record<string, Record<string, unknown[][]>> | null = null;
    const costUrl = process.env.NEXT_PUBLIC_COST_API_URL;
    if (costUrl) {
      try {
        const gasRes = await fetch(costUrl, { redirect: 'follow' });
        if (gasRes.ok) {
          const gasData = await gasRes.json() as { costData?: Record<string, Record<string, unknown[][]>> };
          const rawPdCost = gasData?.costData ?? null;
          if (rawPdCost) {
            scaledCost = {};
            for (const brand of Object.keys(rawPdCost)) {
              scaledCost[brand] = {};
              for (const grade of Object.keys(rawPdCost[brand])) {
                scaledCost[brand][grade] = rawPdCost[brand][grade].map((row, ri) => {
                  if (ri === 0) return row; // 헤더 행
                  return (row as (string | number)[]).map((val, i) =>
                    i === 0 ? val : Math.round((val as number) * scale),
                  );
                });
              }
            }
          }
        }
      } catch {
        // 단가 로드 실패 시 null 반환 (견적 기능만 비활성화)
      }
    }

    return NextResponse.json({
      success: true,
      leader: null,
      client: clientData,
      coupons,
      adm: {
        // b2bMarkup 수치는 절대 노출하지 않음 — scaledCost에 이미 반영됨
        bgMk: adm.bgMk ?? {},
        distDefault: adm.distDefault ?? {},
      },
      scaledCost,
    });
  } catch (err) {
    console.error('[link-info]', err);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
