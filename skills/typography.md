# MedLens Typography Specification 

---

## 0. Purpose

Define strict typography rules for MedLens UI.

All typography MUST:
- use design tokens only  
- be consistent across all screens  
- be readable on mobile  
- follow accessibility standards  
- support clarity and safety-first communication  

---

## 1. Font Family

Primary:
- Outfit  

Fallback:
- "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif  

---

## Rules

- Outfit is the primary font  
- Fallback stack MUST always be included  
- UI MUST render correctly even if Outfit fails to load  

---

## 2. Type Scale

All font sizes MUST come from `design-tokens.css`.

---

### Tokens

- --font-display  
- --font-heading  
- --font-subheading  
- --font-body  
- --font-caption  

---

## Rules

- DO NOT use arbitrary font sizes  
- DO NOT use Tailwind font size utilities  
- ALWAYS use tokens  

---

## Minimum Readability Rule (MANDATORY)

- Body text MUST be at least equivalent to 16px  
- Caption text MUST remain readable (avoid overly small sizes)  

---

## Valid Example

font-size: var(--font-body);

---

## Invalid Example

font-size: 18px;  
text-lg  

---

## 3. Typography Roles & Usage

---

### Display

Token: --font-display  
Weight: var(--font-weight-bold)

Use:
- onboarding titles  
- hero text  

---

### Heading

Token: --font-heading  
Weight: var(--font-weight-semibold) or var(--font-weight-bold)

Use:
- screen titles  
- main headers  

---

### Subheading

Token: --font-subheading  
Weight: var(--font-weight-medium) or var(--font-weight-semibold)

Use:
- card titles  
- section headers  

---

### Body

Token: --font-body  
Weight: var(--font-weight-regular)

Use:
- main content  
- summaries  
- instructions  

---

### Caption

Token: --font-caption  
Weight: var(--font-weight-regular)

Use:
- helper text  
- metadata  

---

### Disclaimer (SPECIAL RULE)

- MUST NOT be too small  
- MUST remain clearly readable  
- SHOULD use:
  - --font-body OR
  - a readable caption with increased spacing  

---

## 4. Component Usage Rules

---

### Home Screen

- header → --font-heading  
- input text → --font-body  

---

### Summary Card

- drug name → --font-subheading  
- section titles → --font-subheading  
- body → --font-body  
- disclaimer → readable (NOT tiny caption)  

---

### Cabinet

- title → --font-heading  
- medication name → --font-body  
- metadata → --font-caption  

---

### Interaction Screen

- status → --font-subheading  
- explanation → --font-body  

---

## 5. Font Weight

---

Tokens:

- --font-weight-regular  
- --font-weight-medium  
- --font-weight-semibold  
- --font-weight-bold  

---

## Rules

- body → regular  
- headings → semibold / bold  
- emphasis → medium  
- warnings → semibold or bold  
- no arbitrary weights  

---

## 6. Line Height

---

Tokens:

- --line-height-tight  
- --line-height-normal  
- --line-height-relaxed  

---

## Usage

- headings → tight  
- body → normal  
- long text → relaxed  

---

## Readability Rule

- Avoid dense text blocks  
- Ensure comfortable vertical spacing between sections  

---

## 7. Line Length & Text Width (NEW)

---

- Text MUST NOT stretch edge-to-edge on large screens  
- Maintain readable line length  
- Break long paragraphs into smaller sections  

---

## 8. Color Rules

---

- MUST use color tokens from design-tokens.css  
- DO NOT use hex codes  
- DO NOT use Tailwind color classes  

---

## Valid

color: var(--color-text-primary);

---

## Invalid

color: #000;  
text-black  

---

## Error & Warning Text (NEW)

- Error text MUST use designated error color token  
- Warning text MUST be visually emphasized:
  - stronger color OR
  - increased weight  

---

## 9. Accessibility (MANDATORY)

---

### Readability

- short sentences  
- no dense paragraphs  

---

### Font Size

- body must be readable on mobile  
- never use extremely small text  

---

### Contrast

- MUST meet WCAG AA standards  

---

### Hierarchy

- clear difference between:
  - headings  
  - body  
  - captions  
 
 All text size must be measured in rem and not pixels
- All heading  text must use the clamp function in css
- Low constrast text combination are avoided 
- Text placed on colored surfaces uses the matching "on-*" color token.
---

## 11. ELI12 Mode

---

- shorter sentences  
- more spacing  
- easier scanning  

---

## Rules

- increase spacing between sections  
- reduce cognitive load  
- maintain same hierarchy  

---

## 12. Mobile Rules

---

- avoid dense layouts  
- keep text blocks short  
- maintain vertical spacing  
- ensure text does not overflow screen  

---

## 13. Loading & Skeleton Text 

---

- Skeleton text MUST match final text size  
- Prevent layout shifts during loading  
- Maintain consistent spacing  

---

## 14. Error Text Behavior 

---

Error messages MUST:

- be clearly visible  
- use readable font size (not caption)  
- stand out from normal content  

---

## 15. Performance Considerations

---

- Fonts MUST be preloaded where possible  
- Fallback font MUST render immediately  
- Avoid layout shifts during font loading  

---

## 16. Do’s and Don’ts

---

### Do

- use tokens  
- maintain hierarchy  
- emphasize warnings  
- ensure readability  

---

### Don’t

- use arbitrary sizes  
- use Tailwind typography  
- use hex colors  
- mix fonts  
- hide important information in small text  

---

## 17. Final Rule

Typography must prioritize:

- clarity  
- readability  
- safety  
- speed  

---

## Success Condition

User should be able to:
- read  
- scan  
- understand  

within 30 seconds without confusion or strain.