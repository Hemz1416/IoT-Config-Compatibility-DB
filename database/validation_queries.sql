-- ============================================================================
-- DBMS Experiential Learning - Level 3 Mini-Project
-- Team Number : 9
-- Project Title: IoT Device Configuration & Compatibility Database
-- File        : validation_queries.sql
-- Description : Complete SQL Demonstration covering DDL, DML, Aggregations,
--               Subqueries, Views, Triggers, and pgvector Semantic Search.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. [DDL / Schema Introspection] List All 11 Base Tables & Views in Public Schema
-- Features: SELECT, WHERE, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;

-- ----------------------------------------------------------------------------
-- 2. [DDL Constraints Verification] Primary Keys, Foreign Keys, Unique & Check Rules
-- Features: SELECT, JOIN, WHERE, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- 3. [Advanced Feature: Indexes] B-Tree and pgvector HNSW Cosine Vector Indexes
-- Features: SELECT, WHERE, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- 4. [Advanced Feature: View 1] Multi-Table Joined Compatibility Overview View
-- Features: VIEW SELECT, ORDER BY (Underlying View: 5-table JOIN + 2 LEFT JOINs)
-- ----------------------------------------------------------------------------
SELECT 
    device_model,
    component_name,
    component_interface,
    compatibility_status,
    voltage_compatible,
    logic_level_compatible,
    library_name,
    notes
FROM v_device_compatibility_overview
ORDER BY device_model, component_name;

-- ----------------------------------------------------------------------------
-- 5. [Advanced Feature: View 2] Device Communication Protocols Summary View
-- Features: VIEW SELECT, ORDER BY (Underlying View: 2 JOINs, GROUP BY, STRING_AGG, COUNT)
-- ----------------------------------------------------------------------------
SELECT 
    model_name,
    manufacturer,
    supported_protocols,
    protocol_count
FROM v_device_protocol_summary
ORDER BY protocol_count DESC;

-- ----------------------------------------------------------------------------
-- 6. [Advanced Feature: View 3] Active Devices Hardware Specifications Catalog
-- Features: VIEW SELECT, WHERE, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    model_name,
    manufacturer_name,
    device_type,
    microcontroller,
    operating_voltage,
    logic_level_voltage,
    clock_speed_mhz,
    flash_memory_kb,
    sram_kb
FROM v_active_devices_catalog
ORDER BY clock_speed_mhz DESC;

-- ----------------------------------------------------------------------------
-- 7. [DML: SELECT + Multi-Table JOIN] Devices Supporting Wi-Fi with Flash >= 2048 KB
-- Features: SELECT, JOIN (4 Tables: devices, manufacturers, device_protocols, communication_protocols), WHERE, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    d.model_name,
    m.name AS manufacturer,
    d.microcontroller,
    d.clock_speed_mhz,
    d.flash_memory_kb,
    d.sram_kb,
    p.protocol_name
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_protocols dp ON d.device_id = dp.device_id
JOIN communication_protocols p ON dp.protocol_id = p.protocol_id
WHERE p.protocol_name LIKE '%Wi-Fi%'
  AND d.flash_memory_kb >= 2048
ORDER BY d.flash_memory_kb DESC;

-- ----------------------------------------------------------------------------
-- 8. [DML: GROUP BY + Aggregate + Subquery] Compatibility Status Breakdown & Percentage
-- Features: SELECT, GROUP BY, Aggregate (COUNT, ROUND), Scalar Subquery, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    compatibility_status,
    COUNT(*) AS total_evaluations,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM compatibility), 1) AS percentage
FROM compatibility
GROUP BY compatibility_status
ORDER BY total_evaluations DESC;

