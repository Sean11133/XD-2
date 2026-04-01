"""Integration tests for /api/labels endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


class TestGetAllLabels:
    def test_empty_returns_empty_list(self, client: TestClient):
        resp = client.get("/api/labels")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_all_labels(self, client: TestClient):
        client.post("/api/labels", json={"name": "A", "color": "#aaa"})
        client.post("/api/labels", json={"name": "B", "color": "#bbb"})
        resp = client.get("/api/labels")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


class TestCreateLabel:
    def test_creates_new_label(self, client: TestClient):
        resp = client.post("/api/labels", json={"name": "Important", "color": "#ef4444"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Important"
        assert data["color"] == "#ef4444"
        assert "id" in data

    def test_flyweight_returns_200_for_duplicate(self, client: TestClient):
        client.post("/api/labels", json={"name": "Tag", "color": "#111"})
        resp = client.post("/api/labels", json={"name": "Tag", "color": "#222"})
        assert resp.status_code == 200
        # Original color preserved
        assert resp.json()["color"] == "#111"

    def test_missing_name_rejected(self, client: TestClient):
        resp = client.post("/api/labels", json={"color": "#abc"})
        assert resp.status_code == 422

    def test_missing_color_rejected(self, client: TestClient):
        resp = client.post("/api/labels", json={"name": "MissingColor"})
        assert resp.status_code == 422


class TestDeleteLabel:
    def test_deletes_existing_label(self, client: TestClient):
        create_resp = client.post("/api/labels", json={"name": "ToDelete", "color": "#333"})
        label_id = create_resp.json()["id"]
        del_resp = client.delete(f"/api/labels/{label_id}")
        assert del_resp.status_code == 204

    def test_404_on_missing_label(self, client: TestClient):
        resp = client.delete("/api/labels/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"]["code"] == "LABEL_NOT_FOUND"

    def test_delete_label_removes_node_associations(self, client: TestClient):
        node = client.post("/api/nodes/directory", json={"name": "Dir"}).json()
        label = client.post("/api/labels", json={"name": "AssocLabel", "color": "#444"}).json()
        client.post(f"/api/nodes/{node['id']}/labels/{label['id']}")
        # Delete label → association should be cleaned up via CASCADE
        client.delete(f"/api/labels/{label['id']}")
        labels = client.get(f"/api/nodes/{node['id']}/labels").json()
        assert labels == []
