# MedQuire Database Schema Specification
---

## 0. Purpose

This document defines the database structure for MedQuire.

The database is managed using Supabase (PostgreSQL).

The system is designed to be:

- minimal  
- privacy-first  
- resilient  
- scalable  

---

## 1. General Database Principles

---

### 1.1 Minimal Storage

Store ONLY what is necessary:

- user identity  
- user-specific state (cabinet)

---

### 1.2 No Medical Authority

The database is NOT a medical source.

- Drug data → OpenFDA  
- Summaries → generated dynamically  

---

### 1.3 Schema-First Design

- all data must follow strict structure  
- no unstructured or inconsistent storage  

---

### 1.4 Regeneration Over Storage

- AI summaries MUST NOT be permanently stored  
- summaries must be regenerated when needed  

---

### 1.5 Consistency Over Convenience

- enforce constraints at database level  
- avoid duplicate records  

---

### 1.6 Privacy First

- no sensitive health records  
- no unnecessary tracking  
- minimal user data retention  

---

## 2. Core Entities Overview

---

MedQuire consists of two core entities:

---

### 2.1 User

Represents an authenticated user.

Managed by:
- Supabase Auth  

---

### 2.2 Cabinet Item

Represents a saved medication.

Stores:
- normalized drug reference  
- minimal metadata  

---

## 3. Tables Overview

---

### Tables Used

1. users (managed by Supabase Auth)  
2. cabinet_items  

---

## 4. Users Table (Supabase Auth)

---

### Fields

- id (UUID, primary key)  
- email (string)  
- created_at (timestamp)  

---

### Notes

- password is handled securely by Supabase  
- supports email/password and OAuth  
- no custom auth logic required  

---

## 5. Cabinet Items Table

---

### Purpose

Stores user-saved medications safely and consistently.

---

### Fields

- id (UUID, primary key)  

- user_id (UUID, foreign key → users.id)  

- drug_name (string, required)  
- drug_key (string, required, normalized identifier)  

- source (string, default: "OpenFDA")  

- created_at (timestamp)  
- updated_at (timestamp)  
- last_accessed_at (timestamp, optional)  

- deleted_at (timestamp, nullable for soft delete)

---

## 6. Critical Design Decisions

---

### 6.1 No Summary Storage (CRITICAL)

The database MUST NOT store:

- AI-generated summaries  
- full OpenFDA responses  

Reason:
- prevents stale or outdated data  
- ensures consistency with live data  
- reduces storage complexity  

---

### 6.2 Normalized Drug Identifier

Each drug MUST have:

- `drug_key` → normalized identifier  

Purpose:
- prevents duplicates  
- ensures accurate interaction checks  
- supports consistent lookups  

---

### 6.3 Display vs System Data

- `drug_name` → for UI display  
- `drug_key` → for system logic  

---

## 7. Constraints & Indexing

---

### 7.1 Unique Constraint (MANDATORY)

Prevent duplicate saves:

- UNIQUE(user_id, drug_key)

---

### 7.2 Required Fields

- user_id must exist  
- drug_name must exist  
- drug_key must exist  

---

### 7.3 Indexing (PERFORMANCE)

Indexes MUST exist on:

- user_id  
- drug_key  

---

### 7.4 Foreign Key Constraint

- user_id → references users.id  

---

## 8. Data Flow Integration

---

### 8.1 Save Medication Flow

1. user taps “Save”  
2. system checks authentication  
3. backend validates drug_key  
4. insert into cabinet_items  

---

### 8.2 Retrieve Cabinet Flow

1. user opens cabinet  
2. fetch all non-deleted items  
3. order by created_at DESC  
4. display list  

---

### 8.3 Load Medication Flow

1. user selects item  
2. system uses drug_key  
3. fetch fresh data from OpenFDA  
4. regenerate summary  

---

### 8.4 Interaction Checker Flow

1. user selects multiple items  
2. system uses drug_key (NOT name)  
3. query OpenFDA  
4. return validated result  

---

## 9. Data Integrity Rules

---

### Validation

- drug_key must be valid  
- drug_name must not be empty  

---

### Partial Data Handling

- database stores only identifiers  
- all medical data comes from APIs  

---

### Deletion Rules

- soft delete using `deleted_at`  
- do not permanently remove immediately  

---

## 10. Security

---

### 10.1 Row-Level Security (RLS)

- users can only access their own data  

---

### 10.2 Authentication Required

- all cabinet operations require login  

---

### 10.3 Data Protection

- all requests over HTTPS  
- Supabase handles authentication securely  

---

### 10.4 API Key Safety

- no API keys stored in database  
- keys handled server-side only  

---

## 11. Logging & Monitoring

---

System SHOULD track:

- failed insertions  
- duplicate attempts  
- unusual usage patterns  

Purpose:

- debugging  
- system reliability  

---

## 12. Scalability Considerations

---

- support growing number of users  
- efficient querying with indexes  
- minimal storage footprint  
- fast read operations  

---

## 13. Minimum Viable Schema vs Preferred Schema

---

### MVP Schema

- users  
- cabinet_items:
  - id  
  - user_id  
  - drug_name  
  - drug_key  
  - created_at  

---

### Preferred (Production) Schema

Adds:

- updated_at  
- last_accessed_at  
- deleted_at  
- source  

---

## 14. What Is NOT Stored (CRITICAL)

The system MUST NOT store:

- full OpenFDA responses  
- interaction results  
- user medical history  
- dosage schedules  
- AI-generated summaries  

---

## 15. Final Build Rules

---

System MUST:

- enforce unique constraints  
- use normalized drug identifiers  
- avoid storing derived medical data  
- always fetch fresh data when needed  
- maintain strict privacy boundaries  

---

## Final Database Summary

The MedQuire database is:

- minimal → only essential data  
- safe → no sensitive medical storage  
- consistent → schema-first  
- scalable → optimized for growth  

---

### Success Condition

The database must:

- store user-specific state only  
- remain fast and reliable  
- never become a source of medical truth