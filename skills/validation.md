# Validation Rules

Defines how input validation works in MedLens.

Validation must:
- be minimal
- not interrupt user flow
- ensure correct medication search

---

## 1. Core Principles

### 1.1 Guide, Don’t Block
Help users enter correct input without frustration.

---

### 1.2 Keep It Lightweight
Search must feel fast and effortless.

---

### 1.3 Prevent Errors Early
Use autocomplete instead of strict validation.

---

## 2. Validation Types

---

### 2.1 Input Validation (Search)

Rules:
- allow flexible typing
- support partial matches
- support spelling variation

---

### 2.2 Selection Validation

- user must select from autocomplete

Reason:
- ensures valid drug data

---

### 2.3 Auth Validation

Used for:
- login/signup

Examples:
- email format
- password match

---

## 3. Timing

---

### During Typing
- show suggestions
- do not show errors

---

### On Selection
- validate chosen medication

---

### On Submit (Auth Only)
- validate form inputs

---

## 4. Error Messages

Must be:
- simple
- actionable

Examples:
- “Invalid email”
- “Passwords do not match”

---

## 5. Rules

- do not block typing
- do not show early errors
- rely on autocomplete

---

## 6. Summary

Validation must:
- be invisible where possible
- guide users smoothly
- ensure correct selection