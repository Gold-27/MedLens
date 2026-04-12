# Loading States Rules

Defines loading behavior across MedLens.

---

## 1. Core Principles

### 1.1 Immediate Feedback
Loading must appear instantly (<100ms).

---

### 1.2 Preserve Layout
Loading must mimic final structure.

---

### 1.3 Reduce Anxiety
Users must know:
- something is happening

---

## 2. Loading Types

---

### 2.1 Inline Loading (Primary)

Used for:
- medication search

UI:
- skeleton summary card

Rules:
- must resemble final layout
- must prevent layout shift

---

### 2.2 Button Loading

Used for:
- login/signup
- export

UI:
- spinner inside button

---

### 2.3 Blocking Loading (Rare)

Used only when:
- entire process must complete

Rules:
- avoid whenever possible

---

## 3. Duration Rules

- must not flicker
- must transition smoothly to result

---

## 4. Summary

Loading must:
- be instant
- be clear
- maintain layout stability