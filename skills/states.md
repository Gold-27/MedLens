# Interaction States Rules

Defines how UI states behave across MedLens.

States are critical because:
- users are often anxious
- users need immediate clarity
- delays or ambiguity reduce trust

---

## 1. Core Principles

### 1.1 Instant Feedback
Every interaction must respond immediately (<100ms).

---

### 1.2 Clarity Over Style
States must clearly communicate:
- what is happening
- what the user should do next

---

### 1.3 No Ambiguity
Users must never wonder:
- “Is this loading?”
- “Did this fail?”

---

## 2. Core States (MedLens)

---

### 2.1 Idle (Empty)

- no query yet
- waiting for user input

UI:
- empty state guidance

---

### 2.2 Loading

Triggered when:
- user submits search
- medication is selected

UI:
- skeleton summary card OR spinner (inline)

Rules:
- must appear instantly
- must preserve layout structure

---

### 2.3 Success (Result Displayed)

Triggered when:
- valid data returned from OpenFDA + DeepSeek

UI:
- summary card rendered inline

Rules:
- content must be structured
- must be easy to scan quickly

---

### 2.4 Not Found (Valid State)

Triggered when:
- no medication found

UI:
- empty state with guidance

Rules:
- NOT treated as error
- must guide retry

---

### 2.5 Error

Triggered when:
- network fails
- API fails
- timeout

UI:
- clear message + retry action

Rules:
- must not expose technical details

---

### 2.6 Disabled

Used when:
- action not allowed (e.g., guest export)

Rules:
- must not respond to tap
- must not appear interactive

---

### 2.7 Active

Used for:
- selected medication
- toggles (ELI12)

Rules:
- must be clearly distinguishable

---

## 3. Component State Requirements

---

### Input Bar
- idle
- typing
- loading

---

### Summary Card
- loading (skeleton)
- success
- partial (if some data missing)

---

### Buttons
- default
- pressed
- disabled
- loading (if needed)

---

## 4. Timing Rules

- loading must start instantly
- transitions must be smooth
- no flicker between states

---

## 5. Summary

States must:
- be immediate
- be clear
- reduce uncertainty

Every state should:
- communicate status
- guide next action