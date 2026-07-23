# FastAPI 백엔드 패치 — 통합 보관함 (Library) 엔드포인트

아래 코드를 `backend/main.py`에 추가하면 OpenAPI에 정식으로 반영됩니다.
프론트엔드는 현재 `GET /api/icons/images`만 참조해서 실제 파일과 로컬
메타데이터를 동기화하고 있으며, 아이콘 이름 변경/삭제는 아직 순수
localStorage 폴백으로 동작합니다. 아래 엔드포인트가 추가되면 프론트엔드가
즉시 이 API를 호출하도록 다음 단계에서 배선하겠습니다.

```python
# backend/main.py 하단(엔드포인트 섹션)에 추가하세요.

import hashlib
from typing import Optional, List
from pydantic import BaseModel, Field

LIBRARY_META_PATH = ENGINE_DIR / "library.json"

class LibraryIconAsset(BaseModel):
    asset_id: str
    display_name: str
    storage_filename: str         # 실제 파일명 (UUID 기반, 불변)
    local_image_path: str
    origin: str = "user-upload"   # user-upload | market-download | icon-pack | local-engine
    pack_id: Optional[str] = None
    sha256: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class LibraryPatch(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=200)

class DeleteConflict(BaseModel):
    detail: str
    references: dict

def _read_library() -> List[LibraryIconAsset]:
    if not LIBRARY_META_PATH.exists():
        return []
    with open(LIBRARY_META_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [LibraryIconAsset(**x) for x in raw]

def _write_library(items: List[LibraryIconAsset]) -> None:
    LIBRARY_META_PATH.write_text(
        json.dumps([x.model_dump() for x in items], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

def _find_refs(asset_id: str, storage_filename: str) -> dict:
    """저장된 프리셋 + 현재 icons_config.json 매핑에서 자산 참조를 검사합니다."""
    preset_refs: List[str] = []
    # TODO: 저장된 프리셋 경로 목록을 스캔해 asset_id 참조 검색
    active: List[str] = []
    if ICON_CONFIG_PATH.exists():
        try:
            with open(ICON_CONFIG_PATH, "r", encoding="utf-8") as f:
                mappings = json.load(f)
            for m in mappings if isinstance(mappings, list) else []:
                img = str(m.get("image_path", ""))
                if storage_filename and storage_filename in img:
                    active.append(str(m.get("id") or m.get("icon_name") or ""))
        except Exception:
            pass
    return {"presets": preset_refs, "active_mappings": active}


@app.get("/api/icons/library", response_model=List[LibraryIconAsset])
async def list_library():
    """통합 보관함 목록 (실제 파일 + 메타데이터 병합)."""
    items = _read_library()
    known = {x.storage_filename for x in items}
    # 파일시스템의 실제 파일을 기준으로 orphan을 흡수합니다.
    if CUSTOM_ICONS_DIR.exists():
        for f in CUSTOM_ICONS_DIR.glob("*"):
            if f.suffix.lower() not in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"]:
                continue
            if f.name in known:
                continue
            items.append(LibraryIconAsset(
                asset_id=f"ua-engine-{f.stem}",
                display_name=f.stem,
                storage_filename=f.name,
                local_image_path=str(f),
                origin="local-engine",
            ))
    return items


@app.patch("/api/icons/library/{asset_id}", response_model=LibraryIconAsset)
async def rename_library_asset(asset_id: str, patch: LibraryPatch):
    """display_name만 변경. 실제 파일명(storage_filename)은 절대 변경하지 않습니다."""
    items = _read_library()
    for i, item in enumerate(items):
        if item.asset_id == asset_id:
            item.display_name = patch.display_name
            items[i] = item
            _write_library(items)
            return item
    raise HTTPException(status_code=404, detail="Asset not found")


@app.delete("/api/icons/library/{asset_id}")
async def delete_library_asset(asset_id: str, force: bool = False):
    """참조 검사 후 메타데이터 + 실제 파일 삭제. force=true 시 강제."""
    items = _read_library()
    idx = next((i for i, x in enumerate(items) if x.asset_id == asset_id), -1)
    if idx < 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    target = items[idx]
    refs = _find_refs(asset_id, target.storage_filename)
    if (refs["presets"] or refs["active_mappings"]) and not force:
        raise HTTPException(
            status_code=409,
            detail={"detail": "Icon asset is still in use", "references": refs},
        )
    # 실제 파일 삭제
    try:
        path = Path(target.local_image_path)
        if path.exists():
            path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {e}")
    del items[idx]
    _write_library(items)
    return {"success": True, "references": refs}
```

## 업로드 훅 확장 (선택)

`POST /api/icons/upload` 안에서 저장 성공 직후 아래를 추가하면 업로드된
파일이 자동으로 보관함 메타데이터에 등록됩니다.

```python
sha = hashlib.sha256(content).hexdigest()
items = _read_library()
# 해시로 중복 방지
if not any(x.sha256 == sha for x in items):
    items.insert(0, LibraryIconAsset(
        asset_id=f"ua-{uuid.uuid4().hex[:12]}",
        display_name=Path(file.filename).stem,
        storage_filename=unique_name,
        local_image_path=str(save_path),
        origin="user-upload",
        sha256=sha,
        created_at=None,
    ))
    _write_library(items)
```

## 마이그레이션

최초 배포 시 `library.json`이 없다면 `GET /api/icons/library`가 파일시스템
스캔으로 orphan을 흡수해 응답합니다. 프론트엔드가 그 응답을 그대로 저장하고
이후에는 이 API가 단일 진실 소스가 됩니다. 프론트엔드의 localStorage
`icno-user-icons-v1`는 오프라인 캐시 및 마켓 다운로드(마켓 API가 아직
백엔드에 없을 때) 용도로만 유지됩니다.