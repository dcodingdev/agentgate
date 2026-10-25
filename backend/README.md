# AgentGate Backend

AgentGate is an enterprise-grade autonomous Software Engineering (SWE) agent backend powered by LangGraph, FastAPI, Model Context Protocol (MCP), and E2B Sandbox execution with built-in Human-In-The-Loop (HITL) guardrails.

## Features

- **Multi-Agent StateGraph**: Structured orchestration spanning Guardrail, Supervisor, Research, Fix & Test, Verification, Reviewer, HITL Approval, and PR Agent.
- **Human-In-The-Loop (HITL)**: Risk-driven intervention powered by LangGraph checkpointers (`PostgresSaver`) allowing safe pause, review, and resume of runs.
- **Isolated Execution**: Low-level E2B cloud sandbox runtime for safe patch application and test suite execution.
- **MCP Integration**: Multi-server MCP client supporting GitHub, Filesystem, Tavily search, plus an internal FastMCP server for test parsing and risk scoring.
- **Real-Time Streaming**: Server-Sent Events (SSE) streaming run state and agent actions in real time.
- **Postgres Persistence**: Persists run metadata and LangGraph state checkpoints with `psycopg_pool` and `PostgresSaver`.

## Architecture Overview

```
backend/
├── README.md
├── pyproject.toml
├── uv.lock
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml              # Postgres + API
├── .dockerignore
│
├── src/
│   └── app/
│       ├── main.py                 # FastAPI app, lifespan (checkpointer, MCP client, graph)
│       ├── config.py               # pydantic-settings: keys, thresholds, allowed repos
│       │
│       ├── api/
│       │   ├── routes.py           # POST /runs, GET /runs/{id}/stream (SSE),
│       │   │                       # POST /runs/{id}/resume, GET /runs/{id}/state
│       │   └── schemas.py          # request/response models, StreamEvent, ResumeBody
│       │
│       ├── agents/
│       │   ├── graph.py            # StateGraph assembly, edges, compile(checkpointer)
│       │   ├── state.py            # SWEState TypedDict
│       │   ├── nodes.py            # guardrail, supervisor, research, fix_test,
│       │   │                       # verify, reviewer, hitl, pr_agent
│       │   ├── routing.py          # Conditional edge functions (pure Python)
│       │   └── prompts.py          # Prompt constants per agent node
│       │
│       ├── tools/
│       │   ├── mcp_client.py       # MultiServerMCPClient setup (GitHub, Filesystem, Tavily)
│       │   ├── mcp_tools.py        # tool lookup helpers, per-node tool subsets
│       │   ├── code_executor.py    # agent-facing tools: apply_patch, run_tests, read_logs
│       │   └── repo_tools_server.py # custom FastMCP (parse_test_output, compute_risk_score)
│       │
│       ├── execution/
│       │   └── e2b_sandbox.py      # low-level E2B wrapper: create, reconnect, run, kill
│       │
│       ├── services/
│       │   └── agent_service.py    # start run, stream events, resume; owns graph invocation
│       │
│       └── database/
│           ├── connection.py       # psycopg pool + PostgresSaver setup
│           └── models.py           # run metadata table (thread_id, issue_url, status, pr_url)
│
└── tests/
    ├── test_agents.py              # routing.py and risk logic, graph with mocked LLM
    ├── test_tools.py               # code_executor, test-output parsing, MCP wrappers
    └── test_api.py                 # endpoints, SSE stream, resume
```

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Key variables:
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`: LLM credentials
- `E2B_API_KEY`: Sandbox code execution
- `GITHUB_TOKEN`: Pull request and repository access
- `DATABASE_URL`: PostgreSQL connection string

### 2. Run with Docker Compose

```bash
docker compose up --build
```

### 3. Local Development

Install dependencies using `uv` or `pip`:

```bash
uv sync
# or
pip install -e .
```

Start the FastAPI application:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Running Tests

```bash
pytest
```

## API Endpoints

- `POST /api/v1/runs`: Initialize an autonomous SWE run for a GitHub issue.
- `GET /api/v1/runs/{id}/stream`: Connect to the Server-Sent Events (SSE) feed.
- `GET /api/v1/runs/{id}/state`: Inspect current checkpoint and agent graph state.
- `POST /api/v1/runs/{id}/resume`: Submit Human-in-the-Loop decision (approve / reject / feedback).
- `GET /health`: Health check endpoint.
