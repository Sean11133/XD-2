"""Unit tests for NodeService (Repository mocked with pytest-mock)."""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock

from app.models.node import NodeModel
from app.schemas.node import DirectoryCreate, FileCreate, NodeType, SortRequest
from app.services.node_service import _resolve_name, _build_tree, NodeService


# ── Pure function tests ────────────────────────────────────────────────────────

class TestResolveName:
    def test_no_conflict(self):
        name, renamed = _resolve_name("notes", {"readme", "docs"})
        assert name == "notes"
        assert renamed is False

    def test_first_copy(self):
        name, renamed = _resolve_name("notes", {"notes", "readme"})
        assert name == "notes_copy"
        assert renamed is True

    def test_second_copy(self):
        name, renamed = _resolve_name("notes", {"notes", "notes_copy"})
        assert name == "notes_copy_2"
        assert renamed is True

    def test_third_copy(self):
        name, renamed = _resolve_name("notes", {"notes", "notes_copy", "notes_copy_2"})
        assert name == "notes_copy_3"
        assert renamed is True


class TestBuildTree:
    def test_empty(self):
        result = _build_tree([])
        assert result == []

    def test_single_root_directory(self):
        root = NodeModel(id="root", type="directory", name="root", sort_order=0, parent_id=None, children=[], size_kb=None, created_at=None)
        result = _build_tree([root])
        assert len(result) == 1
        assert result[0].name == "root"
        assert result[0].children == []

    def test_parent_child(self):
        parent = NodeModel(id="p1", type="directory", name="Parent", sort_order=0, parent_id=None, children=[], size_kb=None, created_at=None)
        child = NodeModel(id="c1", type="text_file", name="child.txt", sort_order=0, parent_id="p1", children=[], size_kb=10.0, created_at=None)
        result = _build_tree([parent, child])
        assert len(result) == 1
        assert result[0].children[0].name == "child.txt"


# ── NodeService unit tests (mock Repository) ──────────────────────────────────

class TestNodeServiceGetTree:
    def test_empty_db(self, db_session):
        svc = NodeService(db_session)
        result = svc.get_tree()
        assert result == []


class TestNodeServiceCreateDirectory:
    def test_creates_directory(self, db_session):
        svc = NodeService(db_session)
        resp = svc.create_directory(DirectoryCreate(name="TestDir"))
        assert resp.name == "TestDir"
        assert resp.type == NodeType.DIRECTORY
        assert resp.id is not None

    def test_creates_child_directory(self, db_session):
        svc = NodeService(db_session)
        parent = svc.create_directory(DirectoryCreate(name="Parent"))
        child = svc.create_directory(DirectoryCreate(name="Child", parent_id=parent.id))
        assert child.parent_id == parent.id


class TestNodeServiceCreateFile:
    def test_creates_text_file(self, db_session):
        svc = NodeService(db_session)
        dir_resp = svc.create_directory(DirectoryCreate(name="Docs"))
        file_resp = svc.create_file(
            FileCreate(name="notes.txt", type=NodeType.TEXT_FILE, parent_id=dir_resp.id, size_kb=5.0)
        )
        assert file_resp.name == "notes.txt"
        assert file_resp.type == NodeType.TEXT_FILE
        assert file_resp.size_kb == 5.0


class TestNodeServiceDeleteNode:
    def test_deletes_existing_node(self, db_session):
        svc = NodeService(db_session)
        resp = svc.create_directory(DirectoryCreate(name="ToDelete"))
        svc.delete_node(resp.id)
        tree = svc.get_tree()
        assert all(n.id != resp.id for n in tree)

    def test_raises_on_missing_node(self, db_session):
        svc = NodeService(db_session)
        with pytest.raises(KeyError):
            svc.delete_node("nonexistent-id")

    def test_cascade_deletes_children(self, db_session):
        svc = NodeService(db_session)
        parent = svc.create_directory(DirectoryCreate(name="Parent"))
        svc.create_directory(DirectoryCreate(name="Child", parent_id=parent.id))
        svc.delete_node(parent.id)
        tree = svc.get_tree()
        assert tree == []


class TestNodeServiceCopyNode:
    def test_copy_without_conflict(self, db_session):
        svc = NodeService(db_session)
        src = svc.create_directory(DirectoryCreate(name="Src"))
        target = svc.create_directory(DirectoryCreate(name="Target"))
        result = svc.copy_node(src.id, target.id)
        assert result.final_name == "Src"
        assert result.renamed is False

    def test_copy_with_name_conflict(self, db_session):
        svc = NodeService(db_session)
        src = svc.create_directory(DirectoryCreate(name="Notes"))
        target = svc.create_directory(DirectoryCreate(name="Target"))
        # Pre-create a child with the same name in target
        svc.create_directory(DirectoryCreate(name="Notes", parent_id=target.id))
        result = svc.copy_node(src.id, target.id)
        assert result.final_name == "Notes_copy"
        assert result.renamed is True

    def test_copy_raises_on_missing_source(self, db_session):
        svc = NodeService(db_session)
        target = svc.create_directory(DirectoryCreate(name="Target"))
        with pytest.raises(KeyError):
            svc.copy_node("bad-id", target.id)


class TestNodeServiceSortChildren:
    def test_sort_name_asc(self, db_session):
        svc = NodeService(db_session)
        parent = svc.create_directory(DirectoryCreate(name="Parent"))
        svc.create_directory(DirectoryCreate(name="Zebra", parent_id=parent.id))
        svc.create_directory(DirectoryCreate(name="Alpha", parent_id=parent.id))
        sorted_children = svc.sort_children(parent.id, SortRequest(strategy="name_asc"))
        names = [n.name for n in sorted_children]
        assert names == sorted(names)

    def test_sort_name_desc(self, db_session):
        svc = NodeService(db_session)
        parent = svc.create_directory(DirectoryCreate(name="Parent"))
        svc.create_directory(DirectoryCreate(name="Ant", parent_id=parent.id))
        svc.create_directory(DirectoryCreate(name="Bee", parent_id=parent.id))
        sorted_children = svc.sort_children(parent.id, SortRequest(strategy="name_desc"))
        names = [n.name for n in sorted_children]
        assert names == sorted(names, reverse=True)

    def test_sort_raises_on_missing_dir(self, db_session):
        svc = NodeService(db_session)
        with pytest.raises(KeyError):
            svc.sort_children("bad-id", SortRequest(strategy="name_asc"))
