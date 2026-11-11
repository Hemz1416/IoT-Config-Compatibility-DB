# DBMS Level 3 Mini-Project: Live Execution & Screenshot Guide

**Project Title:** IoT Device Configuration & Compatibility Database  
**Team Number:** 9  
**Students:** Hitha Shree Suresh (`PES2UG24CS196`), Hemant Ram Nelapati (`PES2UG24CS192`)  
**Target Database:** PostgreSQL 16+ with `pgvector` (`iot_config_db`)

---

## 📌 How to Run These Commands on Your Machine

PostgreSQL and `pgvector` are installed inside your **WSL Ubuntu environment (`Ubuntu-24.04`)**.

You have **two easy options** to run the commands:

### Option 1 (Recommended & Easiest for Screenshots): Enter WSL Once
In PowerShell, run this command once:
```powershell
wsl -d Ubuntu-24.04 -u postgres
```
This drops you directly into the Ubuntu prompt at your project folder:
```bash
postgres@...:/mnt/h/Sem-5/DBMS/Lab/mini_project$
```
From here, `psql` works directly! You can either:
- Enter interactive psql: `psql -d iot_config_db`
- Or run commands directly: `psql -d iot_config_db -f database/schema.sql`

---

### Option 2: Run directly from Windows PowerShell
If you prefer staying in PowerShell without entering WSL, simply prefix your commands with `wsl -d Ubuntu-24.04 -u postgres`:
```powershell
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/schema.sql
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/seed_data.sql
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/validation_queries.sql
```

---

## 📋 Quick Setup (If resetting database to fresh state)

If you entered WSL (Option 1), execute:
```bash
psql -d iot_config_db -f database/schema.sql
psql -d iot_config_db -f database/seed_data.sql
psql -d iot_config_db -f database/validation_queries.sql
```

If staying in PowerShell (Option 2), execute:
```powershell
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/schema.sql
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/seed_data.sql
wsl -d Ubuntu-24.04 -u postgres psql -d iot_config_db -f database/validation_queries.sql
```

---

## 📸 SCREENSHOT 1: Database Connection & pgvector Extension Setup
*Rubric: Database engine connection, version verification, and vector extension enablement.*

### Command:
```sql
SELECT current_database(), current_user, version();
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT current_database(), current_user, version(); SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

### Expected Output:
- `current_database`: `iot_config_db`
- `version`: `PostgreSQL 16.x ...`
- `extname`: `vector` | `extversion`: `0.6.0`

---

## 📸 SCREENSHOT 2: Schema Introspection (11 Tables + 3 Views)
*Rubric: DDL table creation and relational catalog verification.*

### Command:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_type, table_name;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_type, table_name;"
```

### Expected Output:
14 rows:
- 11 `BASE TABLE` (`communication_protocols`, `compatibility`, `components`, `configuration_notes`, `device_components`, `device_protocols`, `device_types`, `devices`, `firmware`, `libraries`, `manufacturers`)
- 3 `VIEW` (`v_active_devices_catalog`, `v_device_compatibility_overview`, `v_device_protocol_summary`)

---

## 📸 SCREENSHOT 3: Schema Evolution via DDL (`ALTER TABLE`)
*Rubric: Demonstrating clean, intentional DDL ALTER TABLE statement.*

### Command:
```sql
-- Verify the column added via ALTER TABLE components ADD COLUMN datasheet_url VARCHAR(255);
SELECT table_name, column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'components' 
  AND column_name = 'datasheet_url';
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT table_name, column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'components' AND column_name = 'datasheet_url';"
```

### Expected Output:
- `table_name`: `components`
- `column_name`: `datasheet_url`
- `data_type`: `character varying`
- `character_maximum_length`: `255`
- `is_nullable`: `YES`

---

## 📸 SCREENSHOT 4: Constraints Introspection (PK, FK, UNIQUE, CHECK)
*Rubric: Referential integrity, primary keys, composite keys, unique rules, and domain check constraints.*

### Command:
```sql
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_name NOT LIKE '%not_null%'
ORDER BY tc.constraint_type, tc.table_name, tc.constraint_name
LIMIT 25;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'public' AND tc.constraint_name NOT LIKE '%not_null%' ORDER BY tc.constraint_type, tc.table_name, tc.constraint_name LIMIT 25;"
```

### Expected Output:
- Lists `CHECK` constraints (e.g. `chk_devices_operating_voltage`, `chk_compatibility_status`), `FOREIGN KEY` constraints, `PRIMARY KEY` constraints, and `UNIQUE` constraints.

---

## 📸 SCREENSHOT 5: Advanced Feature 1 & 2 — Views & Indexes (B-Tree + HNSW Vector)
*Rubric: Performance indexing (HNSW Cosine index) and database views.*

