# IoT Device Configuration & Compatibility Database

**DBMS Experiential Learning — Level 3 Mini-Project**  
**Team Number:** 9  
**Students:**  
- **Hitha Shree Suresh** (SRN: `PES2UG24CS196`)  
- **Hemant Ram Nelapati** (SRN: `PES2UG24CS192`)  

> **Repository status — Hemant Ram Nelapati's contribution (`PES2UG24CS192`).**
> This repository currently contains only Hemant's share of the project:
> - `frontend/` — Next.js 15 web application (API routes, pgvector search UI, trigger audit, DB explorer)
> - `database/hemant_vector_and_triggers.sql` — pgvector extension, `ALTER TABLE`, PL/pgSQL trigger, HNSW index
> - `database/hemant_validation_queries.sql` — trigger verification `UPDATE`, ACID `DELETE`, `<=>` vector search
> - `evidence/` and `9_DDL.pdf` — execution evidence screenshots and evidence PDF generator
> - `SCREENSHOT_COMMANDS_GUIDE.md` — terminal execution & screenshot guide
>
> Hitha Shree Suresh's share (ER diagram, normalization, base tables & constraints, views, seed data, analytical queries, design docs) will be added separately. Files listed in the structure below that are not present yet belong to that part.

**Database Paradigm:** SQL + Vector Database  
**Technologies:** PostgreSQL 16.15, `pgvector` extension (v0.6.0)  

---

## 📁 Repository Structure & Submission Artifacts

```
mini_project/
├── 9_Diagrams.pdf                      # ⭐ Official Submission File: ER & Relational Schema Diagrams (Exact 2 Pages)
├── 9_DDL.pdf                           # ⭐ Official Submission File: DDL Execution Screenshots & Evidence Report
├── 9_DDL.sql                           # ⭐ Official Submission File: Executed DDL SQL Queries (Submission Copy)
├── database/
│   ├── schema.sql                      # Canonical Development & Source DDL (11 Tables, Constraints, Indexes, Views, Trigger)
│   ├── seed_data.sql                   # Realistic IoT Hardware Test/Seed Dataset (81 Records)
│   └── validation_queries.sql          # Complete Validation Queries (DDL, DML, HAVING, UPDATE, Safe DELETE, Vector Search)
├── diagrams/
│   ├── ER_Diagram.png                  # Plain High-Resolution ER Diagram (Textbook / draw.io style)
│   ├── ER_Diagram.pdf                  # Vector ER Diagram (PDF)
│   ├── Schema_Diagram.png              # High-Resolution Relational Schema Diagram (PNG)
│   ├── Schema_Diagram.pdf              # Vector Relational Schema Diagram (PDF)
│   └── generate_diagrams.py            # Automated Diagram & 2-Page PDF Generator Script
├── documentation/
│   ├── relational_schema.md            # Comprehensive Data Dictionary & Column Specifications
│   ├── database_design.md              # Domain Architecture, 3NF Normalization, 4 Advanced Features & Vector Strategy
│   ├── FINAL_ACCURACY_AUDIT_REPORT.md   # ⭐ Comprehensive Evidence-Backed Audit Report (12 Verification Passes)
│   └── PRESENTATION_GUIDE.md           # ⭐ Presentation Script, Timing & Exhaustive Viva Voce Defense Guide
├── evidence/
│   ├── 1.png - 10.png                  # Authentic Live Terminal Screenshots (Screenshots 1 through 10)
│   └── generate_evidence_pdf.py        # Automated Evidence PDF Compiler Script (compiles 9_DDL.pdf)
├── SCREENSHOT_COMMANDS_GUIDE.md        # Step-by-Step Terminal Execution & Screenshot Guide
└── README.md                           # Setup, Execution Guide & Grading Summary
```

---

## 🚀 Quick Setup & Execution Guide

### 1. Prerequisites
- **PostgreSQL 16+** with the **`pgvector`** extension installed.
- (Optional) **Python 3.10+** with `matplotlib`, `pillow`, and `reportlab` if regenerating diagrams or evidence.

---

### 2. Database Creation & Setup

Connect to your PostgreSQL server using `psql`:

```bash
# Connect as superuser and create the project database
psql -U postgres -c "CREATE DATABASE iot_config_db;"
```

---

### 3. Executing SQL Scripts (In Order)

