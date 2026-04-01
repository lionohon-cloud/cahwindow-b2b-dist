import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PdCostTable } from '@/lib/calc';

/**
 * GET /api/cost-data
 * COST_API_URL(GAS)에서 단가표를 가져와 b2bMarkup을 서버에서 적용하고 반환.
 * b2bMarkup 수치는 절대 클라이언트에 노출하지 않음.
 */
export async function GET(_req: NextRequest) {
  try {
    const costUrl = process.env.NEXT_PUBLIC_COST_API_URL;
    if (!costUrl) {
      return NextResponse.json({ success: false, error: 'COST_API_URL 미설정' }, { status: 500 });
    }

    // GAS 단가표 가져오기 (1시간 캐시)
    const gasRes = await fetch(costUrl, {
      headers: { 'Cache-Control': 'no-cache' },
      redirect: 'follow',
    });
    if (!gasRes.ok) throw new Error(`GAS 응답 오류: ${gasRes.status}`);

    const gasData = await gasRes.json();
    const rawPdCost: PdCostTable | null = gasData?.pdCost ?? null;

    if (!rawPdCost) {
      return NextResponse.json({ success: false, error: '단가 데이터 없음' }, { status: 502 });
    }

    // Supabase에서 b2bMarkup 로드 (서버 전용)
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'adm')
      .single();

    const admVal = configRow?.value as Record<string, unknown> | null;
    const b2bMarkup = (admVal?.b2bMarkup as number) ?? 145;
    const scale = b2bMarkup / 100;

    // 모든 가격 셀에 b2bMarkup 반영 (col[0] = jp 임계값이므로 유지)
    const scaledCost: PdCostTable = {};
    for (const brand of Object.keys(rawPdCost)) {
      scaledCost[brand] = {};
      for (const grade of Object.keys(rawPdCost[brand])) {
        scaledCost[brand][grade] = rawPdCost[brand][grade].map((row) =>
          row.map((val, i) => (i === 0 ? val : Math.round(val * scale))),
        );
      }
    }

    return NextResponse.json({ success: true, scaledCost });
  } catch (err) {
    console.error('[cost-data]', err);
    return NextResponse.json({ success: false, error: '원가 데이터 로드 실패' }, { status: 500 });
  }
}
