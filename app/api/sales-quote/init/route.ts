import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

// GET /api/sales-quote/init
// 영업팀 견적 페이지 초기 데이터: adm 설정 + scaledCost
// 인증: x-leader-id 헤더 (기존 대시보드 세션과 동일)
export async function GET(req: NextRequest) {
  const leaderId = req.headers.get('x-leader-id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  }

  try {
    // adm 설정 로드
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'adm')
      .single();

    const adm = configRow?.value ?? { b2bMarkup: 145, bgMk: {}, distDefault: {} };
    const b2bMarkup: number = (adm.b2bMarkup as number) ?? 145;
    const scale = b2bMarkup / 100;

    // GAS 단가표 로드 + b2bMarkup 서버 적용
    let scaledCost: Record<string, Record<string, unknown[][]>> | null = null;
    const costUrl = process.env.NEXT_PUBLIC_COST_API_URL;
    if (costUrl) {
      try {
        const gasRes = await fetch(costUrl, { redirect: 'follow' });
        if (gasRes.ok) {
          const gasData = await gasRes.json() as {
            costData?: Record<string, Record<string, unknown[][]>>;
          };
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
        // 단가 로드 실패 시 null (견적 기능만 비활성화)
      }
    }

    return NextResponse.json({
      success: true,
      adm: {
        // b2bMarkup 수치는 노출하지 않음 — scaledCost에 이미 반영
        bgMk: adm.bgMk ?? {},
        distDefault: adm.distDefault ?? {},
      },
      scaledCost,
    });
  } catch (err) {
    console.error('[sales-quote/init]', err);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
