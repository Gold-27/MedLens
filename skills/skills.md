# MedLens Skills Specification 

---

## 0. Purpose

This document defines UI behavior, naming conventions, interaction rules, validation logic, and safety constraints for MedLens.

All generated UI and logic MUST:
- align with agent.md
- prioritize clarity, safety, and speed
- support a ChatGPT-style interaction model
- gracefully handle real-world edge cases

---

# 1. Naming Conventions (REQUIRED)

---

## Components
- PascalCase

Examples:
- HomeScreen  
- SummaryCard  
- InputBar  
- CabinetButton  
- InteractionResultCard  

---

## Variables / Props / Functions
- camelCase  
- Verb-first for functions  

Examples:
- fetchDrugData  
- generateSummary  
- checkInteractions  

---

## IDs / Database Fields
- snake_case  

Examples:
- drug_name  
- user_id  

---

# 2. UI Architecture Rules

---

## Core Interaction Model

MedLens uses a **chat-style, single-flow interaction model**:

- Primary interaction occurs on Home screen  
- Results render inline (like chat messages)  
- No full page reloads  

---

## Navigation Flexibility (IMPORTANT)

- Inline rendering is DEFAULT  
- System MAY:
  - expand content
  - open secondary screens (Cabinet, Interaction, Settings)

DO NOT hard-restrict navigation where it improves usability.

---

# 3. Layout System

---

## Top Navigation
- Cabinet button  
- Profile avatar  

---

## Dynamic Content Area

MUST support the following states:

---

### Empty State
- Header text  
- Suggested searches  

---

### Loading State
- Skeleton loader (preferred)  
- OR spinner  

---

### Result State
- SummaryCard rendered inline  

---

### Error State (MANDATORY)
- Clear error message  
- Retry button  

---

## Bottom Input Bar

- Fixed by default  
- Must NOT block important content  

System MUST:
- adjust position on scroll  
- avoid overlapping long results  

---

### Input Bar Contains:
- Text input  
- Send button  
- OPTIONAL:
  - ELI12 toggle  

---

### Microphone Icon Rule

- DO NOT include unless functional  
- If included:
  - must be clearly labeled “Coming soon”

---

# 4. Input & Validation Rules

---

## Input Handling

System MUST:
- trim whitespace  
- normalize text  
- prevent empty submission  

---

### Empty Input Behavior
- Disable send button  
OR  
- Show hint: “Enter a medication name”

---

## Long Input Handling
- Support long drug names  
- Prevent UI overflow  
- Apply truncation where needed  

---

## Duplicate Input
- Allow repeated searches  
- Optimize by caching previous results  

---

# 5. UI Styling Rules

---

## Design Tokens (PREFERRED)

- Use tokens from `design-tokens.css`  

Example:
```css
color: var(--color-primary);
``` id="tok1"

---

## Flexibility Rule

- Tokens are REQUIRED where available  
- Fallback styling is ALLOWED if token not defined  

---

## Readability Rules

- Avoid long paragraphs  
- Use spacing between sections  
- Ensure strong visual hierarchy  

---

# 6. Accessibility (MANDATORY)

---

System MUST support:

- Dynamic font scaling  
- High contrast readability  
- Screen reader labels for all buttons  

---

## Touch Targets
- Minimum 44px height  

---

## Text Rules
- Clear language  
- Avoid jargon (except source data)  

---

# 7. Summary Card UI Rules (CRITICAL)

---

## Structure MUST match agent.md:

1. What it does  
2. How to take it  
3. Warnings  
4. Side effects  

---

## Missing Data Handling

Display:
"We do not have enough reliable information for this section."

---

## Safety UI Enforcement

- Disclaimer MUST always be visible  
- Warnings MUST be visually emphasized  

---

## Action Buttons

- Save  
- Export  

---

## Guest Behavior

- Trigger auth modal when restricted action is tapped  

---

# 8. Interaction UI Rules

---

## Allowed Outputs ONLY:

- “There may be a potential interaction. Please consult a healthcare professional.”  
- “We cannot confirm interactions between these medications. Please consult a healthcare professional.”  

---

## Forbidden UI Language:
- “Safe”  
- “No interaction”  

---

# 9. Error Handling UI

---

## API Failure
Display:
“Something went wrong. Please try again.”

---

## No Data Found
Display:
“We could not find reliable information for this medication.”

---

## Offline Mode

- Show offline indicator  
- Allow viewing cached results  

---

## Retry Behavior
- Provide retry button for all failures  

---

# 10. Performance & UX Rules

---

System MUST:

- show loading feedback immediately  
- avoid long blocking states  
- cache frequent searches  
- keep interactions under 3 seconds  

---

## Animation Rules
- Smooth transitions only  
- Avoid heavy animations  

---

# 11. State Management Guidelines

---

System MUST:

- maintain predictable state flow  
- separate:
  - input state  
  - loading state  
  - result state  
  - error state  

---

## Re-render Rules
- Only update necessary components  
- Avoid full screen re-renders  

---

# 12. Safety & Trust UI Rules

---

System MUST:

- always display disclaimer  
- never present AI output as absolute truth  
- show uncertainty when data is missing  

---

## Tone
- calm  
- clear  
- non-alarmist  

---

# 13. Logging Hooks (UI-Level)

---

System SHOULD support:

- tracking failed searches  
- tracking retry attempts  
- tracking user interaction with errors  

---

# 14. Non-Negotiable Constraints

---

The UI MUST:

- never mislead users  
- never hide uncertainty  
- never imply medical authority  
- always prioritize clarity  

---

## Final Instruction

Design MedLens UI as:

- a clean, chat-style interface  
- optimized for readability  
- resilient to errors and edge cases  

---

### Success Condition

User can:
- search a medication  
- read and understand results  
- without confusion, delay, or risk