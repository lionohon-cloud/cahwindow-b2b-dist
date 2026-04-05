# CLAUDE.md — PM Relay 작업 공유 문서

> 이 파일은 Claude.ai ↔ Claude Code 간 공유 컨텍스트입니다.
> Claude Code는 이 파일을 읽고 작업을 시작하며, 완료 후 반드시 [작업 결과] 섹션을 업데이트합니다.

---

## 📋 프로젝트 정보

- **프로젝트명**: (예: cahwindow-b2b-dist)
- **저장소**: (예: https://github.com/lionohon-cloud/cahwindow-b2b-dist)
- **기술 스택**: (예: Next.js 15, Supabase, Cloudflare Pages, TypeScript)
- **배포 URL**: (예: https://b2b.cahwindow.com)

---

## 🎯 현재 작업 지시 (Claude.ai → Claude Code)

> 아래 내용을 Claude Code가 읽고 작업을 수행합니다.

### 작업 ID: TASK-001
- **상태**: ⏳ 대기중 | 🔄 진행중 | ✅ 완료 | ❌ 실패
- **우선순위**: 높음
- **작업 내용**:
  ```
  (여기에 Claude.ai가 작업 지시 내용을 작성합니다)
  ```
- **주의사항**:
  - (코딩 규칙, 제약사항 등)
- **완료 기준**:
  - (무엇이 되면 완료인지)

---

## ✅ 작업 결과 (Claude Code → Claude.ai)

> Claude Code가 작업 완료 후 이 섹션을 업데이트합니다.

### TASK-001 결과
- **완료 시각**: 
- **변경 파일**:
  ```
  (변경된 파일 목록)
  ```
- **작업 요약**:
  ```
  (무엇을 했는지 간략히)
  ```
- **테스트 방법**:
  ```
  (부사장님이 테스트할 방법)
  ```
- **문제점 / 미완료 사항**:
  ```
  (있다면 기록)
  ```

---

## 🏗️ 아키텍처 컨텍스트

> Claude Code가 항상 참고하는 고정 정보입니다.

### 디렉토리 구조
```
(프로젝트 주요 디렉토리 구조)
```

### 코딩 규칙
- TypeScript strict mode 사용
- 컴포넌트: PascalCase, 함수: camelCase
- 환경변수: .env.local (절대 커밋 금지)
- 커밋 메시지: `feat:`, `fix:`, `chore:` 접두사 사용

### 환경변수 목록
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
(기타...)
```

---

## 📝 작업 히스토리

| ID | 작업 내용 | 완료일 | 결과 |
|----|----------|--------|------|
| TASK-000 | 초기 세팅 | - | 템플릿 생성 |

---

## ⚠️ Claude Code 필수 규칙

1. **작업 시작 전** 이 파일 전체를 읽을 것
2. **작업 완료 후** 반드시 [작업 결과] 섹션 업데이트할 것
3. **환경변수**는 절대 하드코딩 금지
4. **작업 중 문제** 발생 시 [작업 결과] 섹션에 에러 내용 기록할 것
5. **완료 후** `git add CLAUDE.md && git commit -m "docs: TASK-XXX 결과 업데이트"` 실행할 것
