"""Pydantic schemas for Node request / response."""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class NodeType(str, Enum):
    DIRECTORY = "directory"
    TEXT_FILE = "text_file"
    WORD_DOCUMENT = "word_document"
    IMAGE_FILE = "image_file"


class DirectoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: str | None = None


class FileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: NodeType = Field(..., description="Must be text_file / word_document / image_file")
    parent_id: str | None = None
    size_kb: float = Field(..., gt=0)
    created_at: datetime | None = None

    def model_post_init(self, _context: object) -> None:
        if self.type == NodeType.DIRECTORY:
            raise ValueError("Use DirectoryCreate for directories")


class NodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: NodeType
    name: str
    parent_id: str | None
    sort_order: int
    size_kb: float | None
    created_at: datetime | None


class TreeNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: NodeType
    name: str
    size_kb: float | None
    created_at: datetime | None
    children: list["TreeNodeResponse"] = []


class CopyResult(BaseModel):
    id: str
    final_name: str
    renamed: bool


class SortRequest(BaseModel):
    strategy: str = Field(..., pattern="^(name_asc|name_desc|size_asc|size_desc)$")
