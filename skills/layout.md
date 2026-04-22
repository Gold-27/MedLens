# MedQuire Layout Specification (Production-Grade)

---

## 0. Purpose

This document defines layout structure and behavior across the MedQuire mobile application.

The layout is designed to:

- emulate a ChatGPT-style interface  
- support fast understanding of medical information  
- handle real-world edge cases safely  
- remain responsive across devices  

---

## 1. Core Principles

---

### 1.1 ChatGPT-Style Single-Screen Experience

MedQuire uses a **primary single-screen model (Home)**:

- input → response happens inline  
- no navigation for results  
- smooth, conversational flow  

---

### 1.2 Controlled Expansion (Scalability)

While Home is primary:

- Cabinet  
- Interaction  
- Settings  

exist as separate screens to avoid clutter.

---

### 1.3 Speed to Understanding

Layout must help users:

- find meaning quickly  
- scan, not read heavily  

---

### 1.4 Stability with Flexibility

Layout MUST:

- minimize visual shifts  
- adapt safely to different data lengths  
- handle missing or partial content  

---

### 1.5 Accessibility First

Layout must support:

- large text scaling  
- screen readers  
- touch accessibility  

---

## 2. Responsive & Safe Area Rules

---

### 2.1 Safe Area Handling

Layout MUST respect:

- device notches  
- status bars  
- navigation gestures  

---

### 2.2 Screen Adaptability

Layout must work across:

- small phones  
- large phones  

Rules:

- no content clipping  
- no overlapping elements  

---

### 2.3 Keyboard Awareness

When keyboard is active:

- input bar remains visible  
- content shifts appropriately  
- no overlap with results  

---

## 3. Core Screen Structure (Home)

---

### 3.1 Top Area

Contains:

- Cabinet button  
- Profile icon  

Rules:

- minimal visual weight  
- must not compete with main content  

---

### 3.2 Dynamic Content Area (Core Engine)

This is the main interaction area.

---

#### Supported States (ALL REQUIRED)

---

### 1. Empty State

- no search yet  
- show guidance text  

Example:
“Search for a medication to get started”

---

### 2. Loading State

- skeleton layout (preferred)  
- OR spinner fallback  

Rules:

- must appear within 100ms  
- must mimic final layout structure  

---

### 3. Success State

- full Summary Card rendered  

---

### 4. Partial Success State

- some sections missing  
- render only available sections  

---

### 5. Not Found State

- valid state (not an error)  

Example:
“We couldn’t find this medication. Try another name.”

---

### 6. Error State

- network or API failure  

Example:
“Something went wrong. Please try again.”

Must include:
- retry action  

---

### 3.3 Bottom Input Bar (Persistent Core)

---

### Structure

- text input  
- send button  
- voice input (speech-to-text enabled)  
- optional ELI12 toggle  

---

### Rules

- always visible  
- anchored to bottom  
- adapts with keyboard  
- must not overlap content  

---

### Interaction Priority

- primary entry point of the app  

---

## 4. Summary Card Layout (Critical Component)

---

### 4.1 Structure (STRICT ORDER)

1. Drug Name  
2. What it does  
3. How to take it  
4. Warnings  
5. Side effects  

---

### 4.2 Section Rules

Each section:

- only renders if data exists  
- must not show empty placeholders  

---

### 4.3 Priority Rules

- drug name must be immediately visible  
- warnings must appear early in the scroll  
- critical info must never be hidden  

---

### 4.4 Content Behavior

- short paragraphs only  
- clear spacing between sections  
- optimized for scanning  

---

### 4.5 ELI12 Toggle

- positioned near top of card  
- toggles simplified content  
- must not reload entire layout  

---

### 4.6 Disclaimer (MANDATORY)

Must be:

- always visible within the card  
- never hidden behind interaction  

Text:

MedQuire simplifies medical information.  
It does not replace professional medical advice.

---

## 5. Layout Behavior Rules

---

### 5.1 Inline Rendering

- results update inside Home  
- no navigation for results  

---

### 5.2 Controlled Layout Shift

- use skeletons to preserve structure  
- avoid sudden jumps  
- allow natural expansion for longer content  

---

### 5.3 Dynamic Content Handling

Layout must support:

- very short content  
- very long content  
- missing sections  

---

## 6. Scrolling System

---

### 6.1 Primary Scroll

- vertical scrolling only  

---

### 6.2 Nested Scroll (Restricted)

- avoid nested scroll where possible  
- allow ONLY when necessary for long content  

---

### 6.3 Content Priority

Top of scroll should include:

- drug name  
- key explanation  
- warnings (if present)  

---

## 7. Action Placement & Hierarchy

---

### 7.1 Primary Action

- Search (input bar)  

---

### 7.2 Secondary Actions

- Save  
- Export  
- Interaction check  

---

### 7.3 Rules

- primary action must dominate  
- secondary actions must not compete  

---

## 8. Touch & Interaction Rules

---

### 8.1 Touch Targets

- minimum size: 44px  

---

### 8.2 Feedback

- all actions must provide visual feedback  

---

### 8.3 Disabled States

- clearly indicate unavailable actions  

---

## 9. Spacing System

---

### Rules

- use ONLY tokens from `design-tokens.css`  
- maintain consistent spacing  
- avoid dense layouts  

---

## 10. Performance Considerations

---

### 10.1 Lightweight Rendering

- avoid heavy UI components  
- optimize for fast updates  

---

### 10.2 Smooth Transitions

- no blocking UI updates  
- animations must be subtle  

---

## 11. Accessibility Rules

---

### 11.1 Text Scaling

- layout must support large text sizes  

---

### 11.2 Screen Readers

- logical reading order  
- clear section labels  

---

### 11.3 Contrast & Visibility

- text must remain readable  
- interactive elements must be visible  

---

### 11.4 No Color-Only Meaning

- combine color with text or icons  

---

## 12. Edge Case Handling (CRITICAL)

---

Layout MUST handle:

- missing data sections  
- extremely long drug names  
- slow network conditions  
- repeated searches  
- empty results  

---

## 13. Final Rules

---

Layout MUST:

- remain stable across states  
- adapt to real-world data  
- prioritize clarity over design aesthetics  
- support fast understanding  

---

## Final Layout Summary

MedQuire layout is:

- conversational → ChatGPT-style interaction  
- resilient → handles all states  
- responsive → works across devices  
- accessible → usable by all users  

---

### Success Condition

User can:

- search a medication  
- view results clearly  
- understand it  

within 30 seconds without confusion.
