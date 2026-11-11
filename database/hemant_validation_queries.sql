-- ============================================================================
-- DBMS Experiential Learning - Level 3 Mini-Project (Team 9)
-- Project : IoT Device Configuration & Compatibility Database
-- Author  : Hemant Ram Nelapati (SRN: PES2UG24CS192)
-- File    : hemant_validation_queries.sql
-- Scope   : Trigger verification (UPDATE), ACID transaction-safe DELETE,
--           and pgvector cosine similarity semantic search.
--
-- Extracted from database/validation_queries.sql (queries 11-13).
-- ============================================================================

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
