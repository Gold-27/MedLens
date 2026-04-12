# MedLens System Architecture (Production-Grade, Schema-First)

---

## 0. Purpose

This document defines the architecture of MedLens.

It ensures:
- reliable data flow  
- safe handling of medical information  
- resilience to real-world failures  
- fast and trustworthy user experience  

---

## 1. Core Principles

---

### 1.1 Schema-First Architecture (CRITICAL)

All system design MUST start from structured data contracts.

- API responses must follow predefined schemas  
- Frontend must rely only on validated schema  
- AI output must conform to strict structure  

---

### 1.2 Controlled Data Flow

MedLens follows a structured pipeline:

User Input  
→ Backend Validation  
→ OpenFDA (data source)  
→ Data Normalization  
→ DeepSeek (AI transformation)  
→ Response Validation  
→ UI Rendering  

---

### 1.3 No Data Fabrication

The system MUST NEVER:
- generate medical facts  
- infer missing data  
- override source data  

AI is strictly used for:
→ rewriting and simplifying verified data  

---

### 1.4 Trust Over Completeness

If data is missing:
- explicitly state uncertainty  
- never guess  

---

### 1.5 Resilience Over Perfection

System MUST handle:
- API failures  
- slow responses  
- partial data  
- offline scenarios  

---

## 2. Technology Stack

---

### Frontend
- React Native (Expo)
- SPA-style interaction model

---

### Backend
- Node.js
- Express.js

---

### Database
- PostgreSQL (via Supabase)

---

### ORM / Data Access
- Supabase client

---

### Authentication
- Supabase Auth (secure server-side handling)
- Session-based authentication
- Persistent login state

---

### External APIs
- OpenFDA API
- DeepSeek API

---

## 3. Architecture Layers

---

### 3.1 Mobile Frontend

Responsibilities:
- user input (text + optional voice)
- UI rendering (chat-style)
- state handling:
  - loading  
  - success  
  - partial  
  - error  

Characteristics:
- single-screen interaction
- inline rendering
- persistent input bar  

---

### 3.2 Backend API Layer

Responsibilities:
- orchestrate requests  
- validate all external data  
- normalize OpenFDA responses  
- enforce schema compliance  
- handle retries and failures  

---

### 3.3 Data Normalization Layer

Purpose:
- clean and standardize OpenFDA data  

---

### 3.4 AI Transformation Layer

Responsibilities:
- generate structured summaries  
- generate ELI12 output  

Rules:
- must only rewrite  
- must follow schema  

---

### 3.5 Database & Auth Layer

Stores:
- user accounts  
- saved drug names  

Does NOT store:
- sensitive health data  

---

## 4. Core Data Flows

---

### 4.1 Autocomplete Flow

1. User types input  
2. Debounce input (300–500ms)  
3. Backend queries OpenFDA  
4. Return suggestions  

---

### 4.2 Medication Search Flow

1. User submits query  
2. Backend validates input  
3. Query OpenFDA  
4. Normalize data  
5. Send to DeepSeek  
6. Validate response  
7. Return structured data  
8. Render inline  

---

### 4.3 Fallback Flow

If AI fails:
- return structured raw data  
- allow retry  

---

### 4.4 ELI12 Flow

- separate prompt  
- must preserve meaning  

---

### 4.5 Interaction Flow

Outputs MUST be:

- “No known interaction found”  
- “Possible interaction detected”  
- “Insufficient data available”  

---

### 4.6 Auth Flow

- guest mode default  
- modal auth trigger  
- return to action  

---

## 5. Data Schema Contracts

---

### Rules

- keys MUST exist  
- values MAY be null  
- frontend MUST handle null safely  

---

## 6. Data Integrity Rules

---

### Validation Before Render

- drug name must exist  
- at least one section must exist  

---

### Partial Data

- render available sections only  
- hide missing sections  
- show fallback message  

---

### Not Found

- show helpful retry state  
- do not treat as system error  

---

### Source Transparency

Every response must show:

→ Source: OpenFDA  

---

## 7. State Management

---

System MUST handle:

- loading  
- success  
- partial success  
- not found  
- error  

---

### Rules

- no silent failures  
- always guide user  

---

## 8. Performance & Optimization

---

### 8.1 Perceived Speed

- instant loading feedback  
- non-blocking UI  

---

### 8.2 Request Control

- debounce input  
- cancel stale requests  
- prevent duplicates  

---

### 8.3 Caching (CRITICAL)

- cache previous searches  
- reuse results  
- reduce API dependency  

---

### 8.4 Timeout Handling

- max wait time: 5–8 seconds  
- fallback or retry after timeout  

---

## 9. Failure Handling

---

### API Failure

- show clear message  
- provide retry  

---

### Rate Limit Handling

- detect limit errors  
- apply backoff retry  

---

### Offline Mode

- detect early  
- disable requests  
- allow cached viewing  

---

### No Dead-End Rule

User must always have:

- retry  
- guidance  
- next step  

---

## 10. Security & Safety

---

### 10.1 API Key Protection

- store keys server-side  
- never expose to frontend  

---

### 10.2 Data Protection

- HTTPS only  
- no sensitive health data stored  

---

### 10.3 AI Guardrails

AI MUST:

- rewrite only  
- not advise  
- not infer  

---

### 10.4 Disclaimer

Always show:

MedLens simplifies medical information.  
It does not replace professional medical advice.  

---

## 11. Logging & Monitoring

---

System MUST track:

- API failures  
- slow responses  
- user errors  

---

## Purpose

- debugging  
- system improvement  

---

## 12. Scalability Considerations

---

- support increasing traffic  
- optimize API usage  
- maintain fast response times  

---

## 13. Final Rules

---

System MUST:

- never hallucinate  
- never guess medical data  
- always validate external input  
- always guide user clearly  

---

## Final Architecture Summary

MedLens is:

- schema-first → predictable  
- resilient → handles failures  
- safe → no misinformation  
- fast → optimized for understanding  

---

### Success Condition

User can:
- search  
- understand  
- trust  

within 30 seconds.