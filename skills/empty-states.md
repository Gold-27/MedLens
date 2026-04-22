# Empty States Rules

Defines how empty states behave in MedQuire.

Empty states are critical for:
- guidance
- trust
- reducing user confusion

---

## 1. Core Principles

### 1.1 Never Leave a Dead End
Every empty state must guide the next step.

---

### 1.2 Keep It Simple
Users are often:
- rushed
- overwhelmed

Messages must be short and clear.

---

### 1.3 Reduce Anxiety
Tone must:
- be calm
- not alarming

---

## 2. Empty State Types

---

### 2.1 Initial Empty (Home)

Occurs when:
- no search yet

Content:
- “Search for a medication to get started”

---

### 2.2 Not Found

Occurs when:
- medication not found in OpenFDA

Content:
- “We couldn’t find this medication”
- “Check the spelling or try another name”

---

### 2.3 Error

Occurs when:
- API fails

Content:
- “Unable to load information”
- [Retry]

---

### 2.4 Offline

Occurs when:
- no internet

Content:
- “No internet connection”
- [Retry]

---

### 2.5 Empty Cabinet

Occurs when:
- no saved medications

Content:
- “No saved medications yet”
- CTA → search

---

## 3. Structure

Each empty state must include:

- short title
- optional explanation
- one primary action

---

## 4. Rules

- do not overload with text
- do not use humor
- do not create multiple actions

---

## 5. Summary

Empty states must:
- guide
- reassure
- keep user moving
