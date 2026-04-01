'use client';

// 3사 창호 등급별 사양 비교표
// BS 데이터: B2B_Client_Quote.html 에서 이식

const SPEC_ROWS = [
  '시공방식', '발코니창 두께', 'Ar 가스', 'TPS 간봉',
  '유리 종류', '발코니 방충망', '일반창 규격',
  'FIX/PJ/터닝', '발코니 옵션', '일반창 옵션',
  '공장 옵션', '윈도우', '레일', '물끊기', '안전망', '빨라창',
] as const;

type SpecKey =
  | '발코니' | 'Ar' | 'TPS' | '유리' | '방충망' | '일반'
  | 'FIX/PJ/터닝' | '발코니옵션' | '일반옵션' | '공장' | '윈도우'
  | '레일' | '물끊기' | '안전망' | '빨라';

interface GradeSpec {
  시공방식: string | number;
  '발코니창두께': string | number;
  Ar: string;
  TPS: string;
  유리: string;
  방충망: string;
  일반: string | number;
  'FIX/PJ/터닝': string | number;
  발코니옵션: string;
  일반옵션: string;
  공장: string;
  윈도우: string;
  레일: string;
  물끊기: string;
  안전망: string;
  빨라: string;
}

interface BrandSpec {
  label: string;
  color: string;
  grades: {
    ECO?: Partial<GradeSpec>;
    SIGNATURE?: Partial<GradeSpec>;
    PRESTIGE?: Partial<GradeSpec>;
  };
}

const BS: Record<string, BrandSpec> = {
  LX: {
    label: 'LX하우시스',
    color: '#c41230',
    grades: {
      ECO: {
        시공방식: '크림', 발코니창두께: '-', Ar: 'X', TPS: 'AL간봉',
        유리: '투명+', 방충망: '스크린', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '-', 일반옵션: '고정+', 공장: '고정+', 윈도우: 'X',
        레일: 'LX정품', 물끊기: 'X', 안전망: 'BF스크린', 빨라: 'X',
      },
      SIGNATURE: {
        시공방식: '고급+', 발코니창두께: 26, Ar: 'X', TPS: 'TPS',
        유리: '로이+', 방충망: '블랙망', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '고급+', 공장: '커스텀', 윈도우: 'X',
        레일: 'LX정품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'X',
      },
      PRESTIGE: {
        시공방식: '자동롤', 발코니창두께: 26, Ar: 'O', TPS: 'TPS',
        유리: '슈퍼로이', 방충망: '안전망', 일반: 26, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '자동롤', 공장: '커스텀', 윈도우: '발주',
        레일: 'LX정품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'O',
      },
    },
  },
  HOME: {
    label: 'HOME WINDOW',
    color: '#1a1a1a',
    grades: {
      ECO: {
        시공방식: '크림', 발코니창두께: '-', Ar: 'X', TPS: 'AL간봉',
        유리: '투명+', 방충망: '스크린', 일반: 22, 'FIX/PJ/터닝': 24,
        발코니옵션: '-', 일반옵션: '고정+', 공장: '고정+', 윈도우: 'X',
        레일: '기성품', 물끊기: 'X', 안전망: 'BF스크린', 빨라: 'X',
      },
      SIGNATURE: {
        시공방식: '고급+', 발코니창두께: 26, Ar: 'X', TPS: 'TPS',
        유리: '로이+', 방충망: '블랙망', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '고급+', 공장: '반자동', 윈도우: 'X',
        레일: '기성품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'X',
      },
      PRESTIGE: {
        시공방식: '자동롤', 발코니창두께: 26, Ar: 'O', TPS: 'TPS',
        유리: '슈퍼로이', 방충망: '안전망', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '자동롤', 공장: '반자동', 윈도우: '발주',
        레일: '기성품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'O',
      },
    },
  },
  KCC: {
    label: 'KCC Homecc',
    color: '#1d4ed8',
    grades: {
      ECO: {
        시공방식: '크림', 발코니창두께: '-', Ar: 'X', TPS: 'AL간봉',
        유리: '투명+', 방충망: '스크린', 일반: 22, 'FIX/PJ/터닝': 24,
        발코니옵션: '-', 일반옵션: '고정+', 공장: '고정+', 윈도우: 'X',
        레일: '기성품', 물끊기: 'X', 안전망: 'BF스크린', 빨라: 'X',
      },
      SIGNATURE: {
        시공방식: '고급+', 발코니창두께: 26, Ar: 'X', TPS: 'TPS',
        유리: '로이+', 방충망: '블랙망', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '고급+', 공장: '반자동', 윈도우: 'X',
        레일: '기성품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'X',
      },
      PRESTIGE: {
        시공방식: '자동롤', 발코니창두께: 26, Ar: 'O', TPS: 'TPS',
        유리: '더블로이', 방충망: '안전망', 일반: 24, 'FIX/PJ/터닝': 24,
        발코니옵션: '자동롤', 일반옵션: '자동롤', 공장: '반자동', 윈도우: '발주',
        레일: '기성품', 물끊기: 'O', 안전망: 'BF스크린', 빨라: 'O',
      },
    },
  },
};

