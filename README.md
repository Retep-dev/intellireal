# IntelliReal — Financial Intelligence Platform

> AI-powered financial document analysis with multi-agent RAG, citation-based answers, and interactive dashboards.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## Overview

IntelliReal is a portfolio-grade Financial Intelligence Platform that enables analysts to upload SEC filings, earnings reports, and annual reports — then ask questions, extract KPIs, detect risks, and compare trends using AI agents.

### Key Features

- **Document Upload** — PDF, XLSX, CSV, TXT, DOCX, HTML
- **Financial RAG** — Citation-based answers grounded in your documents
- **AI Agents** — Research, Risk Analysis, Market Trend, Financial Summary
- **SEC EDGAR Integration** — Auto-fetch 10-K, 10-Q, 8-K filings
- **KPI Extraction** — Revenue, EBITDA, margins, EPS comparisons
- **Interactive Dashboards** — Charts, KPI cards, risk radar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| LLM | NVIDIA NIM (Llama-3.1-70b) |
| Embeddings | NVIDIA NIM (nv-embedqa-e5-v5) |
| Agent Framework | LangChain + LangGraph |
| Vector DB | ChromaDB |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- NVIDIA NIM API Key ([get one free](https://build.nvidia.com))
- Supabase Project ([create one](https://supabase.com))

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase keys
npm run dev
```

## Project Structure

```
intellireal/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py             # Settings & environment
│   ├── auth/                 # Supabase auth middleware
│   ├── api/                  # API route handlers
│   ├── services/             # Document parsing, RAG, embeddings
│   ├── agents/               # LangGraph AI agents
│   └── models/               # Pydantic schemas
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page views
│   │   ├── contexts/         # Auth context
│   │   └── lib/              # Supabase client
│   └── index.html
└── README.md
```

## License

MIT
