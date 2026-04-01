"""LabelService — Flyweight label management and node-label association logic."""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.label import LabelModel
from app.repositories.label_repository import LabelRepository
from app.repositories.node_repository import NodeRepository
from app.schemas.label import LabelCreate, LabelResponse

log = logging.getLogger(__name__)


class LabelService:
    def __init__(self, db: Session) -> None:
        self._repo = LabelRepository(db)
        self._node_repo = NodeRepository(db)
        self._db = db

    def get_all(self) -> list[LabelResponse]:
        labels = self._repo.find_all()
        return [LabelResponse.model_validate(lb) for lb in labels]

    def get_or_create(self, data: LabelCreate) -> tuple[LabelResponse, bool]:
        """Flyweight semantics: return existing label if name already exists.

        Returns:
            (LabelResponse, is_new) — is_new=False when the label already existed.
        """
        existing = self._repo.find_by_name(data.name)
        if existing:
            log.info("Label already exists (Flyweight reuse): name=%s", data.name)
            return LabelResponse.model_validate(existing), False

        new_label = LabelModel(
            name=data.name,
            color=data.color,
            description=data.description,
        )
        saved = self._repo.save(new_label)
        self._db.commit()
        log.info("Label created: id=%s name=%s", saved.id, saved.name)
        return LabelResponse.model_validate(saved), True

    def delete(self, label_id: str) -> None:
        label = self._repo.find_by_id(label_id)
        if label is None:
            raise KeyError(label_id)
        self._repo.delete(label)
        self._db.commit()
        log.info("Label deleted: id=%s", label_id)

    def tag_node(self, node_id: str, label_id: str) -> bool:
        if self._node_repo.find_by_id(node_id) is None:
            raise KeyError(f"node:{node_id}")
        if self._repo.find_by_id(label_id) is None:
            raise KeyError(f"label:{label_id}")
        is_new = self._repo.tag_node(node_id, label_id)
        self._db.commit()
        return is_new

    def untag_node(self, node_id: str, label_id: str) -> None:
        if self._node_repo.find_by_id(node_id) is None:
            raise KeyError(f"node:{node_id}")
        if self._repo.find_by_id(label_id) is None:
            raise KeyError(f"label:{label_id}")
        self._repo.untag_node(node_id, label_id)
        self._db.commit()

    def get_node_labels(self, node_id: str) -> list[LabelResponse]:
        if self._node_repo.find_by_id(node_id) is None:
            raise KeyError(f"node:{node_id}")
        labels = self._repo.get_node_labels(node_id)
        return [LabelResponse.model_validate(lb) for lb in labels]
