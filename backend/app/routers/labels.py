"""FastAPI router for /api/labels endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.label import LabelCreate, LabelResponse
from app.services.label_service import LabelService

router = APIRouter(prefix="/labels", tags=["labels"])
log = logging.getLogger(__name__)


def _label_svc(db: Session = Depends(get_db)) -> LabelService:
    return LabelService(db)


@router.get("", response_model=list[LabelResponse])
def get_all_labels(svc: LabelService = Depends(_label_svc)):
    return svc.get_all()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_label(data: LabelCreate, svc: LabelService = Depends(_label_svc)):
    label_resp, is_new = svc.get_or_create(data)
    if is_new:
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=label_resp.model_dump(mode="json"))
    return JSONResponse(status_code=status.HTTP_200_OK, content=label_resp.model_dump(mode="json"))


@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(label_id: str, svc: LabelService = Depends(_label_svc)):
    try:
        svc.delete(label_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Label not found", "code": "LABEL_NOT_FOUND"},
        )
