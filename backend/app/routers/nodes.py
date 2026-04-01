"""FastAPI router for /api/nodes endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.node import (
    CopyResult,
    DirectoryCreate,
    FileCreate,
    NodeResponse,
    SortRequest,
    TreeNodeResponse,
)
from app.schemas.label import LabelResponse
from app.services.node_service import NodeService
from app.services.label_service import LabelService

router = APIRouter(prefix="/nodes", tags=["nodes"])
log = logging.getLogger(__name__)


def _node_svc(db: Session = Depends(get_db)) -> NodeService:
    return NodeService(db)


def _label_svc(db: Session = Depends(get_db)) -> LabelService:
    return LabelService(db)


@router.get("/tree", response_model=list[TreeNodeResponse])
def get_tree(svc: NodeService = Depends(_node_svc)):
    return svc.get_tree()


@router.post("/directory", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_directory(data: DirectoryCreate, svc: NodeService = Depends(_node_svc)):
    return svc.create_directory(data)


@router.post("/file", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_file(data: FileCreate, svc: NodeService = Depends(_node_svc)):
    return svc.create_file(data)


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(node_id: str, svc: NodeService = Depends(_node_svc)):
    try:
        svc.delete_node(node_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Node not found", "code": "NODE_NOT_FOUND"})


@router.post(
    "/{source_id}/copy",
    response_model=CopyResult,
    status_code=status.HTTP_201_CREATED,
)
def copy_node(source_id: str, target_dir_id: str, svc: NodeService = Depends(_node_svc)):
    try:
        return svc.copy_node(source_id, target_dir_id)
    except KeyError as exc:
        key = str(exc)
        code = "NODE_NOT_FOUND" if "source" in key else "PARENT_NOT_FOUND"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Node not found", "code": code})


@router.patch("/{dir_id}/sort", response_model=list[NodeResponse])
def sort_children(dir_id: str, req: SortRequest, svc: NodeService = Depends(_node_svc)):
    try:
        return svc.sort_children(dir_id, req)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Directory not found", "code": "NODE_NOT_FOUND"})


@router.get("/{node_id}/labels", response_model=list[LabelResponse])
def get_node_labels(node_id: str, svc: LabelService = Depends(_label_svc)):
    try:
        return svc.get_node_labels(node_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Node not found", "code": "NODE_NOT_FOUND"})


@router.post(
    "/{node_id}/labels/{label_id}",
    status_code=status.HTTP_201_CREATED,
)
def tag_node(node_id: str, label_id: str, svc: LabelService = Depends(_label_svc)):
    try:
        is_new = svc.tag_node(node_id, label_id)
        if not is_new:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "already tagged"})
        return {"message": "tagged"}
    except KeyError as exc:
        key = str(exc)
        code = "NODE_NOT_FOUND" if "node" in key else "LABEL_NOT_FOUND"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not found", "code": code})


@router.delete(
    "/{node_id}/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def untag_node(node_id: str, label_id: str, svc: LabelService = Depends(_label_svc)):
    try:
        svc.untag_node(node_id, label_id)
    except KeyError as exc:
        key = str(exc)
        code = "NODE_NOT_FOUND" if "node" in key else "LABEL_NOT_FOUND"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not found", "code": code})
