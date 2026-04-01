"""SQLAlchemy ORM model for file-system nodes (Adjacency List tree)."""
from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Association table for the many-to-many Node ↔ Label relationship
node_label_association = Table(
    "node_label_record",
    Base.metadata,
    Column("node_id", String, ForeignKey("node_record.id", ondelete="CASCADE"), primary_key=True),
    Column("label_id", String, ForeignKey("label_record.id", ondelete="CASCADE"), primary_key=True),
)


class NodeModel(Base):
    __tablename__ = "node_record"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("node_record.id", ondelete="CASCADE"), nullable=True, index=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    size_kb: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Self-referential relationship (Adjacency List)
    parent: Mapped[NodeModel | None] = relationship(
        "NodeModel",
        back_populates="children",
        remote_side="NodeModel.id",
    )
    children: Mapped[list[NodeModel]] = relationship(
        "NodeModel",
        back_populates="parent",
        order_by="NodeModel.sort_order",
        cascade="all, delete-orphan",
    )

    # Many-to-many with labels
    labels: Mapped[list] = relationship(
        "LabelModel",
        secondary=node_label_association,
        back_populates="nodes",
    )