### Command:
```sql
-- 1. Check pgvector HNSW index and key B-tree indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%hnsw%' OR indexname LIKE '%compat%' OR indexname LIKE '%dev%')
ORDER BY tablename, indexname
LIMIT 10;

-- 2. Query View 1: Multi-Table Joined Compatibility Overview
SELECT device_model, component_name, compatibility_status, voltage_compatible, logic_level_compatible 
FROM v_device_compatibility_overview 
LIMIT 5;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND (indexname LIKE '%hnsw%' OR indexname LIKE '%compat%' OR indexname LIKE '%dev%') ORDER BY tablename, indexname LIMIT 10;"
psql -U postgres -d iot_config_db -c "SELECT device_model, component_name, compatibility_status, voltage_compatible, logic_level_compatible FROM v_device_compatibility_overview LIMIT 5;"
```

### Expected Output:
- Index definition showing `USING hnsw (embedding vector_cosine_ops) WITH (m='16', ef_construction='64')`.
- Clean rows from the analytical view joining devices and components.

---

## 📸 SCREENSHOT 6: Advanced Feature 3 — Stored Function & Trigger Verification
*Rubric: Automated database trigger firing on UPDATE.*

### Command:
```sql
-- Step A: Inspect trigger and routine registration
SELECT trigger_name, event_manipulation, event_object_table, action_timing 
FROM information_schema.triggers 
WHERE trigger_name = 'trg_config_notes_updated_at';

-- Step B: Inspect timestamp BEFORE update
SELECT note_id, title, updated_at FROM configuration_notes WHERE note_id = 1;

-- Step C: Perform update
UPDATE configuration_notes 
SET content = content || ' [Bench verified with ESP32-WROOM-32 hardware].' 
WHERE note_id = 1;

-- Step D: Inspect timestamp AFTER update (automatically updated by trigger)
SELECT note_id, title, updated_at FROM configuration_notes WHERE note_id = 1;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT trigger_name, event_manipulation, event_object_table, action_timing FROM information_schema.triggers WHERE trigger_name = 'trg_config_notes_updated_at';"
psql -U postgres -d iot_config_db -c "SELECT note_id, title, updated_at FROM configuration_notes WHERE note_id = 1; UPDATE configuration_notes SET content = content || ' [Bench verified with ESP32-WROOM-32 hardware].' WHERE note_id = 1; SELECT note_id, title, updated_at FROM configuration_notes WHERE note_id = 1;"
```

### Expected Output:
- `trg_config_notes_updated_at` | `UPDATE` | `configuration_notes` | `BEFORE`
- `updated_at` timestamp noticeably updates to the current system time!

---

## 📸 SCREENSHOT 7: DML Operations — Aggregation with HAVING Clause
*Rubric: Advanced SQL grouping and HAVING filter.*

### Command:
```sql
-- Boards supporting at least 4 communication protocols
SELECT 
    d.model_name AS device_model,
    m.name AS manufacturer,
    COUNT(dp.protocol_id) AS supported_protocols_count,
    STRING_AGG(p.protocol_name, ', ' ORDER BY p.protocol_name) AS protocols_list
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_protocols dp ON d.device_id = dp.device_id
JOIN communication_protocols p ON dp.protocol_id = p.protocol_id
GROUP BY d.device_id, d.model_name, m.name
HAVING COUNT(dp.protocol_id) >= 4
ORDER BY supported_protocols_count DESC, d.model_name;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT d.model_name AS device_model, m.name AS manufacturer, COUNT(dp.protocol_id) AS supported_protocols_count, STRING_AGG(p.protocol_name, ', ' ORDER BY p.protocol_name) AS protocols_list FROM devices d JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id JOIN device_protocols dp ON d.device_id = dp.device_id JOIN communication_protocols p ON dp.protocol_id = p.protocol_id GROUP BY d.device_id, d.model_name, m.name HAVING COUNT(dp.protocol_id) >= 4 ORDER BY supported_protocols_count DESC, d.model_name;"
```

### Expected Output:
3 rows:
- `ESP32-WROOM-32` | 6 protocols
- `Raspberry Pi Pico W` | 6 protocols
- `Arduino Uno Rev3` | 4 protocols

---

## 📸 SCREENSHOT 8: DML Operations — Transaction-Safe DELETE
*Rubric: Safe DELETE statement within an ACID transaction block without data loss.*

### Command:
```sql
BEGIN;
-- 1. Insert temporary prototype
INSERT INTO devices (manufacturer_id, device_type_id, model_name, operating_voltage, logic_level_voltage, status)
VALUES (1, 1, 'TEMP-TEST-PROTOTYPE-V1', 3.30, 3.30, 'PROTOTYPE');

-- 2. Confirm row exists
SELECT device_id, model_name, status, created_at FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';

-- 3. Delete row
DELETE FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';

-- 4. Confirm clean deletion (returns 0 rows)
SELECT device_id, model_name FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';
COMMIT;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "BEGIN; INSERT INTO devices (manufacturer_id, device_type_id, model_name, operating_voltage, logic_level_voltage, status) VALUES (1, 1, 'TEMP-TEST-PROTOTYPE-V1', 3.30, 3.30, 'PROTOTYPE'); SELECT device_id, model_name, status, created_at FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1'; DELETE FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1'; SELECT device_id, model_name FROM devices WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1'; COMMIT;"
```

### Expected Output:
- `INSERT 0 1`
- 1 row showing `TEMP-TEST-PROTOTYPE-V1`
- `DELETE 1`
- `(0 rows)` showing clean removal
- `COMMIT`

