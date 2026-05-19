<div align="center">

# ContextOS

### *Convert undocumented enterprise chaos into governed, Gemini-powered AI pipelines.*

[![Track 2: AI Agents · Google AI Studio](https://img.shields.io/badge/PRIMARY-Track%202%3A%20AI%20Agents%20·%20Google%20AI%20Studio-4f46e5?style=flat-square&logo=google)](https://ai.google.dev/)
[![Track 1: Security & Governance](https://img.shields.io/badge/SECONDARY-Track%201%3A%20Security%20&%20Governance%20·%20Veea-b45309?style=flat-square)](https://veea.com/)
[![Track 4: Data & Intelligence](https://img.shields.io/badge/BONUS-Track%204%3A%20Data%20&%20Intelligence-7c3aed?style=flat-square)](/)
[![Track 3: Digital Twin Simulation](https://img.shields.io/badge/BONUS-Track%203%3A%20Digital%20Twin%20Simulation-0d9488?style=flat-square)](/)

**Built with Gemini 3.1 Pro · React 19 · React Flow · Veea Edge**

[**→ Try the Live Demo**](https://aistudio.google.com/apps/8c1cb6b1-8ae5-4d3d-8393-8f1920860e7c)

</div>

---

## The Problem — The $100 Billion Invisible Workflow Gap

Enterprise operations are drowning in undocumented, manual, cross-system workflows. When an employee is offboarded, a contract is terminated, or a system access incident occurs — the steps to handle it exist only as **tribal knowledge**: scattered across emails, Confluence wikis, and the heads of employees who might leave tomorrow.

The result: **30% of enterprise workforce time** is lost to manual, siloed coordination across SAP, Jira, HR systems, Slack, and financial tools — systems that were never designed to talk to each other.

**ContextOS eliminates this gap.** Upload any SOP document, PDF, image, or process diagram. Gemini reasons over it, extracts the causal workflow topology, and converts it into a policy-governed, executable AI pipeline — without touching your legacy systems.

---

## What ContextOS Does

- 📄 **Multimodal SOP Ingestion** — Accepts PDFs, images, and text documents. Runs PII redaction locally before any cloud transmission.
- 🧠 **Gemini-Powered Workflow Inference** — Gemini 3.1 Pro extracts structural dependencies, departmental boundaries, and risk classifications from unstructured content, outputting a strict DAG schema.
- 🕸️ **Execution Graph Generation** — The inferred topology is rendered as an interactive directed acyclic graph (DAG) via React Flow, with node-level risk profiling.
- 🤖 **Multi-Agent Orchestration** — 4 specialized agents coordinate in sequence: Workflow Analyst → Security Governance → Systems Integration → Execution Planner.
- 🔐 **Zero-Trust Policy Engine (Veea Edge)** — A deterministic governance layer sits between AI reasoning and execution. High-risk nodes trigger mandatory human approval — the AI cannot bypass it.
- 👤 **Human-in-the-Loop** — Security operations can approve or deny high-risk actions in real time. Denial permanently aborts the execution branch and writes to the audit log.
- 💬 **Ask the Workflow** — Natural language Q&A over any generated workflow, powered by Gemini RAG.
- 📊 **Executive Intelligence** — Full operational reporting with charts, metric forecasting, and high-fidelity PDF exports.
- 🖥️ **Digital Twin Operations Console** — Live system state mirrors (Google Workspace, Slack, HRIS, Workday) update in real-time as the simulation executes.

---

## Architecture

```
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│  Input Layer    │ ────> │  AI Context Layer  │ ────> │  Orchestration Engine  │
│ (SOPs, Images,  │       │ (Gemini 3.1 Pro)   │       │ (DAG Graph Generation) │
│  PDFs, Text)    │       │ Structure Inference│       └─────┬──────────────────┘
└─────────────────┘       └────────────────────┘             │
                                                             v
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│ Enterprise APIs │ <──── │   Policy Engine    │ <──── │  Execution Runtime     │
│ (SAP, Jira, HR) │       │  (Veea Edge Gov)   │       │ (Node-by-node traversal│
└─────────────────┘       └────────────────────┘       └────────────────────────┘
```

**4-Stage Pipeline:** Observe → Reason → Generate → Execute (Governed)

The LLM **proposes** the graph. The deterministic Orchestration Engine **traverses** it. The Veea Policy Engine **blocks** it when needed. Humans **approve or deny** escalations. The AI never executes unsupervised.

---

## Track Alignment

**Primary:** Track 2 (AI Agents) · **Secondary:** Track 1 (Security & Governance) · **Bonus:** Tracks 3 & 4

| Track | Focus Area | How ContextOS Addresses It |
|---|---|---|
| **Track 2** — AI Agents (Gemini) | Multi-agent systems using Gemini | 4 specialized agents (Analyst, Security, Systems, Planner) orchestrated via Gemini 3.1 Pro |
| **Track 2** | Long-context document processing | Multimodal SOP ingestion: PDF (pdfjs), images (Gemini Vision), text — all processed with Gemini |
| **Track 2** | Enterprise integrations (CRM, ERP, APIs) | Workflow nodes map to real enterprise systems: Google Workspace, Slack, Jira, Workday, SAP |
| **Track 2** | Internal AI tools (knowledge bases, ops automation) | "Ask the Workflow" RAG — natural language querying over extracted workflow knowledge |
| **Track 1** — Security & Governance (Veea) | Guardrails and safety layers for agentic workflows | Deterministic policy engine intercepts every high-risk node before execution |
| **Track 1** | Monitoring and observability for AI agents | Live security event feed with PASS / REVIEW / BLOCK classifications |
| **Track 1** | Audit trails for regulated industries | One-click export of the full audit log as structured JSON, plus Executive PDF reports |
| **Track 1** | Human-in-the-loop for access control | Escalation modal with multi-agent governance discussion — requires human approval to proceed |
| **Track 3** — Robotics & Simulation | Simulation environments for training/testing | Full enterprise workflow simulation — dry-run mode executes every node without real API calls |
| **Track 3** | Digital twins for industrial environments | Live System State mirrors (Google Workspace, Slack, HRIS, Workday) — real-time digital twin dashboard |
| **Track 3** | Vision-language models for real-world tasks | Gemini Vision processes image SOPs and workflow diagrams (VLM mode) |
| **Track 4** — Data & Intelligence | RAG over multi-source enterprise data | "Ask the Workflow" chat uses the generated workflow JSON as RAG context |
| **Track 4** | Knowledge graph extraction from documents | Every executed workflow is a structured knowledge graph (nodes, edges, risk, departments, systems) |
| **Track 4** | Analytics agents for natural language querying | Ask any question about the workflow — Gemini streams the answer |
| **Track 4** | Anomaly detection | Policy engine detects behavioral anomalies (e.g. unauthorized data export attempts) and triggers automatic containment |

---

## Key Demo Moments

1. **Upload** an employee offboarding SOP (or click **"Try Live Demo"** to skip the wait)
2. **Watch** 4 AI agents plan the workflow in parallel on the Analysis page
3. **Inspect** the generated DAG — click any node to see Gemini's reasoning, risk score, and evidence sources
4. **Execute** — watch the graph light up node by node in the Digital Twin Operations Console
5. **Trigger the escalation** — the `SEC-447 Data Exfiltration Guard` fires on the Finance node. Three agents debate in the governance panel.
6. **Deny or approve** — denial permanently aborts the downstream branch and writes to the audit log
7. **Ask the Workflow** — type *"What are the highest risk steps?"* and Gemini answers in real-time
8. **Export** the audit log from the Security page (JSON) or generate the **Executive Intelligence Report** (PDF) from the Report page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS |
| AI Engine | Google Gemini 3.1 Pro / Flash (`@google/genai`) |
| Graph Visualization | React Flow (`@xyflow/react`) |
| Document Parsing | pdfjs-dist (PDF), Gemini Vision (images) |
| Reporting | jsPDF, html-to-image (High-fidelity PDF Export) |
| Governance Layer | Veea Edge Zero-Trust Architecture · Deterministic Policy Engine |
| Animation | Framer Motion (`motion/react`) |
| Backend | Express.js (Node.js), serves static dist |

---

## Run Locally

**Prerequisites:** Node.js v20+

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here

# 3. Start the dev server
npm run dev
# App runs at http://localhost:3000
```

**To run the full demo without uploading a file:** Click **"Try Live Demo"** on the Upload page. This loads a pre-built Employee Offboarding workflow and skips Gemini generation entirely — guaranteed to trigger the escalation modal and showcase every feature.

**To generate the hackathon pitch deck PDF:**
```bash
npx tsx scripts/generate-pitch.ts
# Outputs: ContextOS-Pitch-Deck.pdf (10 pages)
```

---

## Security & Governance Model

ContextOS enforces strict **separation of cognition and execution**:

- **Observe Phase:** Files are pre-processed on the client edge. PII (SSNs, emails, phone numbers) is redacted before LLM transmission.
- **Generate Phase:** Gemini proposes an execution graph — a static JSON structure. No actions occur.
- **Execute Phase:** The Orchestration Engine (not the LLM) traverses the nodes. The LLM has zero direct execution access.
- **Policy Engine:** Deterministic checks fire on every `riskLevel: high` node. Execution is quarantined pending human review.
- **Audit Trail:** Every governance decision (PASS / BLOCK / REVIEW) is logged with timestamp, policy context, and risk score. Exportable as JSON.

---

<div align="center">
<sub>Built for the TechEx Intelligent Enterprise Solutions Hackathon · Powered by Google Gemini & Veea Edge</sub>
</div>