Execute the scripts in the following exact sequence:

```bash
# Step 1: Execute DDL Schema (Creates Extension, 11 Tables, Constraints, ALTER TABLE, Trigger, Indexes, Views)
psql -U postgres -d iot_config_db -f database/schema.sql

# Step 2: Populate Realistic Seed Data (81 records across all 11 tables with 384d vector embeddings)
psql -U postgres -d iot_config_db -f database/seed_data.sql

# Step 3: Run Validation & Semantic Search Queries (Introspection, DML, HAVING, UPDATE, Safe DELETE, pgvector)
psql -U postgres -d iot_config_db -f database/validation_queries.sql
```

*(Note: `database/schema.sql` is the canonical development source; `9_DDL.sql` at the root directory contains the identical synchronized DDL script for academic submission).*

---

## 🔍 Verification & Key Features

### 1. Relational Schema Introspection
Verify all 11 tables and 3 views in the `public` schema:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_type, table_name;
```

### 2. DDL Schema Evolution (`ALTER TABLE`)
Verify the `datasheet_url` column added via `ALTER TABLE`:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'components' AND column_name = 'datasheet_url';
```

### 3. Advanced Feature: Automated Timestamp Trigger
Test row updates and verify that `trg_config_notes_updated_at` automatically modifies `updated_at` (idempotent):
```sql
UPDATE configuration_notes 
SET content = REPLACE(content, ' [Bench verified: 3.3V logic confirmed].', '') || ' [Bench verified: 3.3V logic confirmed].'
WHERE note_id = 1;

SELECT note_id, title, updated_at FROM configuration_notes WHERE note_id = 1;
```

### 4. Advanced Feature: Semantic Vector Similarity Search (`pgvector`)
Search technical documentation notes using cosine distance (`<=>` operator):
```sql
WITH query_vector AS (
    SELECT embedding FROM configuration_notes WHERE note_id = 1
)
SELECT 
    cn.note_id,
    d.model_name AS target_device,
    cn.title,
    ROUND((1 - (cn.embedding <=> qv.embedding))::numeric, 4) AS cosine_similarity_score,
    cn.content
FROM configuration_notes cn
CROSS JOIN query_vector qv
LEFT JOIN devices d ON cn.device_id = d.device_id
ORDER BY cn.embedding <=> qv.embedding
LIMIT 3;
```

---

## 🎨 Regenerating Diagrams & Evidence PDFs

To programmatically regenerate the diagrams and execution evidence PDFs:

```bash
# Generate ER_Diagram, Schema_Diagram, and exact 2-page 9_Diagrams.pdf
python diagrams/generate_diagrams.py

# Compile live authentic PostgreSQL terminal evidence screenshots into 9_DDL.pdf
python evidence/generate_evidence_pdf.py
```

---

## 📋 Faculty Submission Checklist

| Requirement | Submission File | Format | Description / Status |
|-------------|-----------------|--------|----------------------|
| **Diagrams (ER & Schema)** | `9_Diagrams.pdf` | PDF (Exact 2 Pages) | ✅ **Ready** (Page 1: ER Diagram, Page 2: Schema Diagram) |
| **DDL Query Execution Screenshots** | `9_DDL.pdf` | PDF (Exact 4 Pages) | ✅ **Ready** (Live PostgreSQL 16 evidence, authentic screenshots 1-10) |
| **SQL File Containing Executed DDL** | `9_DDL.sql` | SQL | ✅ **Ready** (Synchronized DDL with CREATE, ALTER, DROP, Trigger) |

---

## 📖 Comprehensive Guides & Documentation
- **[Final Accuracy Audit Report](documentation/FINAL_ACCURACY_AUDIT_REPORT.md):** 12-section exhaustive audit cross-verifying all written documentation against the live PostgreSQL 16.15 catalog and pgvector implementation.
- **[Presentation & Viva Defense Guide](documentation/PRESENTATION_GUIDE.md):** Complete 10-12 minute slide-by-slide pitch script, team member division of responsibilities, live query execution guide, and 10 detailed viva voce Q&A answers.
- **[Database Design & Normalization](documentation/database_design.md):** 3NF normalization proof, 50 constraints catalog, and HNSW vector architecture.
- **[Relational Schema Specification](documentation/relational_schema.md):** Column-by-column data dictionary and referential integrity action mapping.

