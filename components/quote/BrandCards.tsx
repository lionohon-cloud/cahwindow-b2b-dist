'use client';

const BRAND_GRADES: Record<string, string[]> = {
  LX: ['프레스티지', '시그니처', '에코lite'],
  홈윈도우: ['프레스티지', '시그니처', '에코lite'],
  KCC: ['프레스티지', '시그니처', 'GR'],
};

const BRAND_COLORS: Record<string, string> = {
  LX: '#1a1a1a',
  홈윈도우: '#2563eb',
  KCC: '#dc2626',
};

interface Props {
  grades: Record<string, string>;
  setGrades: (g: Record<string, string>) => void;
}

export default function BrandCards({ grades, setGrades }: Props) {
  return (
    <div className="card">
      <div className="section-title">③ 브랜드 / 등급 선택</div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        원하시는 브랜드와 등급을 선택해 주세요. 복수 선택 가능합니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(BRAND_GRADES).map(([brand, gradeList]) => (
          <div key={brand}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: BRAND_COLORS[brand] }}>
              {brand}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {gradeList.map((grade) => {
                const selected = grades[brand] === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGrades({ ...grades, [brand]: selected ? '' : grade })}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      border: `2px solid ${selected ? BRAND_COLORS[brand] : 'var(--color-border)'}`,
                      background: selected ? BRAND_COLORS[brand] : '#fff',
                      color: selected ? '#fff' : 'var(--color-text)',
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {Object.values(grades).every((v) => !v) && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-faint)' }}>
          ※ 등급 미선택 시 담당자가 별도 확인합니다.
        </p>
      )}
    </div>
  );
}
