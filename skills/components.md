# Component System Rules

Defines reusable UI components in MedLens.

All components must:
- be consistent
- support defined states
- prioritize clarity and readability
- align with single-screen, inline rendering architecture

---

## 1. Core Principles

### 1.1 Reusability
Components must be reusable across flows.

---

### 1.2 Consistency
Same component = same behavior everywhere.

---

### 1.3 Clarity First
Components must not introduce confusion.

---

### 1.4 System Alignment
Components must:
- follow `states.md`
- follow `layout.md`
- follow `spacing.md`

---

## 2. Core Components

---

### 2.1 Input Bar (Primary Entry)

Used for:
- medication search

Structure:
- text input
- submit button
- optional voice icon

Rules:
- always visible (persistent bottom)
- must not be blocked
- supports typing and autocomplete
- submitting triggers API flow

---

### 2.2 Summary Card (CORE SYSTEM COMPONENT)

This is the most important component in MedLens.

It is the primary output of the system:
OpenFDA → DeepSeek → Summary Card

---

#### Required Elements

Header:
- drug name
- optional drug type
- source badge (OpenFDA)

Sections (strict order):
1. What it does
2. How to take it
3. Warnings
4. Side effects

---

#### Controls

- ELI12 toggle (re-renders simplified content)
- Save (auth required)
- Export (auth required)

---

#### Rules

- must render inline on Home (not a separate screen)
- must prioritize scanability (users skim, not read deeply)
- must not hide warnings
- must display key information above the fold
- must handle partial data safely (hide missing sections)

---

#### Behavior

- updates dynamically based on user query
- replaces content inside the same screen
- must not trigger navigation

---

#### Disclaimer (Mandatory)

“MedLens simplifies medical information. It does not replace professional medical advice.”

---

### 2.3 List Item

Used for:
- search suggestions (autocomplete)
- cabinet items

Structure:
- title (drug name)
- optional short description

Rules:
- clear tap area
- consistent spacing
- must be easy to scan quickly

---

### 2.4 Button

Types:
- primary (main actions)
- secondary (supporting actions)

States:
- default
- pressed
- disabled
- loading

Rules:
- must clearly indicate interactivity
- must not be ambiguous

---

### 2.5 Modal (Auth Prompt)

Used for:
- login/signup triggers

Triggered when user attempts:
- Save
- Export
- Access Cabinet
- Check interactions

Rules:
- appears as overlay (not full screen navigation)
- must be dismissible
- must return user to original context after completion

---

## 3. Component Rules

- no unnecessary variations
- no duplicate component types
- must support defined states
- must integrate with API flow where applicable

---

## 4. Summary

Components in MedLens must:

- support fast understanding  
- remain consistent across flows  
- prioritize clarity and safety  

The Summary Card is the core of the system and must be treated as the primary UI output.