do the following task in the onboarding 2 
- add more text context to the headline that says Search.Read.Undertand now i want you to add this bwside the understand remove the dot "Undertsand with Clarity. 
this is for better  text visual balance with the onboarding 1# MedLens — Agent Specification 

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

## Compliance & Trust Principles (CRITICAL)

MedLens operates in a health-related domain and MUST follow strict compliance, safety, and trust guidelines.

---

### 1. Product Classification

MedLens is a:

- health literacy tool  
- informational assistant  

It is NOT:

- a diagnostic system  
- a treatment recommendation engine  
- a medical decision support system  

---

### 2. Medical Disclaimer (MANDATORY)

The system MUST always display:

"MedLens simplifies medical information for understanding. It does not replace professional medical advice."

Rules:

- must be visible in every result  
- must not be hidden  
- must not be removed under any condition  

---

### 3. No Medical Advice (CRITICAL)

The system MUST NEVER:

- recommend treatments  
- suggest medication changes  
- suggest dosage adjustments  
- tell users what they “should” do medically  

Allowed:

- explaining existing information  
- simplifying drug labels  

---

### 4. Source Transparency

All medical information MUST:

- originate from OpenFDA  
- be labeled clearly as source  

The system MUST NOT:

- present AI-generated data as original truth  

---

### 5. Uncertainty Handling

When data is missing or unclear, the system MUST:

- explicitly state uncertainty  
- avoid confident language  

Example:

"We do not have enough reliable information for this."

---

### 6. Interaction Safety Language

The system MUST NOT:

- declare drugs as “safe together”  

Allowed outputs:

- “We cannot confirm interactions”  
- “Consult a healthcare professional”  

---

### 7. Data Privacy Principles

The system MUST:

- store minimal user data  
- avoid storing sensitive health records  
- use secure authentication (Supabase)  

The system MUST NOT:

- store full medical history  
- track sensitive user behavior unnecessarily  

---

### 8. AI Compliance Guardrails

AI (DeepSeek) MUST:

- only transform OpenFDA data  
- never generate new medical facts  
- never provide advice  

All AI outputs MUST:

- be validated before rendering  

---

### 9. Platform Compliance

The app MUST comply with:

- App Store (Apple) guidelines  
- Google Play Store policies  

Including:

- health disclaimers  
- clear non-medical positioning  
- safe user messaging  

---

### 10. Trust-First Design

All system decisions MUST prioritize:

- user safety over completeness  
- clarity over complexity  
- transparency over confidence  

---

## Compliance rules summary

If there is ever a conflict between:

- completeness  
- speed  
- user safety  

→ ALWAYS choose user safety.


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