-- ----------------------------------------------------------------------------
-- 9. [DML: GROUP BY + HAVING] Boards Supporting at least 4 Communication Protocols
-- Features: SELECT, JOIN (4 Tables), GROUP BY, HAVING, Aggregate (COUNT, STRING_AGG), ORDER BY
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. [DML: CASE WHEN Conditional Logic] Components Requiring Level Shifters / Pullups
-- Features: SELECT, CASE WHEN, JOIN (3 Tables), WHERE IN, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    d.model_name AS microcontroller_board,
    d.logic_level_voltage AS board_logic_v,
    comp.component_name AS attached_sensor,
    comp.logic_level_voltage AS sensor_logic_v,
    c.compatibility_status,
    CASE 
        WHEN c.compatibility_status = 'REQUIRES_LEVEL_SHIFTER' 
            THEN 'Bi-directional logic level converter (e.g., TXS0108E) needed'
        WHEN c.compatibility_status = 'REQUIRES_PULLUP_RESISTOR' 
            THEN 'Install 4.7k - 10k Ohm pullup to 3.3V/5V bus'
        ELSE 'Standard direct wire connection'
    END AS engineering_action
FROM compatibility c
JOIN devices d ON c.device_id = d.device_id
JOIN components comp ON c.component_id = comp.component_id
WHERE c.compatibility_status IN ('REQUIRES_LEVEL_SHIFTER', 'REQUIRES_PULLUP_RESISTOR')
ORDER BY d.model_name, comp.component_name;

-- ----------------------------------------------------------------------------
-- 11. [DML: UPDATE & Advanced Feature: TRIGGER Verification]
-- Demonstrates row update and automatic updated_at timestamp modification by trigger.
-- ----------------------------------------------------------------------------
-- Step 11a: Inspect current timestamp
SELECT note_id, title, updated_at 
FROM configuration_notes 
WHERE note_id = 1;

-- Step 11b: Perform idempotent update on content
UPDATE configuration_notes 
SET content = REPLACE(content, ' [Bench verified with ESP32-WROOM-32 Revision 3 hardware].', '') || ' [Bench verified with ESP32-WROOM-32 Revision 3 hardware].'
WHERE note_id = 1;

-- Step 11c: Verify updated_at was automatically updated by trg_config_notes_updated_at
SELECT note_id, title, updated_at 
FROM configuration_notes 
WHERE note_id = 1;

-- ----------------------------------------------------------------------------
-- 12. [DML: Transaction-Safe DELETE Demonstration]
-- Safely demonstrates record insertion and deletion within an ACID transaction block.
-- ----------------------------------------------------------------------------
BEGIN;
-- Step 12a: Insert temporary test prototype device
INSERT INTO devices (manufacturer_id, device_type_id, model_name, operating_voltage, logic_level_voltage, status)
VALUES (1, 1, 'TEMP-TEST-PROTOTYPE-V1', 3.30, 3.30, 'PROTOTYPE');

-- Step 12b: Confirm row existence
SELECT device_id, model_name, status, created_at 
FROM devices 
WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';

-- Step 12c: Perform DELETE operation
DELETE FROM devices 
WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';

-- Step 12d: Verify clean deletion (returns 0 rows)
SELECT device_id, model_name 
FROM devices 
WHERE model_name = 'TEMP-TEST-PROTOTYPE-V1';
COMMIT;

-- ----------------------------------------------------------------------------
-- 13. [Advanced Feature: pgvector Cosine Similarity Semantic Search]
-- Searches configuration technical notes matching a query vector using <=> operator.
-- ----------------------------------------------------------------------------
-- Query vector simulates searching for: "How to connect ESP32 to I2C sensor like BME280"
WITH query_vector AS (
    SELECT embedding FROM configuration_notes WHERE note_id = 1
)
SELECT 
    cn.note_id,
    d.model_name AS target_device,
    comp.component_name AS target_component,
    cn.title,
    cn.note_type,
    ROUND((1 - (cn.embedding <=> qv.embedding))::numeric, 4) AS cosine_similarity_score,
    cn.content
FROM configuration_notes cn
CROSS JOIN query_vector qv
LEFT JOIN devices d ON cn.device_id = d.device_id
LEFT JOIN components comp ON cn.component_id = comp.component_id
ORDER BY cn.embedding <=> qv.embedding
LIMIT 3;
