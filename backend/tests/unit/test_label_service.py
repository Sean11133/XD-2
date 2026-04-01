"""Unit tests for LabelService."""
from __future__ import annotations

import pytest

from app.schemas.label import LabelCreate
from app.schemas.node import DirectoryCreate
from app.services.label_service import LabelService
from app.services.node_service import NodeService


class TestLabelServiceGetOrCreate:
    def test_creates_new_label(self, db_session):
        svc = LabelService(db_session)
        resp, is_new = svc.get_or_create(LabelCreate(name="Important", color="#ef4444"))
        assert resp.name == "Important"
        assert is_new is True

    def test_flyweight_returns_existing(self, db_session):
        svc = LabelService(db_session)
        first, _ = svc.get_or_create(LabelCreate(name="Duplicate", color="#aabbcc"))
        second, is_new = svc.get_or_create(LabelCreate(name="Duplicate", color="#112233"))
        assert is_new is False
        assert first.id == second.id
        assert second.color == "#aabbcc"  # original color preserved

    def test_different_names_create_separate_labels(self, db_session):
        svc = LabelService(db_session)
        a, _ = svc.get_or_create(LabelCreate(name="LabelA", color="#aaa"))
        b, _ = svc.get_or_create(LabelCreate(name="LabelB", color="#bbb"))
        assert a.id != b.id


class TestLabelServiceGetAll:
    def test_empty(self, db_session):
        svc = LabelService(db_session)
        assert svc.get_all() == []

    def test_returns_all_labels(self, db_session):
        svc = LabelService(db_session)
        svc.get_or_create(LabelCreate(name="A", color="#aaa"))
        svc.get_or_create(LabelCreate(name="B", color="#bbb"))
        all_labels = svc.get_all()
        assert len(all_labels) == 2


class TestLabelServiceDelete:
    def test_deletes_existing(self, db_session):
        svc = LabelService(db_session)
        resp, _ = svc.get_or_create(LabelCreate(name="ToDelete", color="#ccc"))
        svc.delete(resp.id)
        assert svc.get_all() == []

    def test_raises_on_missing(self, db_session):
        svc = LabelService(db_session)
        with pytest.raises(KeyError):
            svc.delete("nonexistent-id")


class TestLabelServiceTagNode:
    def _setup(self, db_session):
        node_svc = NodeService(db_session)
        label_svc = LabelService(db_session)
        node = node_svc.create_directory(DirectoryCreate(name="TestDir"))
        label, _ = label_svc.get_or_create(LabelCreate(name="Tag", color="#ddd"))
        return node, label, label_svc

    def test_tag_node(self, db_session):
        node, label, svc = self._setup(db_session)
        is_new = svc.tag_node(node.id, label.id)
        assert is_new is True

    def test_tag_idempotent(self, db_session):
        node, label, svc = self._setup(db_session)
        svc.tag_node(node.id, label.id)
        is_new = svc.tag_node(node.id, label.id)
        assert is_new is False

    def test_untag_node(self, db_session):
        node, label, svc = self._setup(db_session)
        svc.tag_node(node.id, label.id)
        svc.untag_node(node.id, label.id)
        labels = svc.get_node_labels(node.id)
        assert labels == []

    def test_get_node_labels(self, db_session):
        node, label, svc = self._setup(db_session)
        svc.tag_node(node.id, label.id)
        labels = svc.get_node_labels(node.id)
        assert len(labels) == 1
        assert labels[0].name == "Tag"

    def test_tag_raises_on_missing_node(self, db_session):
        svc = LabelService(db_session)
        label, _ = svc.get_or_create(LabelCreate(name="Lbl", color="#eee"))
        with pytest.raises(KeyError):
            svc.tag_node("missing-node-id", label.id)

    def test_tag_raises_on_missing_label(self, db_session):
        node_svc = NodeService(db_session)
        svc = LabelService(db_session)
        node = node_svc.create_directory(DirectoryCreate(name="Dir"))
        with pytest.raises(KeyError):
            svc.tag_node(node.id, "missing-label-id")