// 등급 표시명 ↔ 내부키 매핑
const GRADE_DISPLAY: Record<string, string> = {
  PRESTIGE:  '프레스티지',
  SIGNATURE: '시그니처',
  ECO:       '에코lite',
};

const GRADE_KEYS: Array<keyof typeof BS.LX.grades> = ['PRESTIGE', 'SIGNATURE', 'ECO'];

// 각 행에 해당하는 스펙 키 순서
const ROW_KEYS: Array<keyof GradeSpec> = [
  '시공방식', '발코니창두께', 'Ar', 'TPS', '유리', '방충망', '일반',
  'FIX/PJ/터닝', '발코니옵션', '일반옵션', '공장', '윈도우', '레일', '물끊기', '안전망', '빨라',
];

function valClass(v: string | number | undefined): string {
  if (v === 'O' || v === '자동롤' || v === 'TPS') return 'spec-on';
  if (v === 'X' || v === '-') return 'spec-off';
  return '';
}

interface Props {
  grades: Record<string, string>;  // 브랜드 → 선택 등급 (표시명)
}

// 등급 표시명 → 내부 키
const GRADE_KEY_MAP: Record<string, string> = {
  '프레스티지': 'PRESTIGE',
  '시그니처':   'SIGNATURE',
  '에코lite':  'ECO',
  'GR':        'PRESTIGE',
};

export default function SpecTable({ grades }: Props) {
  const BRAND_ORDER = ['LX', 'HOME', 'KCC'] as const;
  const BRAND_DISPLAY: Record<string, string> = { LX: 'LX', HOME: '홈윈도우', KCC: 'KCC' };

  return (
    <div className="card">
      <div className="section-title">창호 등급별 사양 비교</div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        선택 등급 기준으로 하이라이트됩니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {BRAND_ORDER.map((brandKey) => {
          const bd = BS[brandKey];
          if (!bd) return null;
          const selectedDisplay = grades[BRAND_DISPLAY[brandKey]] ?? '';
          const selectedKey = GRADE_KEY_MAP[selectedDisplay] ?? '';
          const availGrades = GRADE_KEYS.filter((g) => bd.grades[g]);

          return (
            <div key={brandKey} style={{ borderRadius: 8, overflow: 'hidden', border: `2px solid ${bd.color}` }}>
              <div style={{ background: bd.color, color: '#fff', padding: '10px 14px', fontWeight: 700, fontSize: 14 }}>
                {bd.label}
              </div>
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f1f3f5', padding: '5px 8px', textAlign: 'left', width: 100, borderBottom: '1px solid #e5e7eb' }}>항목</th>
                      {availGrades.map((g) => {
                        const isSel = g === selectedKey;
                        return (
                          <th key={g} style={{
                            padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb',
                            background: isSel ? bd.color : '#f8f9fa',
                            color: isSel ? '#fff' : '#374151',
                            fontWeight: isSel ? 800 : 600,
                          }}>
                            {GRADE_DISPLAY[g] ?? g}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {SPEC_ROWS.map((label, ri) => {
                      const key = ROW_KEYS[ri];
                      return (
                        <tr key={ri} style={{ background: ri % 2 ? '#fafbfc' : '#fff' }}>
                          <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 600, color: '#374151', borderBottom: '1px solid #f1f3f5' }}>
                            {label}
                          </td>
                          {availGrades.map((g) => {
                            const v = bd.grades[g]?.[key];
                            const isSel = g === selectedKey;
                            const cls = valClass(v as string | number);
                            return (
                              <td key={g} style={{
                                padding: '4px 8px', textAlign: 'center',
                                borderBottom: '1px solid #f1f3f5',
                                fontWeight: isSel ? 700 : 400,
                                color: cls === 'spec-on' ? '#059669' : cls === 'spec-off' ? '#d1d5db' : '#374151',
                              }}>
                                {v != null ? String(v) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
