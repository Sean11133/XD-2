"""NodeService — business logic for file-tree CRUD operations."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.node import NodeModel
from app.repositories.node_repository import NodeRepository
from app.schemas.node import (
    CopyResult,
    DirectoryCreate,
    FileCreate,
    NodeResponse,
    NodeType,
    SortRequest,
    TreeNodeResponse,
)

log = logging.getLogger(__name__)

SORT_STRATEGIES: dict[str, tuple[str, bool]] = {
    "name_asc": ("name", False),
    "name_desc": ("name", True),
    "size_asc": ("size_kb", False),
    "size_desc": ("size_kb", True),
}


def _resolve_name(base_name: str, existing_names: set[str]) -> tuple[str, bool]:
    """Return (final_name, was_renamed).

    If base_name is already taken, appends '_copy' (then '_copy_2', '_copy_3', …).
    """
    if base_name not in existing_names:
        return base_name, False
    candidate = f"{base_name}_copy"
    counter = 2
    while candidate in existing_names:
        candidate = f"{base_name}_copy_{counter}"
        counter += 1
    return candidate, True


def _build_tree(nodes: list[NodeModel]) -> list[TreeNodeResponse]:
    """Reassemble flat Adjacency-List rows into a nested TreeNodeResponse tree."""
    node_map: dict[str, TreeNodeResponse] = {}
    for n in nodes:
        node_map[n.id] = TreeNodeResponse(
            id=n.id,
            type=NodeType(n.type),
            name=n.name,
            size_kb=n.size_kb,
            created_at=n.created_at,
            children=[],
        )

    roots: list[TreeNodeResponse] = []
    for n in nodes:
        resp = node_map[n.id]
        if n.parent_id and n.parent_id in node_map:
            node_map[n.parent_id].children.append(resp)
        elif n.parent_id is None:
            roots.append(resp)
    return roots


def _clone_subtree(
    source: NodeModel,
    new_parent_id: str | None,
    new_name: str,
    sort_order: int,
) -> list[NodeModel]:
    """Recursively deep-clone a node and all its descendants.

    Returns a flat list of new NodeModel instances (not yet persisted).
    """
    new_root = NodeModel(
        type=source.type,
        name=new_name,
        parent_id=new_parent_id,
        sort_order=sort_order,
        size_kb=source.size_kb,
        created_at=source.created_at if source.created_at else None,
    )
    result = [new_root]
    for i, child in enumerate(source.children):
        result.extend(_clone_subtree(child, new_root.id, child.name, i))
    return result


class NodeService:
    def __init__(self, db: Session) -> None:
        self._repo = NodeRepository(db)
        self._db = db

    # ──────────────────────────────────────────────
    # Read
    # ──────────────────────────────────────────────

    def get_tree(self) -> list[TreeNodeResponse]:
        nodes = self._repo.find_all()
        return _build_tree(nodes)

    # ──────────────────────────────────────────────
    # Create
    # ──────────────────────────────────────────────

    def create_directory(self, data: DirectoryCreate) -> NodeResponse:
        next_order = len(self._repo.find_children(data.parent_id or "")) if data.parent_id else 0
        node = NodeModel(
            type=NodeType.DIRECTORY.value,
            name=data.name,
            parent_id=data.parent_id,
            sort_order=next_order,
        )
        saved = self._repo.save(node)
        self._db.commit()
        log.info("Directory created: id=%s name=%s", saved.id, saved.name)
        return NodeResponse.model_validate(saved)

    def create_file(self, data: FileCreate) -> NodeResponse:
        next_order = len(self._repo.find_children(data.parent_id or "")) if data.parent_id else 0
        node = NodeModel(
            type=data.type.value,
            name=data.name,
            parent_id=data.parent_id,
            sort_order=next_order,
            size_kb=data.size_kb,
            created_at=data.created_at or datetime.now(timezone.utc),
        )
        saved = self._repo.save(node)
        self._db.commit()
        log.info("File created: id=%s name=%s type=%s", saved.id, saved.name, saved.type)
        return NodeResponse.model_validate(saved)

    # ──────────────────────────────────────────────
    # Delete
    # ──────────────────────────────────────────────

    def delete_node(self, node_id: str) -> None:
        node = self._repo.find_by_id(node_id)
        if node is None:
            raise KeyError(node_id)
        self._repo.delete(node)
        self._db.commit()
        log.info("Node deleted: id=%s", node_id)

    # ──────────────────────────────────────────────
    # Copy / Paste
    # ──────────────────────────────────────────────

    def copy_node(self, source_id: str, target_dir_id: str) -> CopyResult:
        source = self._repo.find_by_id(source_id)
        if source is None:
            raise KeyError(f"source:{source_id}")
        target = self._repo.find_by_id(target_dir_id)
        if target is None:
            raise KeyError(f"target:{target_dir_id}")

        sibling_names = self._repo.get_sibling_names(target_dir_id)
        final_name, renamed = _resolve_name(source.name, sibling_names)
        next_order = len(target.children)

        cloned_nodes = _clone_subtree(source, target_dir_id, final_name, next_order)
        self._repo.bulk_save(cloned_nodes)
        self._db.commit()

        root_clone = cloned_nodes[0]
        log.info("Node copied: source=%s → new=%s renamed=%s", source_id, root_clone.id, renamed)
        return CopyResult(id=root_clone.id, final_name=final_name, renamed=renamed)

    # ──────────────────────────────────────────────
    # Sort
    # ──────────────────────────────────────────────

    def sort_children(self, dir_id: str, req: SortRequest) -> list[NodeResponse]:
        parent = self._repo.find_by_id(dir_id)
        if parent is None:
            raise KeyError(dir_id)

        field, reverse = SORT_STRATEGIES[req.strategy]
        children = list(parent.children)

        def sort_key(n: NodeModel):
            val = getattr(n, field)
            if val is None:
                return ("" if field == "name" else 0.0)
            return val

        children.sort(key=sort_key, reverse=reverse)
        for i, child in enumerate(children):
            child.sort_order = i

        self._db.commit()
        log.info("Children sorted: dir=%s strategy=%s", dir_id, req.strategy)
        return [NodeResponse.model_validate(c) for c in children]
