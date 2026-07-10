# 탐색 · 보관함 프리셋 통합 리팩터 계획

현재 탐색(`ExplorePresetModal`)과 보관함(`LibraryDetail`)이 서로 다른 데이터 형태·컴포넌트·레이아웃을 쓰고 있어 요구사항대로 "동일 요소를 mode로만 분기"하는 구조로 재편합니다.

## 1. 공통 데이터 타입 (`src/data/mockData.ts`)

새 공통 타입 `Preset` 도입, 기존 `MarketplacePreset`/`LibraryPreset`은 이 타입의 alias/확장으로 통일:

```ts
type Preset = {
  id; title; description; tags;
  creator: { name; role; avatar };
  thumbnailUrl; wallpaperUrl;
  rating; reviewCount; downloadCount; price; license;
  creatorResolutionType; creatorResolutionWidth;
  creatorResolutionHeight; creatorResolutionLabel;
  files;            // 배경화면 + hover 등
  iconMappings;     // 기존 icons 재활용
  libraryMeta?: { libraryId; originalPresetId; savedAt; updatedAt;
                  isApplied; lastAppliedAt; isModified };
};
```

기존 mock 데이터는 어댑터 함수 `toPreset(marketplace)` / `toPreset(library)`로 동일 형태로 노출. 다른 페이지에서 참조하는 필드명(`name`, `thumbnail`, `icons`)은 하위호환을 위해 getter/별칭으로 유지.

## 2. 공통 컴포넌트 (`src/components/presets/`)

새로 만들거나 기존 것을 리네이밍하여 mode 기반 분기:

- `PresetDetail` (신규, 기존 `ExplorePresetModal` 본체를 일반화)
- `PresetPreview` — 히어로 이미지 + 해상도 뱃지
- `PresetActionPanel` — mode="marketplace" | "library"에 따라 버튼만 교체
- `PresetResolutionBadge`, `PresetFileList`, `PresetCreatorInfo`, `PresetCard`

`PresetActionPanel`이 표시하는 버튼:

- `marketplace`: 다운로드(=보관함에 저장), 찜, 공유, 신고, 크리에이터 팔로우 헤더
- `library`: 수정하기(=변경 저장), 적용하기, 전체화면 편집, 보관함에서 삭제, 원본 프리셋 보기

동일한 히어로/설명/파일 리스트/리뷰 섹션을 두 모드가 공유합니다.

## 3. 페이지 연결

- `ExplorePresetModal`은 `<PresetDetail preset={p} mode="marketplace" />` wrapper로 축소.
- `LibraryDetail`은 다음 두 영역으로 분리:
  1. 상단: `PresetDetail mode="library"` (동일 레이아웃 · 라이브러리 액션 카드)
  2. 하단: 기존 편집 캔버스(위치·배경화면·아이콘 편집기)는 그대로 유지 — 편집 기능 자체는 이번 스코프 밖이므로 UI는 건드리지 않고 상단 헤더만 공통 컴포넌트로 대체.
- 저장 후 "보관함에서 열기" → `/library/lib-saved-<id>`가 `PresetDetail mode="library"`를 그대로 렌더.

## 4. 편집 화면에서 제작 해상도 제거

- `LibraryDetail`(수정 화면)과 `Upload.tsx`가 `?preset=` 로드했을 때 나오는 "제작 해상도 선택" 드롭다운/입력을 제거하고 읽기 전용 `PresetResolutionBadge`로 대체.
- 신규 프리셋을 등록하는 경로(`Upload.tsx`의 신규 업로드 흐름)는 그대로 유지.

## 5. 삭제할 중복

- `MarketItemModal`의 preset 브랜치 → `PresetDetail`로 위임 (아이콘/아이콘팩 브랜치는 유지).
- 기존 `LibraryDetail`에 있던 "저장/임시저장/바탕화면 적용" 헤더는 `PresetActionPanel`로 통합.

## 기술 세부

- 하위호환 어댑터로 mock 데이터를 그대로 유지 → 다른 페이지가 깨지지 않음.
- `useLibrary` hook은 유지, `downloadPreset` 반환 record가 이제 `Preset`으로 정규화되어 route가 그대로 동작.
- 타입체크(`bunx tsgo --noEmit`)로 검증.

## 스코프 밖 (이번 턴에서 안 함)

- 캔버스 편집기(아이콘 드래그, 배경 조정 등) 로직 자체는 그대로. 상단 액션 헤더와 상세 정보 영역만 공통 컴포넌트로 대체.
- 실제 백엔드 연결. 여전히 mock/localStorage 기반.

승인해주시면 위 순서로 파일을 만들고 페이지를 연결하겠습니다.
