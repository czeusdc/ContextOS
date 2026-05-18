# ContextOS
Convert undocumented enterprise SOPs into governed, Gemini-powered AI pipelines.
## What it does
- **Multimodal SOP Ingestion** — Upload PDF, image, or text SOPs. PII is redacted before any cloud transmission.
- **Gemini Workflow Inference** — Gemini 2.5 Pro extracts a causal DAG (nodes, edges, departments, risk scores) from your document.
- **Multi-Agent Planning** — 4 specialized agents (Analyst, Security, Systems, Planner) coordinate to validate the workflow.
- **Zero-Trust Governance** — A deterministic Veea Edge policy engine intercepts high-risk nodes before execution. The AI cannot bypass it.
- **Human-in-the-Loop** — Security ops approve or deny escalations in real time. Denials are logged to the audit trail.
## How to use
1. **Upload page** — Drag in an SOP document, or click **"Try Live Demo"** (no upload required) to instantly load a pre-built Employee Offboarding workflow.
2. **Analysis page** — Watch 4 AI agents plan the workflow. A Data Intelligence Report appears on completion.
3. **Workflow Graph** — Inspect the generated DAG. Click any node to see AI reasoning and evidence sources. Use **"Ask the Workflow"** (bottom-right) to query the workflow in natural language with Gemini.
4. **Execution Console** — Run the Digital Twin Simulation. Watch live system state mirrors (Google Workspace, Slack, HRIS) update in real time.
5. **Security Dashboard** — Review the real-time anomaly detection feed. Export the full audit log as JSON.
## Key features
- **Ask the Workflow** — Gemini RAG chat: ask *"What are the highest risk steps?"* and get an instant answer
- **Export Audit Log** — Download a structured JSON audit trail of every governance decision
- **Digital Twin Mirror** — Live system state panel mirrors real enterprise systems during execution
- **VLM Mode** — Upload an image SOP and Gemini Vision processes it automatically
## Tech stack
Gemini 2.5 Pro · React 19 · Vite · TypeScript · React Flow · Veea Edge · Framer Motion
