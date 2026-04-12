# MedLens Navigation Specification (Production-Grade)

---

## 0. Purpose

This document defines navigation structure and behavior across the MedLens mobile application.

It ensures:

- predictable user flow  
- preservation of user context  
- safe handling of restricted actions  
- scalability as the product grows  

---

## 1. Core Principles

---

### 1.1 ChatGPT-Style Core Experience

- Home screen is the primary interaction surface  
- search → result happens inline  
- no navigation for results  

---

### 1.2 Minimal but Complete Navigation

- avoid unnecessary screen transitions  
- provide dedicated screens where complexity requires it  

---

### 1.3 Context Preservation (CRITICAL)

Users must NEVER lose:

- search input  
- results  
- scroll position  

---

### 1.4 Predictability

Users must always understand:

- where they are  
- how to go back  
- what will happen next  

---

## 2. Navigation Structure

---

### 2.1 Core Screens

---

### 1. Home (Primary Screen)

Handles:

- search input  
- autocomplete  
- inline results (Summary Card)  

---

### 2. Cabinet (Auth Only)

Handles:

- saved medications  
- entry to interaction checker  

---

### 3. Interaction Screen (Auth Only)

Handles:

- medication selection  
- interaction results  

---

### 4. Settings

Handles:

- user preferences  
- account options  

---

### 5. Auth (Modal System)

Handles:

- login / signup  

---

## 3. Entry & Routing Logic

---

### 3.1 App Launch

---

IF first-time user:
→ Onboarding  

ELSE:
→ Home  

---

### 3.2 Returning Users

- restore previous session if available  
- maintain Home state  

---

### 3.3 Deep Linking (CRITICAL)

App must support:

- opening directly to a medication result  
- opening specific screens (e.g. Cabinet)  

Rules:

- validate incoming data  
- fallback to Home if invalid  

---

## 4. Navigation Behavior

---

### 4.1 Forward Navigation

- user taps → new screen opens  

Rules:

- must feel fast  
- must not block UI  

---

### 4.2 Back Navigation (CRITICAL)

---

Back action MUST:

- return to previous screen  
- restore previous state  

---

### Home Preservation Rules

When returning to Home:

- keep search input  
- keep last result  
- keep scroll position  

---

### Stack Behavior

Navigation stack must behave like:

- last-in → first-out  

Example:

Home → Cabinet → Interaction  
Back → Cabinet  
Back → Home  

---

## 5. Modal Navigation (Auth System)

---

### 5.1 Usage

Auth is triggered ONLY when user attempts:

- Save  
- Export  
- Access Cabinet  
- Check interactions  

---

### 5.2 Behavior

- displayed as overlay modal  
- does NOT navigate away from current screen  

---

### 5.3 Completion Rules

IF auth successful:

→ return user to original action  

---

IF dismissed:

→ return to previous state  
→ no data loss  

---

### 5.4 Blocking Rules

- auth must block restricted actions  
- cannot bypass protected features  

---

## 6. Guest vs Auth Navigation

---

### Guest User

CAN:

- search  
- view results  

CANNOT:

- access Cabinet  
- save medications  
- check interactions  
- export  

---

### Authenticated User

- full navigation access  

---

### Route Guard Rules

- restricted screens require authentication  
- trigger auth modal if accessed by guest  

---

## 7. Error & Recovery Navigation

---

### 7.1 API Failure

- stay on current screen  
- show error state  
- provide retry  

---

### 7.2 Screen Failure

- show fallback UI  
- allow user to retry or go back  

---

### 7.3 Timeout Handling

- if request exceeds limit  
→ show retry option  

---

### 7.4 No Dead-End Rule

User must ALWAYS have:

- retry option  
- back navigation  
- guidance  

---

## 8. State Persistence Across Screens

---

### MUST Preserve:

- Home search input  
- Home results  
- scroll position  
- selected medications (interaction flow)  

---

### Implementation Note

Use:

- global state management OR  
- persistent storage  

---

## 9. Transition Rules

---

### 9.1 Animation

- smooth and minimal  
- no heavy transitions  

---

### 9.2 Speed

- transitions must feel instant  
- no blocking delays  

---

### 9.3 Consistency

- same transition pattern across all screens  

---

## 10. Offline Navigation

---

### Behavior

- prevent navigation requiring API  
- allow access to cached content  

---

### Messaging

- clearly inform user of offline state  

---

### Recovery

- allow retry when connection returns  

---


### Purpose

- improve UX  
- identify friction  

---

## 12. Final Rules

---

Navigation MUST:

- preserve user context at all times  
- never lose user progress  
- never trap the user in a flow  
- always provide a clear exit or next step  
- remain simple but scalable  

---

## Final Navigation Summary

MedLens navigation is:

- minimal → avoids unnecessary complexity  
- predictable → easy to understand  
- resilient → handles errors and edge cases  
- scalable → supports future features  

---

### Success Condition

User can:

- move through the app  
- complete actions  
- recover from errors  

without confusion or losing progress.