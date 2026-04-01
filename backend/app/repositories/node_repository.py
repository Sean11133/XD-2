"""Repository for NodeModel — encapsulates all SQLAlchemy node queries."""
from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from app.models.node import NodeModel
from app.repositories.base_repository import AbstractRepository


class NodeRepository(AbstractRepository[NodeModel]):
    def __init__(self, db: Session) -> None:
        self._db = db

    def find_by_id(self, node_id: str) -> NodeModel | None:
        return (
            self._db.query(NodeModel)
            .options(selectinload(NodeModel.children), selectinload(NodeModel.labels))
            .filter(NodeModel.id == node_id)
            .first()
        )

    def find_children(self, parent_id: str) -> list[NodeModel]:
        return (
            self._db.query(NodeModel)
            .filter(NodeModel.parent_id == parent_id)
            .order_by(NodeModel.sort_order)
            .all()
        )

    def find_root_nodes(self) -> list[NodeModel]:
        """Return all top-level nodes (parent_id IS NULL)."""
        return (
            self._db.query(NodeModel)
            .filter(NodeModel.parent_id.is_(None))
            .order_by(NodeModel.sort_order)
            .all()
        )

    def find_all(self) -> list[NodeModel]:
        """Return every node (flat list) — Service reassembles as tree."""
        return self._db.query(NodeModel).order_by(NodeModel.sort_order).all()

    def save(self, node: NodeModel) -> NodeModel:
        self._db.add(node)
        self._db.flush()
        self._db.refresh(node)
        return node

    def bulk_save(self, nodes: list[NodeModel]) -> None:
        for node in nodes:
            self._db.add(node)
        self._db.flush()

    def delete(self, node: NodeModel) -> None:
        """Cascade delete is handled by ORM (cascade='all, delete-orphan')."""
        self._db.delete(node)
        self._db.flush()

    def count_children_with_name(self, parent_id: str, name: str) -> int:
        return (
            self._db.query(NodeModel)
            .filter(NodeModel.parent_id == parent_id, NodeModel.name == name)
            .count()
        )

    def get_sibling_names(self, parent_id: str | None) -> set[str]:
        query = self._db.query(NodeModel.name)
        if parent_id is None:
            query = query.filter(NodeModel.parent_id.is_(None))
        else:
            query = query.filter(NodeModel.parent_id == parent_id)
        return {row[0] for row in query.all()}
