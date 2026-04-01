"""Integration tests for /api/nodes endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


class TestGetTree:
    def test_empty_db_returns_empty_list(self, client: TestClient):
        resp = client.get("/api/nodes/tree")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_tree_after_create(self, client: TestClient):
        client.post("/api/nodes/directory", json={"name": "Root"})
        resp = client.get("/api/nodes/tree")
        assert resp.status_code == 200
        tree = resp.json()
        assert len(tree) == 1
        assert tree[0]["name"] == "Root"


class TestCreateDirectory:
    def test_creates_directory(self, client: TestClient):
        resp = client.post("/api/nodes/directory", json={"name": "Docs"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Docs"
        assert data["type"] == "directory"

    def test_creates_nested_directory(self, client: TestClient):
        parent_resp = client.post("/api/nodes/directory", json={"name": "Parent"})
        parent_id = parent_resp.json()["id"]
        child_resp = client.post("/api/nodes/directory", json={"name": "Child", "parent_id": parent_id})
        assert child_resp.status_code == 201
        assert child_resp.json()["parent_id"] == parent_id


class TestCreateFile:
    def test_creates_text_file(self, client: TestClient):
        dir_resp = client.post("/api/nodes/directory", json={"name": "Docs"})
        dir_id = dir_resp.json()["id"]
        resp = client.post("/api/nodes/file", json={
            "name": "readme.txt",
            "type": "text_file",
            "parent_id": dir_id,
            "size_kb": 8.0,
        })
        assert resp.status_code == 201
        assert resp.json()["type"] == "text_file"

    def test_invalid_type_rejected(self, client: TestClient):
        resp = client.post("/api/nodes/file", json={
            "name": "bad.bin",
            "type": "unknown_type",
            "size_kb": 1.0,
        })
        assert resp.status_code == 422


class TestDeleteNode:
    def test_deletes_existing_node(self, client: TestClient):
        create_resp = client.post("/api/nodes/directory", json={"name": "ToDelete"})
        node_id = create_resp.json()["id"]
        del_resp = client.delete(f"/api/nodes/{node_id}")
        assert del_resp.status_code == 204

    def test_404_on_missing_node(self, client: TestClient):
        resp = client.delete("/api/nodes/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"]["code"] == "NODE_NOT_FOUND"

    def test_cascade_deletes_children(self, client: TestClient):
        parent = client.post("/api/nodes/directory", json={"name": "Parent"}).json()
        client.post("/api/nodes/directory", json={"name": "Child", "parent_id": parent["id"]})
        client.delete(f"/api/nodes/{parent['id']}")
        tree = client.get("/api/nodes/tree").json()
        assert tree == []


class TestCopyNode:
    def test_copy_without_conflict(self, client: TestClient):
        src = client.post("/api/nodes/directory", json={"name": "Source"}).json()
        target = client.post("/api/nodes/directory", json={"name": "Target"}).json()
        resp = client.post(f"/api/nodes/{src['id']}/copy?target_dir_id={target['id']}")
        assert resp.status_code == 201
        data = resp.json()
        assert data["final_name"] == "Source"
        assert data["renamed"] is False

    def test_copy_with_name_conflict(self, client: TestClient):
        src = client.post("/api/nodes/directory", json={"name": "Notes"}).json()
        target = client.post("/api/nodes/directory", json={"name": "Target"}).json()
        # Pre-populate target with same-name child
        client.post("/api/nodes/directory", json={"name": "Notes", "parent_id": target["id"]})
        resp = client.post(f"/api/nodes/{src['id']}/copy?target_dir_id={target['id']}")
        assert resp.status_code == 201
        data = resp.json()
        assert data["final_name"] == "Notes_copy"
        assert data["renamed"] is True

    def test_copy_missing_source_returns_404(self, client: TestClient):
        target = client.post("/api/nodes/directory", json={"name": "T"}).json()
        resp = client.post(f"/api/nodes/bad-id/copy?target_dir_id={target['id']}")
        assert resp.status_code == 404


class TestSortChildren:
    def test_sort_name_asc(self, client: TestClient):
        parent = client.post("/api/nodes/directory", json={"name": "Parent"}).json()
        pid = parent["id"]
        client.post("/api/nodes/directory", json={"name": "Zebra", "parent_id": pid})
        client.post("/api/nodes/directory", json={"name": "Alpha", "parent_id": pid})
        resp = client.patch(f"/api/nodes/{pid}/sort", json={"strategy": "name_asc"})
        assert resp.status_code == 200
        names = [n["name"] for n in resp.json()]
        assert names == sorted(names)

    def test_invalid_strategy_rejected(self, client: TestClient):
        parent = client.post("/api/nodes/directory", json={"name": "D"}).json()
        resp = client.patch(f"/api/nodes/{parent['id']}/sort", json={"strategy": "invalid"})
        assert resp.status_code == 422


class TestNodeLabels:
    def _create_node_and_label(self, client: TestClient):
        node = client.post("/api/nodes/directory", json={"name": "Dir"}).json()
        label = client.post("/api/labels", json={"name": "Tag", "color": "#aaa"}).json()
        return node["id"], label["id"]

    def test_tag_and_get_labels(self, client: TestClient):
        node_id, label_id = self._create_node_and_label(client)
        tag_resp = client.post(f"/api/nodes/{node_id}/labels/{label_id}")
        assert tag_resp.status_code == 201
        get_resp = client.get(f"/api/nodes/{node_id}/labels")
        assert get_resp.status_code == 200
        assert len(get_resp.json()) == 1

    def test_tag_idempotent_returns_200(self, client: TestClient):
        node_id, label_id = self._create_node_and_label(client)
        client.post(f"/api/nodes/{node_id}/labels/{label_id}")
        resp = client.post(f"/api/nodes/{node_id}/labels/{label_id}")
        assert resp.status_code == 200

    def test_untag_removes_label(self, client: TestClient):
        node_id, label_id = self._create_node_and_label(client)
        client.post(f"/api/nodes/{node_id}/labels/{label_id}")
        del_resp = client.delete(f"/api/nodes/{node_id}/labels/{label_id}")
        assert del_resp.status_code == 204
        labels = client.get(f"/api/nodes/{node_id}/labels").json()
        assert labels == []
