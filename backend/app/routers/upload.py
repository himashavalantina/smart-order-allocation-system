import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image file. Returns the URL to access it.
    Requires authentication (any user role can upload, but typically used by branch managers).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image."
        )

    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".png" # default to png if no extension

    # Generate a unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"http://localhost:8000/uploads/{unique_filename}"}
