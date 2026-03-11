from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ImportResponse
from app.services.excel_service import (
    import_users_from_excel,
    remove_upload_file,
    save_upload_file,
)


router = APIRouter(prefix="/import", tags=["Excel Import"])


@router.post("/users", response_model=ImportResponse)
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImportResponse:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in {".xlsx", ".xlsm", ".xltx", ".xltm"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files are supported",
        )

    file_content = await file.read()
    file_path = save_upload_file(file.filename, file_content)

    try:
        result = import_users_from_excel(file_path, db)
    finally:
        remove_upload_file(file_path)

    return ImportResponse(
        message="Excel import completed successfully",
        imported_count=result["imported_count"],
        skipped_count=result["skipped_count"],
    )
