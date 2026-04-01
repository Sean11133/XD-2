"""Repository for LabelModel — encapsulates all SQLAlchemy label queries."""
from __future__ import annotations

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.label import LabelModel
from app.models.node import node_label_association
from app.repositories.base_repository import AbstractRepository


class LabelRepository(AbstractRepository[LabelModel]):
    def __init__(self, db: Session) -> None:
        self._db = db

    def find_by_id(self, label_id: str) -> LabelModel | None:
        return self._db.query(LabelModel).filter(LabelModel.id == label_id).first()

    def find_by_name(self, name: str) -> LabelModel | None:
        return self._db.query(LabelModel).filter(LabelModel.name == name).first()

    def find_all(self) -> list[LabelModel]:
        return self._db.query(LabelModel).order_by(LabelModel.created_at).all()

    def save(self, label: LabelModel) -> LabelModel:
        self._db.add(label)
        self._db.flush()
        self._db.refresh(label)
        return label

    def delete(self, label: LabelModel) -> None:
        self._db.delete(label)
        self._db.flush()

    def tag_node(self, node_id: str, label_id: str) -> bool:
        """Associate a label with a node. Returns True if newly created, False if already existed."""
        exists = (
            self._db.execute(
                node_label_association.select().where(
                    node_label_association.c.node_id == node_id,
                    node_label_association.c.label_id == label_id,
                )
            ).first()
            is not None
        )
        if exists:
            return False
        self._db.execute(
            node_label_association.insert().values(node_id=node_id, label_id=label_id)
        )
        self._db.flush()
        return True

    def untag_node(self, node_id: str, label_id: str) -> None:
        self._db.execute(
            delete(node_label_association).where(
                node_label_association.c.node_id == node_id,
                node_label_association.c.label_id == label_id,
            )
        )
        self._db.flush()

    def get_node_labels(self, node_id: str) -> list[LabelModel]:
        return (
            self._db.query(LabelModel)
            .join(node_label_association, LabelModel.id == node_label_association.c.label_id)
            .filter(node_label_association.c.node_id == node_id)
            .all()
        )
