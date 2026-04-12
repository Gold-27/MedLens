# MedLens Color Specification (Production-Grade)

---

## 0. Purpose

Define strict color rules for MedLens.

Color in MedLens is not decorative.  
It is a **clinical communication tool** used to:

- guide understanding  
- reduce user error  
- build trust in medical interpretation  

All raw color values must exist only in:

- `design-tokens.css`

---

## 1. Color Philosophy

MedLens follows a **medical-first color philosophy**:

- clarity over aesthetics  
- meaning over branding  
- safety over creativity  

Color must:
- support understanding  
- reduce ambiguity  
- never introduce fear, confusion, or false certainty  

---

## 2. Source of Truth

All colors are defined in:

- `design-tokens.css`

---

### Rules

- Do not define hex, rgb, or hsl values outside tokens  
- Do not override tokens locally  
- Always use semantic variables  

---

### Token Usage (MANDATORY)

All product colors must be referenced through CSS variables defined in `design-tokens.css`.

Examples:

- `var(--color-primary)`  
- `var(--color-on-primary)`  
- `var(--color-surface)`  
- `var(--color-on-surface)`  
- `var(--color-outline)`  
- `var(--color-error)`  

---

### Forbidden

Do NOT hardcode values such as:

- `#25D366`  
- `#ffffff`  
- `#000000`  

Do NOT use:

- raw hex  
- rgb  
- hsl  

when an approved token exists.

---

## 3. Semantic Color Roles (MANDATORY)

All colors used in the UI must map to semantic roles.

---

### Brand and Emphasis

- `--color-primary`  
- `--color-on-primary`  
- `--color-primary-container`  
- `--color-on-primary-container`  

---

### Secondary Support

- `--color-secondary`  
- `--color-on-secondary`  
- `--color-secondary-container`  
- `--color-on-secondary-container`  

---

### Accent / Tertiary

- `--color-tertiary`  
- `--color-on-tertiary`  
- `--color-tertiary-container`  
- `--color-on-tertiary-container`  

---

### Surface System

- `--color-background`  
- `--color-surface`  
- `--color-surface-variant`  
- `--color-surface-container`  
- `--color-surface-container-high`  
- `--color-on-background`  
- `--color-on-surface`  
- `--color-on-surface-variant`  

---

### Borders & Separation

- `--color-outline`  
- `--color-outline-variant`  

---

## 4. Core Principles

---

### 4.1 Clarity Over Decoration

Color must communicate meaning.

- Avoid visual noise  
- Avoid unnecessary color usage  

---

### 4.2 No Misinterpretation

Critical states must never be confused:

- warning ≠ error  
- success ≠ medical safety  

---

### 4.3 Accessibility First

All color usage must remain readable in all conditions.

---

### 4.4 Consistency Builds Trust

The same color must always mean the same thing everywhere.

---

### 4.5 Structured Use of Color (NEW)

Color must ALWAYS be supported by:

- text labels  
- layout structure  
- icons where necessary  

Color alone must never carry meaning.

---

## 5. Color System Structure

---

### 5.1 Primary

Used for:
- main actions (search, submit)  
- key highlights  

Rules:
- calm and trustworthy  
- must not resemble warning or error  

---

### 5.2 Secondary

Used for:
- supporting actions  

Rules:
- must not compete with primary  
- must not represent system state  

---

### 5.3 Tertiary

Used for:
- subtle emphasis  

Rules:
- must not communicate system state  

---

### 5.4 Background

Used for:
- app canvas  

Rules:
- neutral  
- reduce eye strain  

---

### 5.5 Surface

Used for:
- cards  
- panels  

Rules:
- must clearly separate layers  
- must not rely only on shadows  

---

### 5.6 Text Colors

#### Primary Text
- highest contrast  

#### Secondary Text
- supporting content  

#### Muted Text
- low priority  

---

## 6. State Colors (CRITICAL SYSTEM)

---

### Important Rule

State colors must be used conservatively and consistently.

---

### Success (Reframed)

Used for:
- completed actions (e.g. saved successfully)

Rules:
- MUST NOT imply medical safety  
- avoid messaging like:
  - “You are safe”  

---

### Warning

Used for:
- caution  
- possible risks  

Rules:
- clearly visible  
- not overly alarming  

---

### Error

Used for:
- failures  
- invalid input  

Rules:
- must be immediately noticeable  

---

### Info

Used for:
- neutral explanations  

---

## 7. State Priority System (NEW)

When multiple states exist:

Priority order:

1. Error  
2. Warning  
3. Info  
4. Neutral  

Lower-priority colors must visually recede.

---

## 8. Interaction States (NEW)

---

### Disabled State

- must use reduced contrast  
- must remain readable  
- must clearly indicate non-interactive  

---

### Loading State

- must show neutral feedback  
- avoid using error or warning colors  

---

### Active / Pressed State

- must show subtle feedback  
- must not change meaning of color  

---

### Focus State (ACCESSIBILITY)

- must be clearly visible  
- must not rely only on color  
- should include outline or ring  

---

## 9. Accessibility Rules (CRITICAL)

---

### Contrast

- MUST meet WCAG AA  
- AAA preferred for medical content  

---

### No Color-Only Meaning

Always combine with:
- text  
- icons  
- structure  

---

### Color Blind Safety

Avoid:
- red vs green confusion  

Ensure all states are distinguishable.

---

### Real-World Visibility (NEW)

Color must remain readable in:

- bright sunlight  
- low brightness  
- low-quality screens  

---

## 10. Prohibited Practices

---

- using color without meaning  
- using red for non-error states  
- using green to imply medical safety  
- low contrast text  
- competing colors in one view  
- neon or overly saturated colors  
- redefining tokens locally  
- relying on color alone  

---

## 11. Implementation Rules

---

### 11.1 Token Usage Only

Always use semantic tokens.

---

### 11.2 State Mapping

- success → `--color-success`  
- warning → `--color-warning`  
- error → `--color-error`  
- info → `--color-info`  

---

### 11.3 Tailwind Rule (NEW)

If Tailwind is used for layout and spacing:

- color decisions MUST still come from token variables  

---

### 11.4 Component Consistency

Buttons, alerts, and cards must follow consistent color mapping.

---

### 11.5 Testing

All colors must be tested for:

- contrast  
- readability  
- misinterpretation risk  

---

## 12. Component Color Guidelines (NEW)

---

### Buttons

- primary → primary color  
- secondary → secondary color  
- disabled → disabled state  

---

### Alerts

- error → error color  
- warning → warning color  
- info → info color  

---

### Cards

- use surface colors  
- must not compete with alerts  

---

## 13. Final Rules

---

Color in MedLens must always:

- guide decisions clearly  
- reduce medical risk  
- remain accessible  
- avoid emotional manipulation  
- maintain consistency  

---

## Final Principle

If there is any doubt:

Do not rely on color alone.  
Use structure, text, and clarity together.

---

## Success Condition

User can:
- understand system state  
- recognize risk  
- make decisions  

without confusion or misinterpretation.