---

## 📸 SCREENSHOT 9: Advanced Feature 4 — Vector Semantic Search (`pgvector`)
*Rubric: AI vector database search using cosine distance operator `<=>`.*

### Command:
```sql
-- Cosine distance similarity search on technical setup notes
WITH query_vector AS (
    SELECT embedding FROM configuration_notes WHERE note_id = 1
)
SELECT 
    cn.note_id,
    d.model_name AS target_device,
    comp.component_name AS target_component,
    cn.title,
    cn.note_type,
    ROUND((1 - (cn.embedding <=> qv.embedding))::numeric, 4) AS cosine_similarity_score
FROM configuration_notes cn
CROSS JOIN query_vector qv
LEFT JOIN devices d ON cn.device_id = d.device_id
LEFT JOIN components comp ON cn.component_id = comp.component_id
ORDER BY cn.embedding <=> qv.embedding
LIMIT 3;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "WITH query_vector AS (SELECT embedding FROM configuration_notes WHERE note_id = 1) SELECT cn.note_id, d.model_name AS target_device, comp.component_name AS target_component, cn.title, cn.note_type, ROUND((1 - (cn.embedding <=> qv.embedding))::numeric, 4) AS cosine_similarity_score FROM configuration_notes cn CROSS JOIN query_vector qv LEFT JOIN devices d ON cn.device_id = d.device_id LEFT JOIN components comp ON cn.component_id = comp.component_id ORDER BY cn.embedding <=> qv.embedding LIMIT 3;"
```

### Expected Output:
- Returns top 3 nearest neighbor notes, with note 1 having exact cosine similarity score of `1.0000`, followed by semantic rankings (`0.0408`, `0.0226`).

---

## 📸 SCREENSHOT 10: Actual Seeded Row Counts Verification
*Rubric: Complete population verification (81 total records across all 11 tables).*

### Command:
```sql
SELECT 'communication_protocols' AS table_name, COUNT(*) AS row_count FROM communication_protocols
UNION ALL SELECT 'compatibility', COUNT(*) FROM compatibility
UNION ALL SELECT 'components', COUNT(*) FROM components
UNION ALL SELECT 'configuration_notes', COUNT(*) FROM configuration_notes
UNION ALL SELECT 'device_components', COUNT(*) FROM device_components
UNION ALL SELECT 'device_protocols', COUNT(*) FROM device_protocols
UNION ALL SELECT 'device_types', COUNT(*) FROM device_types
UNION ALL SELECT 'devices', COUNT(*) FROM devices
UNION ALL SELECT 'firmware', COUNT(*) FROM firmware
UNION ALL SELECT 'libraries', COUNT(*) FROM libraries
UNION ALL SELECT 'manufacturers', COUNT(*) FROM manufacturers
ORDER BY table_name;
```

### Or run directly from terminal:
```bash
psql -U postgres -d iot_config_db -c "SELECT 'communication_protocols' AS table_name, COUNT(*) AS row_count FROM communication_protocols UNION ALL SELECT 'compatibility', COUNT(*) FROM compatibility UNION ALL SELECT 'components', COUNT(*) FROM components UNION ALL SELECT 'configuration_notes', COUNT(*) FROM configuration_notes UNION ALL SELECT 'device_components', COUNT(*) FROM device_components UNION ALL SELECT 'device_protocols', COUNT(*) FROM device_protocols UNION ALL SELECT 'device_types', COUNT(*) FROM device_types UNION ALL SELECT 'devices', COUNT(*) FROM devices UNION ALL SELECT 'firmware', COUNT(*) FROM firmware UNION ALL SELECT 'libraries', COUNT(*) FROM libraries UNION ALL SELECT 'manufacturers', COUNT(*) FROM manufacturers ORDER BY table_name;"
```

### Expected Output:
All 11 tables listed with their exact counts totaling **81 records**.

---

## 🎯 Summary Checklist for Your Submission Report

| Screenshot # | What to Label in Your Report | Rubric Requirement Covered |
|:---:|---|---|
| **1** | PostgreSQL 16 Connection & pgvector Extension | Database Engine & Extension Setup |
| **2** | Schema Introspection (11 Tables + 3 Views) | DDL Table Creation |
| **3** | Schema Evolution via ALTER TABLE | DDL Schema Modification |
| **4** | Table Constraints (PK, FK, UNIQUE, CHECK) | Referential Integrity & Domain Rules |
| **5** | Analytical Views & HNSW Vector Index | Advanced Feature 1 (Views) & 2 (Indexes) |
| **6** | Trigger `trg_config_notes_updated_at` & Stored Function | Advanced Feature 3 (Triggers & Functions) |
| **7** | Aggregation with GROUP BY and HAVING Clause | DML Complex Aggregations |
| **8** | Transaction-Safe DELETE Statement | DML Data Manipulation (Safe Removal) |
| **9** | Vector Cosine Similarity Search (`pgvector`) | Advanced Feature 4 (Vector Database) |
| **10** | Database Record Counts (81 Total Seed Records) | Data Population & Verification |
