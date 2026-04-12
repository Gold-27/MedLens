# MedLens — Agent Specification (Production-Grade)

---

## 0. Purpose

This document defines the exact system behavior for MedLens.

The system MUST:
- behave deterministically where possible
- never hallucinate medical information
- gracefully handle missing or unreliable data
- prioritize user safety over completeness
- follow a ChatGPT-style interaction model

---

## 1. Project Overview

MedLens is a mobile application (iOS and Android) that translates complex medication information into clear, plain, everyday language.

It solves the problem of low health literacy by helping users understand prescriptions, dosage instructions, warnings, and side effects without medical jargon.

The experience is designed to emulate a ChatGPT-style interface:
- Single primary input
- Conversation-like result flow
- Smooth, no-reload interactions
- Minimal UI distractions

### Core Capabilities
- Search for a medication
- Receive instant plain-language explanation
- Save medications
- Check interactions
- Share summaries

### Target Users
- Adults managing prescriptions  
- Caregivers  
- Users with low literacy  
- Non-native English speakers  

### Product Type
Health literacy tool (NOT a diagnostic or medical decision system)

---

## 2. Tech Stack

### Mobile Frontend
- React Native (Expo)
- react-native-splash-screen
- react-native-view-shot
- React Native Share API

### Backend
- Node.js
- Express.js

### AI Engine
- DeepSeek API (chat/completions)

### Drug Data
- OpenFDA API

### Database & Auth
- Supabase (PostgreSQL + Auth)

---

## 3. App Architecture (STRICT)

### Platform
- Mobile App (React Native)
- ChatGPT-style single-flow interface (SPA-like experience)

### Navigation Model
- Primary interaction occurs on Home screen
- Results render inline (chat-style)
- Secondary screens allowed for:
  - Cabinet
  - Interaction
  - Settings

---

## 4. Entry Flow

### Step 1 — Splash
- Display for 1–2 seconds

### Step 2 — Routing

IF first-time user:
→ Onboarding  

ELSE:
→ Home  

### Step 3 — Post-Onboarding
→ Enter Guest Mode  
→ Navigate to Home  

---

## 5. Guest Mode System

### Default
All users start as Guest

### Guest CAN
- Search medication  
- View summary  
- Toggle ELI12  

### Guest CANNOT
- Save  
- Access Cabinet  
- Run interaction check  
- Export  

### Auth Trigger
ONLY trigger when user attempts restricted action

### Auth UX
- Modal overlay (no navigation reset)
- Return user to previous action after success

---

## 6. Home Screen (Core Engine)

### Layout

#### Top
- Minimal header
- Cabinet button
- Profile icon

---

#### Center (Dynamic)

State A — Empty  
- Prompt text  
- Suggested searches  

State B — Loading  
- Skeleton card  

State C — Result  
- Summary Card (chat-style)

---

#### Bottom (Persistent Input)
- Input field  
- Send button  
- Optional ELI12 toggle  

---

## 7. Search & Processing Flow (SAFE PIPELINE)

### Step 1 — Input
User enters medication name

---

### Step 2 — Drug Resolution Layer (CRITICAL)

System MUST:
- Normalize input
- Attempt exact match via OpenFDA

IF no match:
→ attempt fuzzy match  
→ attempt generic mapping  

IF still no match:
→ return fallback message

---

### Step 3 — OpenFDA Fetch

Fetch:
- indications
- dosage
- warnings
- side effects

---

### Step 4 — Data Validation

IF required fields missing:
→ DO NOT call AI  
→ render partial safe response  

---

### Step 5 — AI Processing

- Only validated data sent  
- Strict schema enforced  

---

### Step 6 — Output Validation

IF invalid AI response:
→ reject  
→ fallback to safe structured output  

---

### Step 7 — Render

Render Summary Card inline

---

## 8. Summary Card (STRICT)

### Sections
1. What it does  
2. How to take it  
3. Warnings  
4. Side effects  

---

### Missing Data
Display:
"We do not have enough reliable information for this section."

---

### Disclaimer
MedLens simplifies medical information for understanding.  
It does not replace professional medical advice.

---

## 9. ELI12 Mode

- Prefer single AI call  
- Must retain safety info  
- Simpler language only  

---

## 10. Cabinet (AUTH ONLY)

- Stores validated summaries  
- Re-renders on Home  
- No forced re-fetch  

---

## 11. Interaction Checker (SAFE)

ONLY allowed outputs:

- Potential interaction → consult professional  
- No data → cannot confirm  

FORBIDDEN:
- Saying "safe"  

---

## 12. Error Handling

- No data  
- API failure  
- Timeout  
- Offline support  

---

## 13. AI Rules

- No hallucination  
- No medical advice  
- No guessing  

---

## 14. Performance & Reliability

- Cache results  
- Retry failures  
- Handle slow networks  

---

## 15. Logging & Monitoring

- Track failures  
- Track missing drugs  
- Track AI errors  

---

## 16. Non-Negotiable Constraints

- Never hallucinate  
- Never act as doctor  
- Always show uncertainty  
- Always show disclaimer  

---

## Final Instruction

Build MedLens as:
- a fast, safe, chat-style system  
- focused on clarity and trust  

### Success Condition
User understands a medication in under 30 seconds without risk.