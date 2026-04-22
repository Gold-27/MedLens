# MedQuire API Handling Specification (Production-Grade)

---

## 0. Purpose

This document defines how API interactions work in MedQuire.

It ensures:

- safe medical interpretation  
- reliable data flow  
- fast and responsive user experience  
- resilience to real-world failures  

---

## 1. Core Principles

---

### 1.1 No Data Fabrication (CRITICAL)

The system MUST NEVER:

- generate medical facts  
- infer missing information  
- modify source data  

If data is missing:
→ clearly communicate uncertainty  

---

### 1.2 Rewrite Only (AI Constraint)

DeepSeek MUST:

- only transform OpenFDA data  
- not introduce new medical advice  
- not change meaning  

---

### 1.3 Trust Over Completeness

If complete data is unavailable:

- return partial data safely OR  
- return “not found”  

Never fake completeness  

---

### 1.4 Resilience Over Perfection

System MUST continue working when:

- OpenFDA fails  
- DeepSeek fails  
- network is unstable  

---

### 1.5 Defined Performance Targets

- loading feedback: < 100ms  
- API response timeout: 5–8 seconds  
- retry limit: max 2 attempts  

---

## 2. API Architecture Flow

---

### Standard Flow

User Input  
→ Backend Validation  
→ OpenFDA Request  
→ Data Normalization  
→ DeepSeek Transformation  
→ Response Validation  
→ UI Render  

---

### Fallback Flow (CRITICAL)

If DeepSeek fails:

→ return normalized OpenFDA data only  
→ allow user to retry AI  

---

If OpenFDA fails:

→ return error state  
→ allow retry  

---

## 3. Request Handling Rules

---

### 3.1 Debounce (Autocomplete)

- delay requests by 300–500ms  
- prevent excessive API calls  

---

### 3.2 Cancel Stale Requests

- cancel previous requests on new input  
- only latest request should resolve  

---

### 3.3 Prevent Duplicate Requests

- disable repeated triggers  
- deduplicate identical requests  

---

### 3.4 Timeout Handling

- max wait: 5–8 seconds  
- if exceeded:
  - cancel request  
  - show retry option  

---

### 3.5 Retry Strategy

- max retries: 2  
- use exponential backoff  
- do not retry invalid requests  

---

### 3.6 Rate Limit Handling

- detect HTTP 429 responses  
- apply backoff  
- show user-friendly message  

---

## 4. Data Processing Pipeline

---

### 4.1 OpenFDA Request

- fetch drug label data  
- validate response structure  

---

### 4.2 Data Normalization (CRITICAL)

Before AI:

- clean inconsistent fields  
- extract valid sections:
  - usage  
  - dosage  
  - warnings  
  - side effects  

---

### 4.3 DeepSeek Processing

- input: structured normalized data  
- output: structured summary  

---

### 4.4 Response Validation

Backend MUST ensure:

- required schema keys exist  
- values may be null  
- at least one valid section exists  

---

## 5. Response Contract

---

### Structure

```json
{
  "drug_name": "string",
  "source": "OpenFDA",
  "summary": {
    "what_it_does": "string | null",
    "how_to_take": "string | null",
    "warnings": "string | null",
    "side_effects": "string | null"
  },
  "eli12": {
    "enabled": "boolean",
    "content": "string | null"
  }
}
