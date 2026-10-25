"""Tests for FastAPI endpoints: POST /runs, GET /runs/{id}/stream, POST /runs/{id}/resume, GET /runs/{id}/state."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify health check returns 200 OK and expected service identifier."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "agentgate-backend"


def test_create_run_endpoint():
    """Verify POST /runs creates an agent session."""
    payload = {
        "issue_url": "https://github.com/org/repo/issues/101",
        "repo": "org/repo",
        "issue_title": "Fix crash on invalid JSON",
        "issue_description": "App crashes when invalid JSON is received.",
    }
    response = client.post("/runs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "thread_id" in data
    assert data["status"] == "pending"
    assert f"/runs/{data['thread_id']}/stream" in data["stream_url"]

    return data["thread_id"]


def test_get_run_state_endpoint():
    """Verify GET /runs/{id}/state retrieves run status and metadata."""
    # First create a run
    payload = {
        "issue_url": "https://github.com/org/repo/issues/102",
        "repo": "org/repo",
        "issue_title": "Memory leak fix",
    }
    create_res = client.post("/runs", json=payload)
    thread_id = create_res.json()["thread_id"]

    # Check state
    state_res = client.get(f"/runs/{thread_id}/state")
    assert state_res.status_code == 200
    state_data = state_res.json()
    assert state_data["thread_id"] == thread_id
    assert "status" in state_data


def test_resume_run_endpoint():
    """Verify POST /runs/{id}/resume records approval decision."""
    payload = {
        "issue_url": "https://github.com/org/repo/issues/103",
        "repo": "org/repo",
    }
    create_res = client.post("/runs", json=payload)
    thread_id = create_res.json()["thread_id"]

    # Resume with approval
    resume_payload = {
        "approved": True,
        "feedback": "LGTM! Approved for PR creation.",
    }
    resume_res = client.post(f"/runs/{thread_id}/resume", json=resume_payload)
    assert resume_res.status_code == 200
    resume_data = resume_res.json()
    assert resume_data["thread_id"] == thread_id
    assert resume_data["status"] == "resumed"


def test_stream_run_headers():
    """Verify GET /runs/{id}/stream sets text/event-stream headers."""
    payload = {
        "issue_url": "https://github.com/org/repo/issues/104",
        "repo": "org/repo",
    }
    create_res = client.post("/runs", json=payload)
    thread_id = create_res.json()["thread_id"]

    # Test stream response headers
    with client.stream("GET", f"/runs/{thread_id}/stream") as stream_res:
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
