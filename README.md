# 🏢 IntelliReal — Enterprise Financial Intelligence & Multi-Agent RAG Platform

> **An Institutional-Grade Financial Analytics Engine** powered by **Multi-Agent RAG Architecture**, **NVIDIA NIM LLM Acceleration**, **SEC EDGAR Compliance Auto-Ingestion**, and **Google Analytics 4 UI System**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Llama--3.1--70B-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-FF6F00)](https://trychroma.com)
[![Supabase](https://img.shields.io/badge/BackendDB-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

---

## 🌟 Executive Overview

**IntelliReal** is an enterprise-grade financial intelligence engine engineered for equity research analysts, portfolio managers, and risk officers. Designed to eliminate manual filing reviews, IntelliReal automates document ingestion across **SEC filings (10-K, 10-Q, 8-K)**, corporate annual reports, earnings call transcripts, and legal debt agreements.

By orchestrating **four specialized AI Agents** over a hybrid retrieval pipeline (**Dense Vector Embeddings + Keyword BM25 RAG**), IntelliReal delivers precise, citation-backed analytical responses, structured KPI tables, YoY margin trajectory models, and legal risk matrices.

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                IntelliReal Frontend (React + Vite)                      │
│        • Google GA4 Drawer Sidebar  • Live Global Search Bar  • Segmented AI Controls    │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ REST / JSON
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend Orchestrator                             │
│       • API Routing  • Document Chunking  • Multi-Agent Dispatcher  • Health Diagnostics  │
└───────┬───────────────────────────┬───────────────────────────┬─────────────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Multi-Agent  │           │   SEC EDGAR   │           │ Vector & SQL  │
│  Orchestration│           │ Compliance    │           │ Storage       │
│  (LangChain)  │           │ Ingestion     │           │ (ChromaDB +   │
└───────┬───────┘           └───────┬───────┘           │  Supabase)    │
        │                           │                   └───────────────┘
        ▼                           ▼
┌───────────────────────────────────────────┐
│             NVIDIA NIM Cloud              │
│  • meta/llama-3.1-70b-instruct (Primary)  │
│  • meta/llama-3.1-8b-instruct (Fallback)  │
│  • nvidia/nv-embedqa-e5-v5 (Embeddings)   │
└───────────────────────────────────────────┘
```

---

## 🤖 4 Specialized Financial AI Agents

IntelliReal deploys four specialized autonomous agents, each fine-tuned with domain-specific system prompts, output schemas, and dynamic temperature controls:

| Agent | Core Objective | Key Deliverables & Artifacts | Target Queries |
|-------|────────────────|──────────────────────────────|----------------|
| **🔍 Research Q&A Agent** | Fact extraction & forensic Q&A | Page-level citations, exact dollar metrics, audit disclosures | *"What was net income, gross margin, and auditor opinion?"* |
| **📋 Financial Summary Agent** | Structured executive summaries | GFM financial tables, balance sheet breakdowns, segment revenue | *"Summarize Q3 financial highlights in a KPI table."* |
| **🛡️ Risk Analysis Agent** | Threat & covenant extraction | Risk Severity Matrix (`High`, `Medium`, `Low`), litigation exposure | *"Extract legal liabilities, debt covenants, and liquidity threats."* |
| **📈 Market Trend Agent** | Growth & margin trajectory | YoY growth tables, margin direction (`↑`, `↓`, `→`), guidance sentiment | *"Analyze YoY revenue growth velocity and margin trajectory."* |

---

## Key Enterprise Capabilities

### 1. ⚡ Automated SEC EDGAR Compliance Ingestion Engine
- **Direct SEC REST API Ingestion**: Fetch official 10-K, 10-Q, and 8-K filings directly by ticker symbol (`AAPL`, `NVDA`, `MSFT`, `TSLA`, `GOOGL`).
- **1-Click Pre-Seeding**: Populate vector store with real-world 10-K filings with zero manual downloads.
- **Multi-Format Ingestion**: Full parser support for `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, and `.html` documents up to 50MB.

### 2. 🎯 Precision Citation-Backed RAG Architecture
- **Verifiable References**: Every generated response includes clickable citation chips displaying the document name, exact page number, and relevance percentage match (`e.g., AAPL_10K.pdf · Page 42 [ 89% match ]`).
- **Sub-Second Dense Vector Retrieval**: Powered by ChromaDB persistent vector storage and NVIDIA's `nv-embedqa-e5-v5` 1024-dim embedding model.

### 3. 🛡️ High-Availability Latency & Fallback Layer
- **Automatic Model Fallback**: Features automatic fallback to `meta/llama-3.1-8b-instruct` when `70b` requests hit API latency thresholds, guaranteeing zero downtime.
- **Hybrid Local-Cloud Authentication**: Supports both **Supabase Cloud Auth** and instant **1-Click Local Demo Mode**.

### 4. 🎨 Google GA4 Financial UI System
- **Responsive Drawer Rail**: 56px collapsed icon rail expanding to 256px drawer on hover/pin.
- **Segmented Control Agent Selector**: Material 3 toggle bar with custom active color accents for each agent.
- **GitHub Flavored Markdown (GFM)**: Built-in markdown table rendering for financial balance sheets and income statements.

---

## 🛠️ Technology Stack

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **LLM Inference**: NVIDIA NIM API (`meta/llama-3.1-70b-instruct` / `meta/llama-3.1-8b-instruct`)
- **Embedding Model**: NVIDIA NIM (`nvidia/nv-embedqa-e5-v5`)
- **Agent Orchestration**: LangChain Core / LangGraph
- **Vector Database**: ChromaDB (Persistent Disk Store)
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth
- **PDF & Document Parsing**: PyPDF, python-docx, Beautiful Soup 4

### Frontend Stack
- **Framework**: React 18 + Vite
- **Router**: React Router v6
- **Markdown & Tables**: `react-markdown` + `remark-gfm`
- **Icons**: Lucide React
- **Styling**: Vanilla CSS3 Design Tokens (GA4 Dark/Light Palette)

---

## 📡 API Reference Manual

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/` | `POST` | Dispatches query to the selected AI Agent & returns answer + citations |
| `/api/documents/` | `GET` | Lists all uploaded financial documents and vector chunk counts |
| `/api/documents/upload` | `POST` | Uploads and indexes a `.pdf`, `.docx`, `.txt`, or `.html` file |
| `/api/documents/stats` | `GET` | Computes live dashboard metrics (total docs, vector chunks, file types) |
| `/api/sec/fetch` | `POST` | Fetches SEC EDGAR filings for any ticker (`ticker`, `filing_type`, `year`) |
| `/api/sec/preseed` | `POST` | Auto-fetches pre-seeded benchmark SEC filings into ChromaDB |
| `/api/health` | `GET` | System health check & vector database connectivity diagnostic |

---

## 🚀 Enterprise Deployment & Local Setup Guide

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & **npm 9+**
- **NVIDIA NIM API Key** ([Obtain free key](https://build.nvidia.com))
- **Supabase Account** *(Optional — App defaults to local demo fallback)*

---

### 1. Backend Setup

```bash
# Navigate to backend root
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your API keys:
```env
NVIDIA_API_KEY=nvapi-YOUR_NVIDIA_NIM_KEY_HERE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
PORT=8000
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*Backend runs live at `http://localhost:8000` with Swagger Docs at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup

```bash
# Navigate to frontend root
cd frontend

# Install Node modules
npm install

# Configure local environment
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000/api
```

Start Vite dev server:
```bash
npm run dev
```
*Frontend runs live at `http://localhost:5173`.*

---

## 📂 Repository Architecture

```
intellireal/
├── backend/
│   ├── main.py                  # FastAPI Application Entrypoint
│   ├── config.py                 # Pydantic Settings & Env Configuration
│   ├── api/                      # REST API Endpoint Routers
│   │   ├── chat.py               # Agent Routing Endpoint (/api/chat/)
│   │   ├── documents.py          # Document Management (/api/documents/)
│   │   └── sec.py                # SEC EDGAR Integration Router (/api/sec/)
│   ├── agents/                   # Multi-Agent LangGraph Architectures
│   │   ├── orchestrator.py       # Master Agent Router
│   │   ├── research_agent.py     # Factual Q&A Agent
│   │   ├── summary_agent.py      # Financial KPI Summary Agent
│   │   ├── risk_agent.py         # Risk Severity Matrix Agent
│   │   └── trend_agent.py        # YoY Growth & Margin Trajectory Agent
│   ├── services/                 # RAG Engine & Ingestion Pipelines
│   │   ├── document_processor.py # Multi-Format Parser (.pdf, .docx, .html)
│   │   ├── vector_store.py       # ChromaDB Persistent Vector Indexing
│   │   ├── nvidia_nim.py         # LLM & Embedding Inference Client
│   │   └── sec_fetcher.py        # SEC EDGAR Compliance API Fetcher
│   └── models/                   # Pydantic Request & Response Schemas
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── Header.jsx        # GA4 Header, Search, Apps & User Menus
│   │   │   ├── Sidebar.jsx       # 56px Expanding Drawer Navigation
│   │   │   ├── chat/             # Chat Panel & Dynamic Agent Screens
│   │   │   └── documents/        # Document Upload Modal & SEC Fetcher Tab
│   │   ├── pages/                # Page Views
│   │   │   ├── Dashboard.jsx     # Live GA4 Financial Dashboard
│   │   │   ├── Login.jsx         # Supabase & Demo Mode Login
│   │   │   └── Signup.jsx        # Analyst Account Registration
│   │   ├── contexts/             # React Auth Context & Persistence
│   │   └── index.css             # Complete GA4 CSS Design Tokens
│   └── index.html
└── README.md                     # Platform Architecture & Deployment Guide
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  <b>Built with precision for Financial Analysts & Quantitative Researchers.</b>
</p>
