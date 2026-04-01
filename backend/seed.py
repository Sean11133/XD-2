"""Seed script — populate the database with initial data mirroring sampleData.ts.

Run:
    cd backend
    python seed.py

Idempotent: skips insertion if root directory already exists.
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone

# Must be executed from backend/ so DB path resolves correctly
from app.config import get_settings  # noqa: F401 — triggers settings init
from app.database import Base, SessionLocal, engine
import app.models  # noqa: F401 — populate Base.metadata

from app.models.node import NodeModel
from app.models.label import LabelModel
from app.models.node import node_label_association

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)


def seed() -> None:
    db = SessionLocal()
    try:
        # Idempotency guard
        existing_root = db.query(NodeModel).filter(NodeModel.name == "root", NodeModel.parent_id.is_(None)).first()
        if existing_root:
            log.info("Seed data already present — skipping.")
            return

        # ── Directories ───────────────────────────────────────────────────────
        root = NodeModel(id="root", type="directory", name="root", sort_order=0)
        docs = NodeModel(id="docs", type="directory", name="Documents", parent_id="root", sort_order=0)
        imgs = NodeModel(id="imgs", type="directory", name="Images", parent_id="root", sort_order=1)
        work = NodeModel(id="work", type="directory", name="Work", parent_id="docs", sort_order=0)

        # ── Files ─────────────────────────────────────────────────────────────
        dt = lambda y, m, d: datetime(y, m, d, tzinfo=timezone.utc)

        readme = NodeModel(id="readme", type="text_file", name="README.txt", parent_id="root", sort_order=2, size_kb=4.0, created_at=dt(2024, 1, 1))
        report = NodeModel(id="report", type="word_document", name="Annual Report.docx", parent_id="docs", sort_order=1, size_kb=128.0, created_at=dt(2024, 3, 15))
        notes = NodeModel(id="notes", type="text_file", name="Meeting Notes.txt", parent_id="work", sort_order=0, size_kb=12.0, created_at=dt(2024, 4, 20))
        logo = NodeModel(id="logo", type="image_file", name="logo.png", parent_id="imgs", sort_order=0, size_kb=256.0, created_at=dt(2024, 2, 10))
        banner = NodeModel(id="banner", type="image_file", name="banner.jpg", parent_id="imgs", sort_order=1, size_kb=512.0, created_at=dt(2024, 2, 11))

        for node in [root, docs, imgs, work, readme, report, notes, logo, banner]:
            db.add(node)
        db.flush()

        # ── Labels ────────────────────────────────────────────────────────────
        label_important = LabelModel(id="lbl-important", name="Important", color="#ef4444", description="High priority items")
        label_archive = LabelModel(id="lbl-archive", name="Archive", color="#6b7280", description="Archived items")
        label_review = LabelModel(id="lbl-review", name="Review", color="#f59e0b", description="Needs review")

        for lb in [label_important, label_archive, label_review]:
            db.add(lb)
        db.flush()

        # ── Node-Label associations ───────────────────────────────────────────
        db.execute(node_label_association.insert().values([
            {"node_id": "report", "label_id": "lbl-important"},
            {"node_id": "notes",  "label_id": "lbl-review"},
            {"node_id": "readme", "label_id": "lbl-archive"},
        ]))

        db.commit()
        log.info("Seed completed: %d nodes, %d labels inserted.", 9, 3)

    except Exception as exc:
        db.rollback()
        log.error("Seed failed: %s", exc)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    sys.exit(0)
