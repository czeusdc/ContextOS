# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContextOS is a multimodal enterprise reasoning engine — it observes workflows (screen recordings, SOPs, screenshots, tickets, emails), learns operational logic, and automates future executions. Built for a hackathon targeting the Gemini Award ($5000).

Planned stack: Next.js + TypeScript + Tailwind + shadcn/ui (frontend), FastAPI Python (backend), Gemini Pro/Flash (AI), Veea Lobster Trap (security), AMD GPU local preprocessing.

## Repository Structure (planned)

- `frontend/` — Next.js app (upload workspace, workflow graph with React Flow, execution console, security dashboard)
- `backend/` — FastAPI (Gemini orchestration, workflow processing, API endpoints)
- `mock-systems/` — mock enterprise systems for demo
- `demo-assets/` — sample SOPs, recordings, screenshots
- `docs/` — documentation

## Project Status

Currently in planning phase. The authoritative plan lives in `Plan.md`. No code has been written yet. Read `Plan.md` before making any implementation decisions — it contains the full architecture, demo scenario (employee offboarding), AI component design, and page-by-page frontend spec.

## Commands (when scaffolding begins)

- Frontend: `cd frontend && npm run dev` (Next.js dev server)
- Backend: `cd backend && uvicorn main:app --reload`
- No tests, linting, or build pipeline configured yet.

## Key Constraints

- Hackathon project — favor working demos over production polish
- Demo scenario is employee offboarding (HR → IT → Finance → Legal)
- Must integrate Gemini Pro (multimodal reasoning) and Gemini Flash (real-time execution)
- Veea Lobster Trap handles prompt inspection, policy enforcement, audit logging
- AMD GPU layer for local preprocessing (redaction, OCR, embeddings)